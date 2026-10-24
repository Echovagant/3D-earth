// @vitest-environment jsdom
/**
 * §2.13 劣弧定东西演示的回归守卫。
 *
 * 这一节的全部推理都挂在「近路是往哪边」上：
 * 讲义里的例子（西经 55° 与东经 165°）往东要 220°、往西只要 140°，
 * 所以近路往西，A 在 B 的东边，左右要调换。数字算错，结论就反。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import GreatArcDirectionDemo from '../../components/demos/GreatArcDirectionDemo.vue'
import {
  arcBetween,
  arcMidAngle,
  arcSpan,
  eastwardDifference,
  greatCircleAngle,
  majorArcAngle,
  minorArcAngle,
  nearerDirection,
  westwardDifference,
} from '../../data/greatArcDirectionGeometry'

describe('§2.13 劣弧定东西的几何', () => {
  it('讲义里的例子：西经 55° 与东经 165°，往东 220°、往西 140°', () => {
    const A = -55
    const B = 165
    expect(eastwardDifference(A, B)).toBe(220)
    expect(westwardDifference(A, B)).toBe(140)
    expect(minorArcAngle(A, B)).toBe(140)
    expect(majorArcAngle(A, B)).toBe(220)
    expect(nearerDirection(A, B)).toBe('west')
  })

  it('经度差小于 180° 时近路往东', () => {
    expect(eastwardDifference(0, 60)).toBe(60)
    expect(nearerDirection(0, 60)).toBe('east')
    expect(minorArcAngle(0, 60)).toBe(60)
  })

  it('劣弧的圆心角一定小于 180°，优弧一定大于', () => {
    for (const [a, b] of [
      [-55, 165],
      [0, 60],
      [10, 170],
      [170, -170],
    ]) {
      expect(minorArcAngle(a, b)).toBeLessThan(180)
      expect(majorArcAngle(a, b)).toBeGreaterThan(180)
      expect(minorArcAngle(a, b) + majorArcAngle(a, b)).toBe(360)
    }
  })

  it('球面大圆劣弧比纬线上的纬差还短（纬度越高差得越多）', () => {
    expect(greatCircleAngle(0, 0, 0, 60)).toBeCloseTo(60, 6)
    expect(greatCircleAngle(60, 0, 60, 60)).toBeLessThan(60)
  })

  it('弧的跨度与中点角度按方向算', () => {
    expect(arcSpan(215, 75, true)).toBe(-140)
    expect(arcSpan(215, 75, false)).toBe(220)
    expect(arcMidAngle(215, 75, true)).toBe(145)
    expect(arcMidAngle(215, 75, false)).toBe(325)
  })

  it('顺时针与逆时针的两段弧都从 A 指向 B', () => {
    const near = arcBetween(360, 195, 80, 215, 75, true)
    const far = arcBetween(360, 195, 80, 215, 75, false)
    expect(near).toContain('A 80 80 0 0 1')
    expect(far).toContain('A 80 80 0 1 0')
    expect(near).not.toBe(far)
  })
})

describe('§2.13 劣弧定东西的演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(GreatArcDirectionDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('沿纬线有两种走法')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('文案里给出的两个数与公式一致（220° 与 140°）', async () => {
    const wrapper = mount(GreatArcDirectionDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('220°')
    expect(wrapper.text()).toContain('140°')
    expect(wrapper.text()).toContain('2 / 4')
  })
})
