// @vitest-environment jsdom
/**
 * §3.13 地方时的计算：四步法的算式。
 *
 * 用讲义里老师完整演示过的那道题：已知东经 107° 的地方时为 10:50，
 * 求东经 120° 的地方时 → 11:42。
 * 同时守住讲义练习表里的两个数：107°E 与 178°W 的经度差是 285°，
 * 18 点减 19 小时要跨到前一天 23 点。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import LocalTimeStepsDemo from '../../components/demos/LocalTimeStepsDemo.vue'
import {
  MINUTES_PER_DEGREE,
  expandedX,
  isEastOf,
  longitudeDiff,
  solveLocalTime,
  split24,
  timeDiffMinutes,
} from '../../data/localTimeStepsGeometry'

describe('§3.13 四步法的算式', () => {
  it('经度差：东经记正、西经为负，相减取绝对值', () => {
    expect(longitudeDiff(107, 120)).toBe(13)
    // 讲义练习表：东经 107 与西经 178 相差 285°
    expect(longitudeDiff(107, -178)).toBe(285)
  })

  it('时间差：经度每差 1° 差 4 分钟', () => {
    expect(MINUTES_PER_DEGREE).toBe(4)
    expect(timeDiffMinutes(13)).toBe(52)
    expect(timeDiffMinutes(24)).toBe(96)
  })

  it('东西判断：展开图上位置更靠右的就是东边', () => {
    expect(isEastOf(120, 107)).toBe(true)
    expect(isEastOf(107, 120)).toBe(false)
    expect(isEastOf(-178, 107)).toBe(false)
    expect(isEastOf(131, 107)).toBe(true)
  })

  it('讲义原题：东经 107° 地方时 10:50 → 东经 120° 是 11:42', () => {
    const r = solveLocalTime(10 + 50 / 60, 107, 120)
    expect(r.diff).toBe(13)
    expect(r.minutes).toBe(52)
    expect(r.east).toBe(true)
    const s = split24(r.hours)
    expect(s.hours).toBe(11)
    expect(s.minutes).toBe(42)
    expect(s.dayShift).toBe(0)
  })

  it('减法跨日：18 点减 19 小时 = 前一天 23 点（把小时写大再减）', () => {
    const s = split24(18 - 19)
    expect(s.dayShift).toBe(-1)
    expect(s.hours).toBe(23)
    expect(s.minutes).toBe(0)
    // 讲义的变通写法：10 月 11 日 18 点 = 10 月 10 日 42 点
    expect(split24(42 - 19).hours).toBe(23)
  })

  it('展开图：180°W 在左、0° 在中间、180°E 在右', () => {
    const box = { left: 0, right: 360 }
    expect(expandedX(box, -180)).toBe(0)
    expect(expandedX(box, 0)).toBe(180)
    expect(expandedX(box, 180)).toBe(360)
  })
})

describe('§3.13 地方时计算演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(LocalTimeStepsDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('画简图，标条件')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('第二步给出经度差 13°', async () => {
    const wrapper = mount(LocalTimeStepsDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__seg')
    await dots[1].trigger('click')
    expect(wrapper.text()).toContain('经度差 = 120 − 107 = 13°')
  })

  it('第三步给出 52 分钟，第四步给出 11:42', async () => {
    const wrapper = mount(LocalTimeStepsDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__seg')
    await dots[2].trigger('click')
    expect(wrapper.text()).toContain('13° × 4 分钟/度 = 52 分钟')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('= 11:42')
    expect(wrapper.text()).toContain('24 时制')
  })
})
