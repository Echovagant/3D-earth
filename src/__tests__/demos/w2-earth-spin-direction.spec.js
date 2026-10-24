// @vitest-environment jsdom
/**
 * §3.1 地球自转的概念与方向：极点俯视的顺逆不能反。
 *
 * 单测测不出「画反了」，但能守住两个数：
 *   ① 地轴倾斜后南北极点的位置（北极在上、南极在下，且都在球面上）
 *   ② 极点俯视的箭头方向——北极是逆时针、南极是顺时针，
 *      而且末端切线指向与转动的绕行方向一致。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import EarthSpinDirectionDemo from '../../components/demos/EarthSpinDirectionDemo.vue'
import {
  AXIS_TILT,
  arcBetween,
  axisPoles,
  latitudeCircleRadius,
  polarSpinArrow,
} from '../../data/earthSpinDirectionGeometry'

describe('§3.1 自转方向的几何', () => {
  it('地轴倾斜 23.5°，南北极点都在球面上', () => {
    const p = axisPoles(300, 200, 100)
    expect(p.tiltDeg).toBe(AXIS_TILT)
    expect(Math.hypot(p.north.x - 300, p.north.y - 200)).toBeCloseTo(100, 6)
    expect(Math.hypot(p.south.x - 300, p.south.y - 200)).toBeCloseTo(100, 6)
    // 北极在上、南极在下；地轴偏向 +x（北极点那一侧）
    expect(p.north.y).toBeLessThan(200)
    expect(p.south.y).toBeGreaterThan(200)
    expect(p.north.x).toBeGreaterThan(300)
  })

  it('赤道在侧视图里是过球心的水平线', () => {
    const p = axisPoles(300, 200, 100)
    expect(p.equator.y1).toBe(200)
    expect(p.equator.y2).toBe(200)
    expect(p.equator.x1).toBe(300 - 100)
    expect(p.equator.x2).toBe(300 + 100)
  })

  it('极点俯视：纬线圈半径 = R·cosφ，赤道最大、极点为 0', () => {
    expect(latitudeCircleRadius(100, 0)).toBeCloseTo(100, 6)
    expect(latitudeCircleRadius(100, 60)).toBeCloseTo(50, 6)
    expect(latitudeCircleRadius(100, 90)).toBeCloseTo(0, 6)
  })

  it('圆弧的 sweep-flag 与绕行方向一致', () => {
    // 逆时针 = sweep 0（SVG 里 sweep=1 是屏幕顺时针）
    expect(arcBetween(100, 100, 50, 0, 90, 'ccw')).toContain('A 50 50 0 0 0')
    expect(arcBetween(100, 100, 50, 90, 0, 'cw')).toContain('A 50 50 0 0 1')
  })

  it('北极俯视逆时针、南极俯视顺时针：两支箭头都从球上方掠过，末端左右镜像', () => {
    const north = polarSpinArrow(300, 200, 120, 'ccw')
    const south = polarSpinArrow(300, 200, 120, 'cw')
    // 逆时针：从 20°（右上）扫到 160°（左上），末端切线 = 160 + 90
    expect(north.tangent).toBe(250)
    expect(north.tip.x).toBeCloseTo(300 + 120 * Math.cos((160 * Math.PI) / 180), 6)
    // 顺时针：从 160°（左上）扫到 20°（右上），末端切线 = 20 − 90
    expect(south.tangent).toBe(-70)
    expect(south.tip.x).toBeCloseTo(300 + 120 * Math.cos((20 * Math.PI) / 180), 6)
    // 两支箭头关于竖直轴镜像：x 相反、y 相同
    expect(north.tip.y).toBeCloseTo(south.tip.y, 6)
    expect(north.tip.x + south.tip.x).toBeCloseTo(600, 6)
  })
})

describe('§3.1 自转方向演示', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(EarthSpinDirectionDemo)
    await flushPromises()
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('自转是绕着地轴转')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点步骤圆点能跳到第四步', async () => {
    const wrapper = mount(EarthSpinDirectionDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__seg')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('北逆南顺')
    expect(wrapper.text()).toContain('4 / 4')
  })
})
