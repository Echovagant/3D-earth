// @vitest-environment jsdom
/**
 * §3.6 晨昏线演示：参数轴一动，图形要跟着 δ 连续变。
 *
 * 这里守的是三件事：
 *   ① 几何算得对——直射点纬度就是 δ，切点纬度是 90 − |δ|，
 *      δ = 0 时晨昏线过两极、在圆柱投影上是 6 时与 18 时两条竖线；
 *   ② 换算法不炸——原来按经度采样，δ = 0 时会在 lon = 0 与 ±180 处
 *      除以零算出 NaN，整条路径作废，图上直接空一块；
 *   ③ 图与话对得上——拖参数轴，解说文案跟着改，SVG 属性里不能出现 NaN。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import TerminatorCircleDemo from '../../components/demos/TerminatorCircleDemo.vue'
import {
  SOLSTICE_DECL,
  SUBSOLAR_LON,
  axisDirection,
  cutLatitude,
  localHour,
  tangentLatitudes,
  terminatorPolylines,
} from '../../data/terminatorGeometry'

/** 晨昏线方程的残差：sinφ·sinδ + cosφ·cosδ·cos(λ−λs) 应为 0 */
function terminatorResidual(lat, lon, decl) {
  const rad = (d) => (d * Math.PI) / 180
  return (
    Math.sin(rad(lat)) * Math.sin(rad(decl)) +
    Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(lon - SUBSOLAR_LON))
  )
}

/** 演示里所有会被算出来的 δ（含边界与中间值） */
const DECLS = [-23.5, -20, -12.5, -0.5, 0, 0.5, 12.5, 20, 23.5]

describe('§3.6 晨昏线的几何随 δ 变', () => {
  it('切点纬度是 90 − |δ|：直射点挪到南半球，切点照样落在极圈上', () => {
    expect(cutLatitude(23.5)).toBe(66.5)
    expect(cutLatitude(-23.5)).toBe(66.5)
    expect(cutLatitude(0)).toBe(90)
    expect(cutLatitude(12.5)).toBe(77.5)
    expect(cutLatitude(-12.5)).toBe(77.5)
  })

  it('两个切点的南北归属随 δ 的正负翻转', () => {
    expect(tangentLatitudes(23.5)).toEqual({ a: 66.5, b: -66.5 })
    expect(tangentLatitudes(-23.5)).toEqual({ a: -66.5, b: 66.5 })
    expect(tangentLatitudes(0)).toEqual({ a: 90, b: -90 })
  })

  it('直射点的纬度就是 δ：侧视图左轮廓点相对倾斜地轴的纬度等于 δ', () => {
    // 左轮廓点相对球心是 p = (−r, 0)；纬度满足 sinφ = p·a / r
    const problems = []
    for (const decl of DECLS) {
      const a = axisDirection(decl)
      const sinPhi = ((-1) * a.x) / 1
      const phi = (Math.asin(sinPhi) * 180) / Math.PI
      if (Math.abs(phi - decl) > 1e-9) problems.push(`δ=${decl} → 直射点纬度 ${phi}`)
    }
    expect(problems, '直射点纬度不等于 δ').toEqual([])
  })

  it('地轴方向：δ > 0 时北极朝左倾（朝阳），δ = 0 时竖直', () => {
    const north = axisDirection(23.5)
    expect(north.x).toBeLessThan(0)
    expect(north.y).toBeLessThan(0)
    const equator = axisDirection(0)
    expect(equator.x).toBeCloseTo(0, 12)
    expect(equator.y).toBeCloseTo(-1, 12)
  })

  it('任何 δ 下晨昏线上都不会出现 NaN，纬度也不会越过 90 − |δ|', () => {
    const problems = []
    for (const decl of DECLS) {
      const limit = cutLatitude(decl)
      for (const piece of terminatorPolylines(decl)) {
        for (const p of piece) {
          if (!Number.isFinite(p.lon) || !Number.isFinite(p.lat)) {
            problems.push(`δ=${decl} → 点 (${p.lon}, ${p.lat})`)
          }
          if (Math.abs(p.lat) > limit + 1e-9) {
            problems.push(`δ=${decl} → 纬度 ${p.lat} 超过 ${limit}`)
          }
        }
      }
    }
    expect(problems, '晨昏线有 NaN 或越界的纬度').toEqual([])
  })

  it('晨昏线上的点都满足晨昏线方程', () => {
    const problems = []
    for (const decl of DECLS) {
      for (const piece of terminatorPolylines(decl)) {
        for (const p of piece) {
          const r = Math.abs(terminatorResidual(p.lat, p.lon, decl))
          if (r > 1e-9) problems.push(`δ=${decl} → (${p.lon}, ${p.lat}) 残差 ${r}`)
        }
      }
    }
    expect(problems, '有点不在线上').toEqual([])
  })

  it('δ = 0：晨昏线过两极，在圆柱投影上是 6 时与 18 时两条竖线', () => {
    const pieces = terminatorPolylines(0)
    expect(pieces).toHaveLength(2)
    const lons = pieces.map((piece) => piece[0].lon)
    expect(lons).toEqual([0, 180])
    // 两条都是竖线：经度不变，纬度从南极到北极
    const problems = []
    for (const piece of pieces) {
      for (const p of piece) {
        if (Math.abs(p.lon - piece[0].lon) > 1e-9) problems.push(`经度变了 → ${p.lon}`)
        if (Math.abs(p.lat) > 90 + 1e-9) problems.push(`纬度越界 → ${p.lat}`)
      }
      if (Math.abs(piece[0].lat + 90) > 1e-9 || Math.abs(piece[piece.length - 1].lat - 90) > 1e-9) {
        problems.push('竖线没有从南极连到北极')
      }
    }
    expect(problems, 'δ = 0 的晨昏线不是两条竖线').toEqual([])
  })

  it('晨昏线与赤道的交点固定落在 6 时（lon 0）与 18 时（lon 180）', () => {
    const problems = []
    for (const decl of DECLS) {
      const crossings = []
      for (const piece of terminatorPolylines(decl)) {
        for (const p of piece) {
          if (Math.abs(p.lat) < 1e-9) crossings.push(p.lon)
        }
      }
      const lons = [...new Set(crossings.map((l) => Number(l.toFixed(6))))].sort((a, b) => a - b)
      if (lons.length !== 2 || lons[0] !== 0 || lons[1] !== 180) {
        problems.push(`δ=${decl} → 赤道交点 ${lons.join(', ')}`)
      }
    }
    expect(problems, '赤道交点不是 6 时与 18 时').toEqual([])
  })

  it('切点所在的经线就是 0 时与 12 时经线', () => {
    expect(localHour(-90)).toBeCloseTo(0, 6)
    expect(localHour(SUBSOLAR_LON)).toBeCloseTo(12, 6)
  })

  it('夏至日：切点 A 在 0 时经线的 66.5°N，切点 B 在 12 时经线的 66.5°S', () => {
    const cuts = tangentLatitudes(SOLSTICE_DECL)
    expect(cuts.a).toBe(66.5)
    expect(cuts.b).toBe(-66.5)
    // 晨昏线在 0 时经线上的最高纬度就是切点
    const onMidnight = terminatorPolylines(SOLSTICE_DECL)
      .flat()
      .filter((p) => Math.abs(p.lon + 90) < 1e-9)
      .map((p) => p.lat)
    expect(Math.max(...onMidnight)).toBeCloseTo(66.5, 6)
    const onNoon = terminatorPolylines(SOLSTICE_DECL)
      .flat()
      .filter((p) => Math.abs(p.lon - SUBSOLAR_LON) < 1e-9)
      .map((p) => p.lat)
    expect(Math.min(...onNoon)).toBeCloseTo(-66.5, 6)
  })
})

