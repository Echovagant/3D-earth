// @vitest-environment jsdom
/**
 * §3.2 恒星日与太阳日：两个「59 / 4」必须分清。
 *
 * 讲义原话：太阳日地球自转了 **360°59′**——59′ 是**角度**（角分）；
 * 而两个周期的**时间差**是 24 时 − 23 时 56 分 4 秒 ≈ 4 分钟。
 * 把 59′ 写成「59 分钟」就是教错了。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import SiderealVsSolarDayDemo from '../../components/demos/SiderealVsSolarDayDemo.vue'
import {
  DAY_DIFF_MINUTES,
  DRAW_EXTRA_DEG,
  EXTRA_ARC_MINUTES,
  ORBIT_PER_DAY_DEG,
  SIDEREAL_DAY_HOURS,
  SIDEREAL_DAY_TEXT,
  SOLAR_DAY_TEXT,
  advanceForBearingShift,
  bearingShiftDeg,
  buildOrbit,
  drawPlan,
  ellipsePoint,
  ellipseTangent,
  splitDuration,
} from '../../data/siderealVsSolarDayGeometry'

describe('§3.2 恒星日与太阳日的数值', () => {
  it('恒星日 = 23 时 56 分 4 秒，太阳日 = 24 小时', () => {
    expect(SIDEREAL_DAY_TEXT).toBe('23 时 56 分 4 秒')
    expect(SOLAR_DAY_TEXT).toBe('24 小时')
    expect(splitDuration(SIDEREAL_DAY_HOURS)).toEqual({ h: 23, m: 56, s: 4 })
  })

  it('多转的那一点是 59′（角度），不是 59 分钟', () => {
    expect(ORBIT_PER_DAY_DEG).toBeCloseTo(0.98563, 4)
    expect(EXTRA_ARC_MINUTES).toBeCloseTo(59.14, 1)
    expect(EXTRA_ARC_MINUTES).toBeLessThan(60)
  })

  it('两个周期的时间差约 4 分钟（3 分 56 秒）', () => {
    expect(DAY_DIFF_MINUTES).toBeCloseTo(3.93, 1)
    expect(DAY_DIFF_MINUTES).toBeLessThan(4)
    expect(DAY_DIFF_MINUTES).toBeGreaterThan(3.5)
  })
})

describe('§3.2 轨道与「歪的那一点」', () => {
  const orbit = buildOrbit({ cx: 360, cy: 200, a: 190, b: 95 })

  it('太阳在椭圆的一个焦点上，地球起于远日顶点', () => {
    const c = Math.sqrt(190 * 190 - 95 * 95)
    expect(orbit.sun.x).toBeCloseTo(360 - c, 6)
    expect(orbit.sun.y).toBe(200)
    expect(orbit.earthA.x).toBeCloseTo(550, 6)
    expect(orbit.earthA.y).toBe(200)
  })

  it('地球沿轨道前进，太阳方位同步转过同一个角度', () => {
    expect(bearingShiftDeg(orbit, 0)).toBeCloseTo(0, 6)
    // t 越大，太阳方位转得越多（单调）
    expect(bearingShiftDeg(orbit, 20)).toBeGreaterThan(bearingShiftDeg(orbit, 10))
    expect(bearingShiftDeg(orbit, 40)).toBeGreaterThan(bearingShiftDeg(orbit, 20))
  })

  it('反解出的公转参数角能让太阳方位正好转过给定的角度', () => {
    const t = advanceForBearingShift(orbit, 14)
    expect(bearingShiftDeg(orbit, t)).toBeCloseTo(14, 6)
  })

  it('演示里放大的倍数是算出来的（真实 0.98° 画成 20°）', () => {
    const plan = drawPlan(orbit)
    expect(DRAW_EXTRA_DEG).toBe(20)
    expect(plan.magnification).toBeCloseTo(20 / ORBIT_PER_DAY_DEG, 6)
    expect(plan.bearingB - plan.bearingA).toBeCloseTo(DRAW_EXTRA_DEG, 6)
    // 终点 B 与起点 A 不在同一点：地球确实沿轨道挪了
    expect(ellipsePoint(orbit, plan.t)).not.toEqual(orbit.earthA)
  })

  it('椭圆切线方向与参数角同向（公转是逆时针）', () => {
    // t = 32° 位于椭圆右上方，逆时针切线应指向左上
    const angle = ellipseTangent(orbit, 32)
    expect(angle).toBeGreaterThan(90)
    expect(angle).toBeLessThan(180)
  })
})

describe('§3.2 恒星日/太阳日演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(SiderealVsSolarDayDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('一边自转，一边绕太阳跑')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('最后一步把两个周期和差值摆出来', async () => {
    const wrapper = mount(SiderealVsSolarDayDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__seg')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('23 时 56 分 4 秒')
    expect(wrapper.text()).toContain('24 小时')
    expect(wrapper.text()).toContain('相差约 4 分钟')
    expect(wrapper.text()).toContain('59′ 是角度')
  })
})
