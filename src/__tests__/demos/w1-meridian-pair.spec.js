// @vitest-environment jsdom
/**
 * §2.10 对应经线（经线圈）演示的回归守卫。
 *
 * 判定规则只有两条，必须同时成立：度数之和 = 180°、符号相反。
 * 0° 与 180° 是特例（两个都没有符号）。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import MeridianPairDemo from '../../components/demos/MeridianPairDemo.vue'
import {
  counterpartLongitude,
  isMeridianPair,
  parseLongitude,
} from '../../data/meridianPairGeometry'
import { polarMeridianAngle } from '../../data/mapViewsGeometry'

describe('§2.10 对应经线的判定', () => {
  it('东经 30° 的对应经线是西经 150°', () => {
    expect(counterpartLongitude(30, 'E')).toEqual({ value: 150, sign: 'W' })
    expect(counterpartLongitude(90, 'E')).toEqual({ value: 90, sign: 'W' })
    expect(counterpartLongitude(0, null)).toEqual({ value: 180, sign: null })
  })

  it('两条同时满足「度数之和 180°、符号相反」才是一对', () => {
    expect(isMeridianPair('30E', '150W')).toBe(true)
    expect(isMeridianPair('90E', '90W')).toBe(true)
    expect(isMeridianPair('30E', '30W')).toBe(false)
    expect(isMeridianPair('40E', '130W')).toBe(false)
    expect(isMeridianPair('40E', '140W')).toBe(true)
  })

  it('0° 与 180° 也是一对（两个都没有符号）', () => {
    expect(isMeridianPair(0, 180)).toBe(true)
    expect(isMeridianPair('0', '180')).toBe(true)
  })

  it('同号的一定不是一对', () => {
    expect(isMeridianPair('30E', '150E')).toBe(false)
    expect(isMeridianPair('30W', '150W')).toBe(false)
  })

  it('经度写法能认：数字、带符号都认，0° 没有符号', () => {
    expect(parseLongitude(30)).toEqual({ value: 30, sign: 'E' })
    expect(parseLongitude(-30)).toEqual({ value: 30, sign: 'W' })
    expect(parseLongitude('30°W')).toEqual({ value: 30, sign: 'W' })
    expect(parseLongitude(0)).toEqual({ value: 0, sign: null })
  })

  it('俯视图里正对着的两条经线方位角相差 180°', () => {
    expect(polarMeridianAngle(30) - polarMeridianAngle(-150)).toBeCloseTo(180, 6)
    // 同名的两条不是正对着
    expect(Math.abs(polarMeridianAngle(30) - polarMeridianAngle(-30))).toBeCloseTo(60, 6)
  })
})

describe('§2.10 经线圈的演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(MeridianPairDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('经线是半圆')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能走到判定规则那一步', async () => {
    const wrapper = mount(MeridianPairDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('对应经线')
    expect(wrapper.text()).toContain('2 / 4')
  })
})