describe('§3.6 晨昏线演示的参数轴', () => {
  it('有参数轴，默认值是夏至日 23.5°', async () => {
    const wrapper = mount(TerminatorCircleDemo)
    await flushPromises()

    const slider = wrapper.find('.demo-slider__input')
    expect(slider.exists()).toBe(true)
    expect(slider.attributes('min')).toBe('-23.5')
    expect(slider.attributes('max')).toBe('23.5')
    expect(slider.attributes('step')).toBe('0.5')
    expect(wrapper.text()).toContain('太阳直射点纬度 δ')
    expect(wrapper.find('.demo-slider__value').text()).toBe('23.5°N · 夏至日')
  })

  it('拖参数轴，读数与解说跟着改', async () => {
    const wrapper = mount(TerminatorCircleDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__seg')
    await dots[3].trigger('click')

    const slider = wrapper.find('.demo-slider__input')
    await slider.setValue(0)
    expect(wrapper.find('.demo-slider__value').text()).toBe('0° · 春分/秋分（昼夜等长）')
    expect(wrapper.text()).toContain('晨昏线过两极')

    await slider.setValue(-23.5)
    expect(wrapper.find('.demo-slider__value').text()).toBe('23.5°S · 冬至日')
    expect(wrapper.text()).toContain('冬至日，太阳直射南回归线')

    await slider.setValue(12.5)
    expect(wrapper.find('.demo-slider__value').text()).toBe('12.5°N')
    expect(wrapper.text()).toContain('12.5°N')
  })

  it('δ 变了，切点跟着动', async () => {
    const wrapper = mount(TerminatorCircleDemo)
    await flushPromises()
    await wrapper.findAll('.demo__seg')[3].trigger('click')

    const cutA = () => wrapper.findAll('.demo__cut')[0].attributes('cy')
    const cutB = () => wrapper.findAll('.demo__cut')[1].attributes('cy')
    const summerA = cutA()
    const summerB = cutB()

    await wrapper.find('.demo-slider__input').setValue(-23.5)
    expect(cutA()).not.toBe(summerA)
    expect(cutB()).not.toBe(summerB)
  })

  it('δ = 0 / ±23.5 三处都不出 NaN，图也不空', async () => {
    const wrapper = mount(TerminatorCircleDemo)
    await flushPromises()
    await wrapper.findAll('.demo__seg')[3].trigger('click')

    const problems = []
    for (const value of [0, 23.5, -23.5]) {
      await wrapper.find('.demo-slider__input').setValue(value)
      await flushPromises()
      for (const el of wrapper.findAll('.demo__canvas *')) {
        for (const [name, attr] of Object.entries(el.attributes())) {
          if (/NaN|undefined/.test(attr)) problems.push(`δ=${value}：<${el.tagName} ${name}="${attr}">`)
        }
        const d = el.attributes().d
        if (d && !/^[Mm]/.test(d)) problems.push(`δ=${value}：路径不是 M 开头 → ${d.slice(0, 40)}`)
      }
      // 晨昏线至少要画出两段（δ = 0 是两条竖线，其余是分岔的两支）
      const curves = wrapper.findAll('.demo__curve')
      if (curves.length < 2) problems.push(`δ=${value}：晨昏线只有 ${curves.length} 段`)
      for (const curve of curves) {
        if ((curve.attributes().d.match(/L/g) || []).length < 10) {
          problems.push(`δ=${value}：晨昏线段太短 → ${curve.attributes().d.slice(0, 40)}`)
        }
      }
    }
    expect(problems, '有演示画得不正常').toEqual([])
  })
})
