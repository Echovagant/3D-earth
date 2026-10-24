// @vitest-environment jsdom
/**
 * 演示动画（知识点页里的「图解」）的契约测试。
 *
 * 演示补的是「老师用文字描述一个场景、学生只能靠想象」的那一截，
 * 所以这里守三件事：
 *   ① 知识数据里挂的演示 id 都真实存在（写错 id 会静默不渲染）；
 *   ② 晨昏线的几何是算出来的，数值必须对——切点与直射点互余、
 *      与赤道的交点落在 6 时和 18 时；
 *   ③ 组件本身能渲染、能逐步切换。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount, flushPromises } from '@vue/test-utils'

import { DEMO_IDS, DEMO_LOADERS } from '../data/demos'
import {
  SOLSTICE_DECL,
  cutLatitude,
  localHour,
  terminatorLat,
} from '../data/terminatorGeometry'
import {
  arcPath,
  arrowHead,
  circlePath,
  cylinderProjection,
  leftHalfPath,
  polarToXY,
  rightHalfPath,
} from '../data/svgParts'
import TerminatorCircleDemo from '../components/demos/TerminatorCircleDemo.vue'

const read = (p) => JSON.parse(readFileSync(p, 'utf-8'))

describe('演示注册表', () => {
  it('注册表非空，且每个 id 都对应一个组件', () => {
    expect(DEMO_IDS.length).toBeGreaterThan(0)
    for (const id of DEMO_IDS) {
      expect(typeof DEMO_LOADERS[id], `${id} 没有组件`).toBe('function')
    }
  })

  it('组件文件名去掉 Demo 后缀再转短横线，就是它的 id', () => {
    // TerminatorCircleDemo → terminator-circle
    expect(DEMO_IDS).toContain('terminator-circle')
  })
})

describe('知识数据里的演示挂载', () => {
  const lessons = [3, 4, 7, 11, 15].flatMap((c) =>
    read(`public/data/knowledge/chapter-${String(c).padStart(2, '0')}.json`).lessons,
  )

  it('挂了的演示 id 都真实存在', () => {
    const dangling = lessons
      .filter((l) => l.demos)
      .filter((l) => !DEMO_IDS.includes(l.demos))
      .map((l) => `${l.id} → ${l.demos}`)
    expect(dangling, '演示 id 写错了，页面上会静默不渲染').toEqual([])
  })

  it('§3.6 挂的是晨昏线这个演示', () => {
    const lesson = lessons.find((l) => l.id === '3.6')
    expect(lesson.demos).toBe('terminator-circle')
  })

  it('没有演示的节是 null，不是空串', () => {
    const lesson = lessons.find((l) => l.id === '7.9')
    expect(lesson.demos).toBeNull()
  })
})

describe('晨昏线的几何', () => {
  it('切点纬度与太阳直射点互余', () => {
    expect(cutLatitude(SOLSTICE_DECL)).toBeCloseTo(66.5, 6)
  })

  it('太阳直射经线是 12 时，午夜经线是 0 时', () => {
    expect(localHour(90)).toBeCloseTo(12, 6)
    expect(localHour(-90)).toBeCloseTo(0, 6)
  })

  it('晨昏线与赤道的两个交点落在 6 时和 18 时', () => {
    expect(localHour(0)).toBeCloseTo(6, 6)
    expect(localHour(180)).toBeCloseTo(18, 6)
    expect(terminatorLat(0)).toBeCloseTo(0, 6)
    expect(terminatorLat(180)).toBeCloseTo(0, 6)
  })

  it('午夜经线上晨昏线到最高纬度（切点），正午经线上到最低纬度', () => {
    expect(terminatorLat(-90)).toBeCloseTo(cutLatitude(SOLSTICE_DECL), 6)
    expect(terminatorLat(90)).toBeCloseTo(-cutLatitude(SOLSTICE_DECL), 6)
  })

  it('晨昏线始终过球心所在的两个半球——任意经度上的纬度都在 ±90° 内', () => {
    for (let lon = -180; lon <= 180; lon += 15) {
      const lat = terminatorLat(lon)
      expect(Math.abs(lat)).toBeLessThanOrEqual(cutLatitude(SOLSTICE_DECL) + 1e-9)
    }
  })
})

describe('SVG 原语', () => {
  it('左半与右半是互补的两块，弧的方向不能搞反', () => {
    // 弧的 sweep-flag 决定走哪一侧：左半用 0，右半用 1。
    // 曾经因为写反，昼半球被画到了下半球——单测测不出来，得靠数值验。
    expect(leftHalfPath(360, 190, 118)).toBe('M 360 72 A 118 118 0 0 0 360 308 L 360 72 Z')
    expect(rightHalfPath(360, 190, 118)).toBe('M 360 72 A 118 118 0 0 1 360 308 L 360 72 Z')
  })

  it('极坐标：0 度在正右方，逆时针为正', () => {
    expect(polarToXY(100, 100, 50, 0)).toEqual({ x: 150, y: 100 })
    expect(polarToXY(100, 100, 50, 90)).toEqual({ x: 100, y: 50 })
    expect(polarToXY(100, 100, 50, 180)).toEqual({ x: 50, y: 100 })
  })

  it('圆弧的起止点落在对应的角度上', () => {
    const path = arcPath(100, 100, 50, 0, 90)
    expect(path).toContain('150.00 100.00')
    expect(path).toContain('100.00 50.00')
  })

  it('箭头尖端落在给定的点上', () => {
    const head = arrowHead(100, 200, 0, 12)
    expect(head.startsWith('M 100.00 200.00')).toBe(true)
  })

  it('整圆画成一条路径——circle 元素没法只描一半，虚线的大圆要用它', () => {
    expect(circlePath(100, 100, 50)).toBe(
      'M 100 50 A 50 50 0 1 0 100 150 A 50 50 0 1 0 100 50',
    )
  })

  it('圆柱投影：经度 -180 在左、180 在右，纬度 90 在上', () => {
    const project = cylinderProjection({ left: 90, right: 690, top: 40, bottom: 330 })
    expect(project.x(-180)).toBe(90)
    expect(project.x(180)).toBe(690)
    expect(project.y(90)).toBe(40)
    expect(project.y(-90)).toBe(330)
    expect(project.y(0)).toBe(185)
  })
})

describe('全部演示', () => {
  it('每个演示都能挂载、画出画布、步骤能往前走', async () => {
    // 逐个挂载注册表里的组件：任何一个演示渲染时抛错、或画不出画布，
    // 都会在这里被抓住——比等到页面上白屏才发现强。
    const problems = []
    for (const [id, loader] of Object.entries(DEMO_LOADERS)) {
      try {
        const module = await loader()
        const wrapper = mount(module.default)
        await flushPromises()
        if (!wrapper.find('.demo__canvas').exists()) problems.push(`${id}：没画出画布`)
        if (!wrapper.find('.demo__controls').exists()) problems.push(`${id}：没有步骤控件`)
        const title = wrapper.find('.demo__title').text()
        if (!title.trim()) problems.push(`${id}：第一步没有标题`)
        const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
        if (next && !next.attributes('disabled')) {
          const before = wrapper.find('.demo__title').text()
          await next.trigger('click')
          if (wrapper.find('.demo__title').text() === before) problems.push(`${id}：点了下一步没换步`)
        }
      } catch (error) {
        problems.push(`${id}：挂载时抛错 ${error.message}`)
      }
    }
    expect(problems, '有演示渲染不正常').toEqual([])
    // 30 个演示逐个挂载，默认 5 秒超时不够
  }, 60000)

  it('每个演示的 SVG 属性都是合法值：没有 NaN、没有 undefined、路径都以 M 开头', async () => {
    // 这两类 bug 光靠「组件能挂载」测不出来：
    //   ① 坐标算成了 NaN → 元素被浏览器丢弃，图上少了东西
    //   ② 绑定漏了冒号 → 源码当字面量渲染（d="arrowHead(...)"）
    // 两者都只在浏览器里才暴露，所以在这里做成断言，别再靠肉眼。
    const problems = []
    for (const [id, loader] of Object.entries(DEMO_LOADERS)) {
      const module = await loader()
      const wrapper = mount(module.default)
      await flushPromises()
      for (const el of wrapper.findAll('.demo__canvas *')) {
        const attrs = el.attributes()
        for (const [name, value] of Object.entries(attrs)) {
          if (/NaN|undefined/.test(value)) {
            problems.push(`${id}：<${el.tagName} ${name}="${value}">`)
          }
        }
        const d = attrs.d
        if (d && !/^[Mm]/.test(d)) problems.push(`${id}：路径属性不是 M 开头 → ${d.slice(0, 50)}`)
      }
    }
    expect(problems, '有演示的 SVG 属性不合法').toEqual([])
  }, 60000)

  it('演示组件不少于 30 个（§3.6 那批 + 铺开的 29 节）', () => {
    expect(DEMO_IDS.length).toBeGreaterThanOrEqual(30)
  })

  it('拖动参数轴到两端，SVG 属性仍然合法、画布不会空掉', async () => {
    // 参数轴一进来，几何就从常量变成了随参数重算的函数——
    // 于是「某个参数取值让路径算成 NaN」这类 bug 有了新的入口。
    // 浏览器里表现为整块图形消失，但单测也能抓住：属性里出现 NaN。
    const problems = []
    for (const [id, loader] of Object.entries(DEMO_LOADERS)) {
      const module = await loader()
      const wrapper = mount(module.default)
      await flushPromises()
      const slider = wrapper.find('.demo-slider input[type=range]')
      if (!slider.exists()) continue

      const base = wrapper.findAll('.demo__canvas *').length
      const min = Number(slider.attributes('min'))
      const max = Number(slider.attributes('max'))
      for (const val of [min, (min + max) / 2, max]) {
        await slider.setValue(String(val))
        for (const el of wrapper.findAll('.demo__canvas *')) {
          for (const [name, value] of Object.entries(el.attributes())) {
            if (/NaN|undefined/.test(value)) {
              problems.push(`${id}：滑块=${val} → <${el.tagName} ${name}="${value}">`)
            }
          }
        }
        const now = wrapper.findAll('.demo__canvas *').length
        if (base > 0 && now === 0) problems.push(`${id}：滑块拖到 ${val} 后画布空了`)
      }
    }
    expect(problems, '参数轴拖动后有演示画坏了').toEqual([])
  }, 60000)

  it('三个核心演示都挂了参数轴', async () => {
    for (const id of ['terminator-circle', 'day-night-drawing', 'walker-circulation']) {
      const module = await DEMO_LOADERS[id]()
      const wrapper = mount(module.default)
      await flushPromises()
      expect(wrapper.find('.demo-slider input[type=range]').exists(), `${id} 没有参数轴`).toBe(true)
    }
  })
})

describe('§3.6 晨昏线演示', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(TerminatorCircleDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('一半亮，一半暗')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能往后走，点步骤圆点能直接跳', async () => {
    const wrapper = mount(TerminatorCircleDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('晨昏线是一条大圆')
    expect(wrapper.text()).toContain('2 / 4')

    const dots = wrapper.findAll('.demo__seg')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('晨昏线与极圈的切点')
    expect(wrapper.text()).toContain('4 / 4')
  })

  it('第一步在头一步时「上一步」是禁用的', () => {
    const wrapper = mount(TerminatorCircleDemo)
    const prev = wrapper.findAll('.demo__controls button').find((b) => b.text() === '上一步')
    expect(prev.attributes('disabled')).toBeDefined()
  })
})
