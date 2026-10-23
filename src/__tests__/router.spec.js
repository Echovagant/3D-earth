// @vitest-environment node
// 路由表的契约测试。
//
// 之前真实路由表从未被任何测试导入过——App.spec.js 用一个自建的单路由 router
// 替换了它，所以 6 条路由的路径、name、props 约定与 404 兜底一条都没被验证过。
import { describe, it, expect } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { routes } from '../router/routes'

const makeRouter = () => createRouter({ history: createMemoryHistory(), routes })

describe('路由表', () => {
  it('每条具名路由的路径唯一且 name 不重复', () => {
    const paths = routes.map((r) => r.path)
    expect(new Set(paths).size).toBe(paths.length)

    const names = routes.filter((r) => r.name).map((r) => r.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('带参数的三级路由都开了 props——页面靠它拿 adcode / iso3', () => {
    // 兜底路由也带 :pathMatch，但它只做重定向，不需要 props
    const withParams = routes.filter((r) => r.path.includes(':') && !r.redirect)
    expect(withParams.length).toBeGreaterThan(0)
    for (const route of withParams) {
      expect(route.props).toBe(true)
    }
  })

  it('参数名与页面约定的入参一致', () => {
    const byName = Object.fromEntries(routes.map((r) => [r.name, r]))
    expect(byName.Province.path).toBe('/province/:adcode')
    expect(byName.Country.path).toBe('/country/:iso3')
  })

  it('包含教学页面的路由', () => {
    const paths = routes.map((r) => r.path)
    expect(paths).toContain('/course')
    expect(paths).toContain('/course/:chapterId')
    expect(paths).toContain('/lesson/:lessonId')
    expect(paths).toContain('/search')
  })

  it('互动工具路由都挂在教学层——页脚与亮色排版要跟着走', () => {
    const byPath = Object.fromEntries(routes.map((r) => [r.path, r]))
    const toolPaths = [
      '/tools',
      '/tools/province-abbrev',
      '/tools/province-shape',
      '/tools/contour',
      '/tools/terminator',
      '/tools/pressure-belt',
      '/tools/ocean-current',
    ]
    for (const path of toolPaths) {
      expect(byPath[path], `${path} 应该有路由`).toBeTruthy()
      expect(byPath[path].meta?.learnPage, `${path} 应该标记 learnPage`).toBe(true)
    }
  })

  it('工具路由不会遮住带参数的路由', async () => {
    // /tools/... 是静态路径，/province/:adcode 是参数路径：两者共存时不能互相吃掉
    const router = makeRouter()
    await router.push('/tools/contour')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('ContourLab')

    const router2 = makeRouter()
    await router2.push('/province/440000')
    await router2.isReady()
    expect(router2.currentRoute.value.name).toBe('Province')
  })

  it('非法路径兜底重定向到首页', async () => {
    const router = makeRouter()
    await router.push('/no-such-page')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it.each([
    ['/', 'Earth'],
    ['/province/440000', 'Province'],
    ['/world', 'World'],
    ['/country/CHN', 'Country'],
    ['/course', 'Course'],
    ['/course/2', 'Chapter'],
    ['/lesson/2.19', 'Lesson'],
    ['/search', 'Search'],
    ['/licenses', 'Licenses'],
    ['/standard-map', 'StandardMap'],
    ['/tools', 'Tools'],
    ['/tools/province-abbrev', 'ProvinceAbbrev'],
    ['/tools/province-shape', 'ProvinceShape'],
    ['/tools/contour', 'ContourLab'],
    ['/tools/terminator', 'TerminatorLab'],
    ['/tools/pressure-belt', 'PressureBeltLab'],
    ['/tools/ocean-current', 'OceanCurrentLab'],
  ])('%s 命中 %s 路由', async (path, name) => {
    const router = makeRouter()
    await router.push(path)
    await router.isReady()
    expect(router.currentRoute.value.name).toBe(name)
  })

  it('参数会作为 props 传给页面组件', async () => {
    const router = makeRouter()
    await router.push('/province/440000')
    await router.isReady()
    expect(router.currentRoute.value.params.adcode).toBe('440000')
    expect(router.currentRoute.value.matched[0].props.default).toBeTruthy()
  })

  it('首页与全球视角不接收路由参数', () => {
    const byName = Object.fromEntries(routes.map((r) => [r.name, r]))
    expect(byName.Earth.props).toBeUndefined()
    expect(byName.World.props).toBeUndefined()
  })
})
