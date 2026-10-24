// @vitest-environment jsdom
/**
 * §3.8 地转偏向力：手势法的方向必须和「北右南左」一致。
 *
 * 讲义原话：手心朝上；南半球用左手、北半球用右手；
 * 四指 = 原始运动方向，拇指 = 偏转后方向；赤道不偏。
 *
 * 关键不变式：**拇指方向就是偏转方向**。
 * 右手手心朝上、四指朝北时拇指指东——北半球朝北运动向右偏（面朝北右边是东），
 * 一致；左手同样四指朝北时拇指指西——南半球向左偏，一致。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import CoriolisHandDemo from '../../components/demos/CoriolisHandDemo.vue'
import {
  THUMB_OFFSET_DEG,
  coriolisFactor,
  coriolisFactors,
  deflectionAngle,
  handTransform,
  thumbAngle,
} from '../../data/coriolisHandGeometry'

describe('§3.8 手势法的方向', () => {
  it('偏转方向：北半球 −90°（向右）、南半球 +90°（向左）、赤道 0', () => {
    expect(deflectionAngle('north')).toBe(-90)
    expect(deflectionAngle('south')).toBe(90)
    expect(deflectionAngle('equator')).toBe(0)
  })

  it('拇指方向与偏转方向永远是同一个角', () => {
    for (const fingers of [0, 45, 90, 180, 270]) {
      expect(thumbAngle(fingers, 'right') - fingers).toBe(deflectionAngle('north'))
      expect(thumbAngle(fingers, 'left') - fingers).toBe(deflectionAngle('south'))
    }
    expect(THUMB_OFFSET_DEG).toBe(90)
  })

  it('右手朝北时拇指指东，左手朝北时拇指指西', () => {
    expect(thumbAngle(90, 'right')).toBe(0) // 正右方 = 东
    expect(thumbAngle(90, 'left')).toBe(180) // 正左方 = 西
  })

  it('手形变换：四指指向由 rotate(-角度) 给出，左手再镜像一次', () => {
    expect(handTransform(100, 200, 90, 'right')).toBe('translate(100.00 200.00) rotate(-90.00)')
    expect(handTransform(100, 200, 90, 'left')).toBe('translate(100.00 200.00) rotate(-90.00) scale(1,-1)')
  })
})

describe('§3.8 偏向力的大小', () => {
  it('F ∝ sinφ：赤道为 0，随纬度递增', () => {
    expect(coriolisFactor(0)).toBeCloseTo(0, 6)
    expect(coriolisFactor(30)).toBeCloseTo(0.5, 6)
    expect(coriolisFactor(45)).toBeCloseTo(0.7071, 3)
    expect(coriolisFactor(60)).toBeCloseTo(0.866, 3)
    expect(coriolisFactor(90)).toBeCloseTo(1, 6)
  })

  it('纬度越高 sinφ 越大', () => {
    const f = coriolisFactors([0, 30, 45, 60, 90])
    for (let i = 1; i < f.length; i += 1) {
      expect(f[i].factor).toBeGreaterThan(f[i - 1].factor)
    }
  })
})

describe('§3.8 地转偏向力演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(CoriolisHandDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('手心朝上')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('北半球写「用右手」，南半球写「用左手」，赤道不偏', async () => {
    const wrapper = mount(CoriolisHandDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__dot')
    await dots[1].trigger('click')
    expect(wrapper.text()).toContain('北半球用右手')
    await dots[2].trigger('click')
    expect(wrapper.text()).toContain('南半球用左手')
    expect(wrapper.text()).toContain('不偏')
  })

  it('最后一步给出公式与数左右的规矩', async () => {
    const wrapper = mount(CoriolisHandDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__dot')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('F = 2mvω·sinφ')
    expect(wrapper.text()).toContain('站在观测者位置')
  })
})
