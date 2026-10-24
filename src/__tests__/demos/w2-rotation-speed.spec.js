// @vitest-environment jsdom
/**
 * §3.4 自转线速度：纬线圈长度、线速度与角速度的关系。
 *
 * 守两条：
 *   ① 线速度 = 1670·cosφ，讲义的常用取值（赤道 1670、30° 1447、60° 835、极点 0）
 *   ② 极点俯视时纬线圈半径 ∝ cosφ，所以速度箭头长度自动与线速度成正比——
 *      箭头长度不是手调的，写死了就会教错。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import RotationSpeedDemo from '../../components/demos/RotationSpeedDemo.vue'
import {
  DEGREES_PER_HOUR,
  EQUATOR_SPEED,
  SPEED_TABLE,
  hourlyArcRatio,
  latitudeCircleRadius,
  linearSpeed,
  radiusRatio,
  speedArrowLength,
} from '../../data/rotationSpeedGeometry'

describe('§3.4 自转线速度的数值', () => {
  it('线速度 = 1670·cosφ', () => {
    expect(linearSpeed(0)).toBeCloseTo(1670, 6)
    expect(linearSpeed(30)).toBeCloseTo(1446.26, 1)
    expect(linearSpeed(60)).toBeCloseTo(835, 6)
    expect(linearSpeed(90)).toBeCloseTo(0, 6)
    expect(linearSpeed(-30)).toBeCloseTo(linearSpeed(30), 6)
  })

  it('讲义的常用取值表与公式一致（允许四舍五入差 1）', () => {
    for (const row of SPEED_TABLE) {
      expect(Math.abs(linearSpeed(row.lat) - row.speed)).toBeLessThanOrEqual(1)
    }
    expect(SPEED_TABLE.map((r) => r.speed)).toEqual([1670, 1447, 835, 0])
  })

  it('角速度处处相同：15°/小时（除极点外）', () => {
    expect(DEGREES_PER_HOUR).toBe(15)
    expect(360 / 24).toBe(DEGREES_PER_HOUR)
  })

  it('纬线圈半径 ∝ cosφ', () => {
    expect(latitudeCircleRadius(100, 0)).toBeCloseTo(100, 6)
    expect(latitudeCircleRadius(100, 60)).toBeCloseTo(50, 6)
    expect(latitudeCircleRadius(100, 90)).toBeCloseTo(0, 6)
  })

  it('速度箭头长度与线速度成正比', () => {
    expect(speedArrowLength(0, 80)).toBeCloseTo(80, 6)
    expect(speedArrowLength(60, 80)).toBeCloseTo(40, 6)
    expect(speedArrowLength(90, 80)).toBeCloseTo(0, 6)
    // 一小时走过的弧长占比同样是 cosφ
    expect(hourlyArcRatio(60)).toBeCloseTo(0.5, 6)
  })

  it('海拔越高，到地轴的距离越大，线速度越大（实际差别很小）', () => {
    const ratio = radiusRatio(30, 2)
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(1.001)
    expect(EQUATOR_SPEED * ratio - EQUATOR_SPEED).toBeGreaterThan(0)
  })
})

describe('§3.4 自转线速度演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(RotationSpeedDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('纬线圈就是「跑道」')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('第二步把赤道与两极的线速度数值摆出来', async () => {
    const wrapper = mount(RotationSpeedDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__dot')
    await dots[1].trigger('click')
    expect(wrapper.text()).toContain('赤道 1670')
    expect(wrapper.text()).toContain('北纬 30° 1447')
    expect(wrapper.text()).toContain('北纬 60° 835')
  })

  it('第三步点明慢的是线速度不是角速度', async () => {
    const wrapper = mount(RotationSpeedDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__dot')
    await dots[2].trigger('click')
    expect(wrapper.text()).toContain('角速度除极点外处处相同')
  })
})
