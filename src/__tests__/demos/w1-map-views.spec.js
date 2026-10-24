// @vitest-environment jsdom
/**
 * §2.4 侧视图与极点俯视图演示的回归守卫。
 *
 * 这一节的坑在俯视图的方位上：0° 经线画在正下方、东经沿逆时针增大。
 * 方位一旦反了，「顺自转方向往东」就讲反了，所以这里把角度锁死。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import MapViewsDemo from '../../components/demos/MapViewsDemo.vue'
import {
  polarMeridianAngle,
  polarParallelRadius,
  polarViewGrid,
  sideViewGrid,
} from '../../data/mapViewsGeometry'

describe('§2.4 两种看法的几何', () => {
  it('俯视图里 0° 在正下方、90°E 在正右方、180° 在正上方', () => {
    expect(polarMeridianAngle(0)).toBe(270)
    expect(polarMeridianAngle(90)).toBe(0)
    expect(polarMeridianAngle(180)).toBe(90)
    expect(polarMeridianAngle(-90)).toBe(180)
  })

  it('东经沿逆时针增大——北极上方俯视时自转逆时针，而自转是自西向东', () => {
    // 角度是 (270 + lon) % 360：0° 在正下方、90°E 在正右方。
    // 比大小要按「展开后」比，否则 330° → 0° 的回绕会被误判成变小。
    const angles = [0, 30, 60, 90].map(polarMeridianAngle)
    for (let i = 1; i < angles.length; i += 1) {
      const step = (angles[i] - angles[i - 1] + 360) % 360
      expect(step, `经度每加 30°，方位角应逆时针走 30°`).toBe(30)
    }
    // 0° 在正下方、180° 在正上方、90°E 在正右方
    expect(polarMeridianAngle(0)).toBe(270)
    expect(polarMeridianAngle(180)).toBe(90)
    expect(polarMeridianAngle(90)).toBe(0)
  })

  it('俯视图里纬线是同心圆，纬度越高半径越小', () => {
    expect(polarParallelRadius(0, 120)).toBe(120)
    expect(polarParallelRadius(60, 120)).toBeCloseTo(60, 6)
    expect(polarParallelRadius(90, 120)).toBeCloseTo(0, 6)
  })

  it('俯视图网格给出每条纬线的半径与每条经线的方位角', () => {
    const grid = polarViewGrid({
      cx: 250,
      cy: 180,
      radius: 115,
      parallels: [60, 30],
      meridians: [0, 90],
    })
    expect(grid.parallels[0].lat).toBe(60)
    expect(grid.meridians[1].angle).toBe(0)
  })

  it('侧视图里纬线是横线、经线是弧', () => {
    const grid = sideViewGrid({
      cx: 360,
      cy: 185,
      radius: 120,
      parallels: [0],
      meridians: [0, 60],
    })
    expect(grid.parallels[0].y).toBeCloseTo(185, 6)
    expect(grid.meridians[0].d.startsWith('M 360.00')).toBe(true)
    // 经线画成 48 段折线逼近的弧（不是 SVG 的 A 命令），点数够多才看得出弧度
    expect(grid.meridians[1].d.split('L').length).toBeGreaterThan(20)
  })
})

describe('§2.4 两种看法的演示', () => {
  it('渲染出三步图解', async () => {
    const wrapper = mount(MapViewsDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(3)
    expect(wrapper.text()).toContain('横纬竖经')
    expect(wrapper.text()).toContain('1 / 3')
  })

  it('点步骤圆点能跳到并排对照那一步', async () => {
    const wrapper = mount(MapViewsDemo)
    await flushPromises()

    const dots = wrapper.findAll('.demo__seg')
    await dots[2].trigger('click')
    expect(wrapper.text()).toContain('两种看法，两种线')
    expect(wrapper.text()).toContain('3 / 3')
  })
})
