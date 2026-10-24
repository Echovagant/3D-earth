// @vitest-environment jsdom
/**
 * §2.5 纬度（线面角）演示的回归守卫。
 *
 * 线面角最容易被画成「量不准的角」：只有取在观察者视线的侧平面里，
 * 半径的长度和朝向才不变，量出来的角才是真纬度。
 * 所以这里锁死：点在球面上、垂足在赤道面里、线与垂足的夹角 = 纬度。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import LatitudeAngleDemo from '../../components/demos/LatitudeAngleDemo.vue'
import {
  EQUATOR_SQUASH,
  equatorPlaneBack,
  equatorPlaneFront,
  latitudeAngleDeg,
  limbPoint,
  planeFoot,
} from '../../data/latitudeAngleGeometry'

describe('§2.5 线面角的几何', () => {
  it('侧平面上的点确实落在球面上', () => {
    const p = limbPoint(40, 300, 200, 125)
    const distance = Math.hypot(p.x - 300, p.y - 200)
    expect(distance).toBeCloseTo(125, 6)
  })

  it('垂足落在赤道面上，并且与点竖直对齐', () => {
    const p = limbPoint(40, 300, 200, 125)
    const f = planeFoot(40, 300, 200, 125)
    expect(f.y).toBe(200)
    expect(f.x).toBeCloseTo(p.x, 6)
  })

  it('半径与垂足的夹角正好等于纬度', () => {
    for (const lat of [0, 20, 40, 70, 90]) {
      const p = limbPoint(lat, 300, 200, 125)
      const f = planeFoot(lat, 300, 200, 125)
      const angle =
        (Math.atan2(200 - p.y, p.x - 300) * 180) / Math.PI
      expect(angle).toBeCloseTo(latitudeAngleDeg(lat), 6)
      expect(f.x).toBeCloseTo(300 + 125 * Math.cos((lat * Math.PI) / 180), 6)
    }
  })

  it('赤道面画成扁椭圆盘：前后半圈各一条弧，短轴是长轴的 EQUATOR_SQUASH 倍', () => {
    const front = equatorPlaneFront(300, 200, 125)
    const back = equatorPlaneBack(300, 200, 125)
    expect(front).toContain('M 175 200 A 125 37.50')
    expect(back).toContain('M 175 200 A 125 37.50')
    expect(front).not.toContain('Z')
    expect(back.endsWith('0 1 425 200')).toBe(true)
    expect(EQUATOR_SQUASH).toBeGreaterThan(0)
    expect(EQUATOR_SQUASH).toBeLessThan(1)
  })
})

describe('§2.5 线面角的演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(LatitudeAngleDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('赤道是一个「面」')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能走到量角那一步', async () => {
    const wrapper = mount(LatitudeAngleDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('线、面、角：这就是纬度')
    expect(wrapper.text()).toContain('2 / 4')
  })
})
