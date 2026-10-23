// @vitest-environment jsdom
/**
 * 太阳高度角与晨昏线实验的回归守卫。
 *
 * 这一页最容易出错的几处，单独锁死：
 *   ① 正午太阳高度角 H = 90° − |φ − δ| 在跨赤道的异号情形下不能算错；
 *   ② 昼长公式 cos ω0 = −tanφ·tanδ 算出的昼长要正确，赤道必须恒为 12 小时；
 *   ③ 极昼极夜的判定：|φ| + |δ| ≥ 90°，同号极昼、异号极夜；
 *   ④ 切点：晨昏线与纬线圈相切点的纬度与太阳直射点纬度互余，
 *      两个切点分别落在正午经线（12 时）与子夜经线（0 时）上；
 *   ⑤ 晨线 / 昏线不能判反：赤道上 6 时那条是晨线、18 时那条是昏线；
 *   ⑥ 练习的答案必须由图上的几何算出来，答错要给出纠正性提示。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import TerminatorLab from '../components/TerminatorLab.vue'
import {
  SOLAR_TERMS,
  SAMPLE_POINTS,
  JUDGEMENT_METHODS,
  TIME_RULES,
  PRACTICE_ITEMS,
  TROPIC_DEGREES,
  POLAR_CIRCLE_DEGREES,
  noonSolarAltitude,
  midnightSolarAltitude,
  dayLengthHours,
  sunriseHourAngle,
  sunriseTime,
  sunsetTime,
  polarDayState,
  noonSunAzimuth,
  annualAltitudeRange,
  minimumNoonAltitude,
  buildingSpacing,
  terminatorSide,
  terminatorTangentLatitude,
  tangentPolarDistance,
  terminatorTangents,
  equatorCrossings,
  globeGeometry,
  viewCenter,
  localSolarTime,
} from '../data/terminatorLab'

/** 挂载组件：组件本身不依赖网络，数据靠 props 注入 */
const mountLab = async (props = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } }],
  })
  await router.push('/course')
  await router.isReady()
  const wrapper = mount(TerminatorLab, { props, global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

/** 去掉强调标记，方便和渲染后的文本比对 */
const plain = (text) => String(text ?? '').replace(/\*\*/g, '')

describe('太阳高度角与晨昏线：数据', () => {
  it('节气表给出四个节气的直射点纬度', () => {
    const byName = Object.fromEntries(SOLAR_TERMS.map((term) => [term.name, term.delta]))
    expect(byName['春分']).toBe(0)
    expect(byName['秋分']).toBe(0)
    expect(byName['夏至']).toBe(TROPIC_DEGREES)
    expect(byName['冬至']).toBe(-TROPIC_DEGREES)
  })

  it('观察点样本的纬度都合法，且南北半球都有', () => {
    expect(SAMPLE_POINTS.length).toBeGreaterThanOrEqual(6)
    const outOfRange = SAMPLE_POINTS.filter((p) => Math.abs(p.phi) > 90)
    expect(outOfRange).toEqual([])
    expect(SAMPLE_POINTS.some((p) => p.phi > 0)).toBe(true)
    expect(SAMPLE_POINTS.some((p) => p.phi < 0)).toBe(true)
  })

  it('三法判据与时间规律都有文案', () => {
    expect(JUDGEMENT_METHODS.map((m) => m.id)).toEqual(['rotation', 'direction', 'equator'])
    const missing = JUDGEMENT_METHODS.flatMap((m) =>
      m.rule && m.steps.length ? [] : [`${m.id}: 缺判据或步骤`],
    )
    expect(missing).toEqual([])
    expect(TIME_RULES.length).toBeGreaterThanOrEqual(3)
    expect(TIME_RULES.every((r) => r.text && r.text.length > 5)).toBe(true)
  })
})

describe('太阳高度角与晨昏线：正午太阳高度角', () => {
  it('H = 90° − |φ − δ| 在同号、异号与跨赤道时都算对', () => {
    // 同号：纬度差相减
    expect(noonSolarAltitude(40, 23.5)).toBeCloseTo(73.5, 10)
    expect(noonSolarAltitude(23.5, 23.5)).toBeCloseTo(90, 10)
    expect(noonSolarAltitude(-40, -23.5)).toBeCloseTo(73.5, 10)
    // 异号：纬度差相加
    expect(noonSolarAltitude(20, -23.5)).toBeCloseTo(46.5, 10)
    expect(noonSolarAltitude(-20, 23.5)).toBeCloseTo(46.5, 10)
    // 跨赤道
    expect(noonSolarAltitude(10, -23.5)).toBeCloseTo(56.5, 10)
    expect(noonSolarAltitude(0, 23.5)).toBeCloseTo(66.5, 10)
    expect(noonSolarAltitude(0, 0)).toBeCloseTo(90, 10)
  })

  it('子夜太阳高度角 H子夜 = φ + δ − 90°', () => {
    expect(midnightSolarAltitude(40, 23.5)).toBeCloseTo(-26.5, 10)
    expect(midnightSolarAltitude(0, 0)).toBeCloseTo(-90, 10)
  })

  it('正午太阳方位：观察点在直射点以北则太阳在正南，以南则正北，同纬度在头顶', () => {
    // 北半球的观察点：直射点在南半球（冬至）或在本半球但更南（夏至），太阳都在正南
    expect(noonSunAzimuth(40, 23.5)).toBe('south')
    expect(noonSunAzimuth(40, -23.5)).toBe('south')
    // 观察点在直射点以南：太阳在正北
    expect(noonSunAzimuth(10, 23.5)).toBe('north')
    expect(noonSunAzimuth(-40, -23.5)).toBe('north')
    // 观察点在直射点以北（哪怕同在南半球）：太阳在正南
    expect(noonSunAzimuth(-10, -23.5)).toBe('south')
    // 观察点与直射点同纬度：H = 90°，太阳在头顶
    expect(noonSunAzimuth(23.5, 23.5)).toBe('zenith')
    expect(noonSunAzimuth(0, 0)).toBe('zenith')
  })

  it('一年中正午太阳高度的变化幅度：赤道 23.5°、回归线 47°、温带 47°、极点 23.5°', () => {
    expect(annualAltitudeRange(0)).toBeCloseTo(23.5, 10)
    expect(annualAltitudeRange(TROPIC_DEGREES)).toBeCloseTo(47, 10)
    expect(annualAltitudeRange(45)).toBeCloseTo(47, 10)
    expect(annualAltitudeRange(90)).toBeCloseTo(23.5, 10)
    // 南北同纬度一致
    expect(annualAltitudeRange(-35)).toBeCloseTo(annualAltitudeRange(35), 10)
  })

  it('楼间距 L = H / tan θ，θ 取一年中正午太阳高度的最小值', () => {
    // 北半球取冬至：θ = 90 − (40 + 23.5) = 26.5°
    expect(minimumNoonAltitude(40)).toBeCloseTo(26.5, 10)
    expect(minimumNoonAltitude(-40)).toBeCloseTo(26.5, 10)
    const expected = 30 / Math.tan((26.5 * Math.PI) / 180)
    expect(buildingSpacing(30, 26.5)).toBeCloseTo(expected, 6)
  })
})

describe('太阳高度角与晨昏线：昼长与极昼极夜', () => {
  it('昼长 = 2 × ω0 / 15，且 cos ω0 = −tanφ · tanδ', () => {
    const phi = 40
    const delta = 23.5
    const omega = sunriseHourAngle(phi, delta)
    const cos = -Math.tan((phi * Math.PI) / 180) * Math.tan((delta * Math.PI) / 180)
    expect(omega).toBeCloseTo((Math.acos(cos) * 180) / Math.PI, 10)
    expect(dayLengthHours(phi, delta)).toBeCloseTo((2 * omega) / 15, 10)
    expect(dayLengthHours(40, 23.5)).toBeCloseTo(14.8531, 4)
  })

  it('赤道上昼长恒为 12 小时（δ 任意）', () => {
    for (const delta of [0, 10, -10, TROPIC_DEGREES, -TROPIC_DEGREES]) {
      expect(dayLengthHours(0, delta)).toBeCloseTo(12, 10)
      expect(sunriseTime(0, delta)).toBeCloseTo(6, 10)
      expect(sunsetTime(0, delta)).toBeCloseTo(18, 10)
    }
  })

  it('非极昼极夜区的昼长介于 0 与 24 小时之间', () => {
    expect(dayLengthHours(45, 23.5)).toBeGreaterThan(0)
    expect(dayLengthHours(45, 23.5)).toBeLessThan(24)
    expect(dayLengthHours(-45, -23.5)).toBeGreaterThan(12)
    expect(dayLengthHours(45, 23.5)).toBeCloseTo(dayLengthHours(-45, -23.5), 10)
  })

  it('|φ| + |δ| ≥ 90° 时判极昼极夜：同号极昼、异号极夜', () => {
    // 临界：|66.5| + |23.5| = 90°
    expect(polarDayState(66.5, 23.5)).toBe('polar-day')
    expect(polarDayState(66.5, -23.5)).toBe('polar-night')
    expect(polarDayState(-66.5, 23.5)).toBe('polar-night')
    expect(polarDayState(-66.5, -23.5)).toBe('polar-day')
    // 越界：北极圈内
    expect(polarDayState(80, 23.5)).toBe('polar-day')
    expect(polarDayState(80, -23.5)).toBe('polar-night')
    // 没到临界
    expect(polarDayState(60, 23.5)).toBe('normal')
    expect(polarDayState(0, 23.5)).toBe('normal')
  })

  it('极昼极夜区的昼长取 24 或 0 小时，日出日落时刻为空', () => {
    expect(dayLengthHours(80, 23.5)).toBe(24)
    expect(dayLengthHours(80, -23.5)).toBe(0)
    expect(sunriseTime(80, 23.5)).toBeNull()
    expect(sunsetTime(80, -23.5)).toBeNull()
  })
})

describe('太阳高度角与晨昏线：切点', () => {
  it('切点纬度与太阳直射点纬度互余：切点纬度 = 90° − |δ|', () => {
    expect(terminatorTangentLatitude(0)).toBeCloseTo(90, 10)
    expect(terminatorTangentLatitude(TROPIC_DEGREES)).toBeCloseTo(POLAR_CIRCLE_DEGREES, 10)
    expect(terminatorTangentLatitude(-TROPIC_DEGREES)).toBeCloseTo(POLAR_CIRCLE_DEGREES, 10)
    // 等价的说法：切点到最近极地的角距 = |δ|
    expect(tangentPolarDistance(TROPIC_DEGREES)).toBeCloseTo(TROPIC_DEGREES, 10)
    expect(tangentPolarDistance(0)).toBeCloseTo(0, 10)
    expect(90 - terminatorTangentLatitude(18)).toBeCloseTo(tangentPolarDistance(18), 10)
  })

  it('两个切点分别在正午经线（12 时）与子夜经线（0 时）上，纬度互为相反数', () => {
    const tangents = terminatorTangents(TROPIC_DEGREES, 0)
    expect(tangents.length).toBe(2)
    expect(tangents[0].longitude).toBe(0)
    expect(tangents[0].hour).toBe(12)
    expect(tangents[1].longitude).toBe(180)
    expect(tangents[1].hour).toBe(0)
    expect(tangents[0].latitude).toBeCloseTo(-POLAR_CIRCLE_DEGREES, 10)
    expect(tangents[1].latitude).toBeCloseTo(POLAR_CIRCLE_DEGREES, 10)
    // 夏至：正午经线上的切点落在南极圈，子夜经线上的切点落在北极圈
    expect(Math.abs(tangents[0].latitude)).toBeCloseTo(POLAR_CIRCLE_DEGREES, 10)
    expect(Math.abs(tangents[1].latitude)).toBeCloseTo(POLAR_CIRCLE_DEGREES, 10)
  })

  it('二分日的切点落在极点', () => {
    const tangents = terminatorTangents(0, 0)
    expect(Math.abs(tangents[0].latitude)).toBeCloseTo(90, 10)
    expect(Math.abs(tangents[1].latitude)).toBeCloseTo(90, 10)
  })
})

describe('太阳高度角与晨昏线：晨线与昏线的判读', () => {
  it('赤道上 6 时所在经线是晨线、18 时所在经线是昏线', () => {
    const crossings = equatorCrossings(0)
    expect(crossings[0].hour).toBe(6)
    expect(crossings[1].hour).toBe(18)
    expect(terminatorSide(crossings[0].longitude, 0)).toBe('morning')
    expect(terminatorSide(crossings[1].longitude, 0)).toBe('evening')
    expect(localSolarTime(crossings[0].longitude, 0)).toBeCloseTo(6, 10)
    expect(localSolarTime(crossings[1].longitude, 0)).toBeCloseTo(18, 10)
  })

  it('正面视角里晨线与昏线各一段，交点落在 18 时经线上，切点落在正午经线上', () => {
    const center = viewCenter(0, 'front')
    const geometry = globeGeometry({
      delta: TROPIC_DEGREES,
      subsolarLongitude: 0,
      center,
      observerLatitude: 40,
      parallels: [0, POLAR_CIRCLE_DEGREES, -POLAR_CIRCLE_DEGREES],
    })
    const kinds = geometry.segments.map((segment) => segment.kind)
    expect(kinds).toContain('morning')
    expect(kinds).toContain('evening')
    // 赤道交点：正面视角看到的是 18 时那条（昏线）
    expect(Math.abs(geometry.crossing.latitude)).toBeLessThan(0.5)
    expect(geometry.crossing.side).toBe('evening')
    // 切点：在正午经线（λ0 = 0）上，纬度为南极圈
    expect(Math.abs(geometry.tangent.latitude)).toBeCloseTo(POLAR_CIRCLE_DEGREES, 1)
    const tangentLat = -POLAR_CIRCLE_DEGREES
    const expectedX =
      Math.cos((tangentLat * Math.PI) / 180) * Math.sin(((0 - center) * Math.PI) / 180)
    const expectedY = Math.sin((tangentLat * Math.PI) / 180)
    expect(geometry.tangent.x).toBeCloseTo(expectedX, 1)
    expect(geometry.tangent.y).toBeCloseTo(expectedY, 1)
  })

  it('背面视角里赤道交点落在 6 时经线上，切点落在子夜经线上', () => {
    const center = viewCenter(0, 'back')
    const geometry = globeGeometry({
      delta: TROPIC_DEGREES,
      subsolarLongitude: 0,
      center,
      observerLatitude: 40,
      parallels: [0],
    })
    expect(geometry.crossing.side).toBe('morning')
    expect(Math.abs(geometry.crossing.latitude)).toBeLessThan(0.5)
    const tangentLat = POLAR_CIRCLE_DEGREES
    const expectedX =
      Math.cos((tangentLat * Math.PI) / 180) * Math.sin(((180 - center) * Math.PI) / 180)
    const expectedY = Math.sin((tangentLat * Math.PI) / 180)
    expect(geometry.tangent.x).toBeCloseTo(expectedX, 1)
    expect(geometry.tangent.y).toBeCloseTo(expectedY, 1)
  })

  it('夜半球的阴影区在背对太阳的一侧，不能画反', () => {
    // 与 SVG 默认 fill-rule（nonzero）一致的绕数判定
    const winding = (poly, p) => {
      let w = 0
      for (let i = 0; i < poly.length; i += 1) {
        const a = poly[i]
        const b = poly[(i + 1) % poly.length]
        const cross = (b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y)
        if (a.y <= p.y) {
          if (b.y > p.y && cross > 0) w += 1
        } else if (b.y <= p.y && cross < 0) w -= 1
      }
      return w
    }
    for (const delta of [TROPIC_DEGREES, -TROPIC_DEGREES, 0]) {
      const geometry = globeGeometry({
        delta,
        subsolarLongitude: 30,
        center: viewCenter(30, 'front'),
        observerLatitude: 40,
        parallels: [0],
      })
      const poly = geometry.nightRegion
      const sun = geometry.sun
      const len = Math.hypot(sun.x, sun.y) || 1
      const nightSide = { x: (-sun.x / len) * 0.8, y: (-sun.y / len) * 0.8 }
      const sunSide = { x: (sun.x / len) * 0.8, y: (sun.y / len) * 0.8 }
      // 背对太阳的一侧在夜半球里，朝着太阳的一侧在昼半球里
      expect(winding(poly, nightSide)).not.toBe(0)
      expect(winding(poly, sunSide)).toBe(0)
    }
  })

  it('练习题的答案由图上的几何算出来，题面里没有写死答案', () => {
    expect(PRACTICE_ITEMS.length).toBeGreaterThanOrEqual(3)
    const broken = PRACTICE_ITEMS.flatMap((item) => {
      const kinds = item.segments.map((s) => s.kind)
      const problems = []
      if (!kinds.includes('morning')) problems.push(`${item.id}: 没有晨线段`)
      if (!kinds.includes('evening')) problems.push(`${item.id}: 没有昏线段`)
      if (!item.answerId) problems.push(`${item.id}: 没有答案`)
      if (item.answerId && item.segments.find((s) => s.id === item.answerId)?.kind !== 'morning') {
        problems.push(`${item.id}: 答案不是晨线`)
      }
      return problems
    })
    expect(broken).toEqual([])
    // 甲 / 乙 两个答案都要出现过，不能每题都是同一段
    const answers = new Set(PRACTICE_ITEMS.map((item) => item.answerId))
    expect(answers.size).toBeGreaterThan(1)
  })
})

describe('太阳高度角与晨昏线：组件', () => {
  it('挂载后渲染出教学层页面、示意图与练习', async () => {
    const wrapper = await mountLab()
    expect(wrapper.find('.learn-page').exists()).toBe(true)
    expect(wrapper.find('a.learn-top__back').attributes('href')).toBe('/course')
    expect(wrapper.findAll('svg').length).toBeGreaterThanOrEqual(2)
    // 晨线与昏线都要画出来
    expect(wrapper.findAll('.terminator-lab__terminator--morning').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.terminator-lab__terminator--evening').length).toBeGreaterThan(0)
    // 切点与赤道交点都有标记
    expect(wrapper.findAll('.terminator-lab__tangent').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.terminator-lab__crossing').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('晨线')
    expect(wrapper.text()).toContain('昏线')
  })

  it('改滑块后正午太阳高度角与昼长实时跟着变', async () => {
    const wrapper = await mountLab({ initialPhi: 0, initialDelta: 0 })
    expect(wrapper.find('.terminator-lab__formula').text()).toContain('90°')
    await wrapper.find('#tl-phi').setValue('60')
    await wrapper.find('#tl-delta').setValue('23.5')
    const formula = wrapper.find('.terminator-lab__formula').text()
    expect(formula).toContain('60°')
    expect(formula).toContain('23.5°')
    // H = 90 − |60 − 23.5| = 53.5
    expect(formula).toContain('53.5°')
    expect(wrapper.text()).toContain('极昼')
  })

  it('选节气按钮会改写直射点纬度并联动图形', async () => {
    const wrapper = await mountLab({ initialPhi: 0, initialDelta: 0 })
    const winter = wrapper.findAll('.terminator-lab__preset').find((el) => el.text() === '冬至')
    await winter.trigger('click')
    expect(wrapper.find('#tl-delta').element.value).toBe('-23.5')
    expect(wrapper.find('.terminator-lab__formula').text()).toContain('23.5°')
  })

  it('答对时给出解释，答错时给出纠正性提示', async () => {
    const wrapper = await mountLab()
    const item = PRACTICE_ITEMS[0]
    const wrongOption = item.segments.find((segment) => segment.id !== item.answerId)

    // 答错
    await wrapper.findAll('.terminator-lab__option')[1].trigger('click')
    const wrongFeedback = plain(wrapper.find('.terminator-lab__feedback').text())
    expect(wrongFeedback.length).toBeGreaterThan(10)
    expect(wrongFeedback).toContain('由黑变白')
    expect(wrongFeedback).toContain(wrongOption.name)

    // 答对
    await wrapper.findAll('.terminator-lab__option')[0].trigger('click')
    const rightFeedback = plain(wrapper.find('.terminator-lab__feedback').text())
    expect(rightFeedback).toContain(item.answerName)
    expect(rightFeedback).toContain('晨线')
    expect(wrapper.find('.terminator-lab__feedback--correct').exists()).toBe(true)
  })

  it('没有节气数据时进空态，数据不合法时进错误态', async () => {
    const empty = await mountLab({ terms: [] })
    expect(empty.find('.learn-empty').text()).toContain('节气数据')

    const broken = await mountLab({ terms: [{ id: 'x', name: 'x' }] })
    expect(broken.find('.learn-error').exists()).toBe(true)
    expect(broken.find('.learn-error').text()).toContain('无法准备实验数据')
  })
})
