// @vitest-environment jsdom
/**
 * §3.12 地方时：四个关键读数与「东先西后」。
 *
 * 守的是读数本身——正午经线 12 时、昏线 18 时、晨线 6 时、背面的 0 时经线 0 时，
 * 以及极点俯视里「方位角 → 经度 → 地方时」这条换算链。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import LocalTimeDemo from '../../components/demos/LocalTimeDemo.vue'
import { localHour } from '../../data/terminatorGeometry'
import {
  MINUTES_PER_DEGREE,
  clockHandAngles,
  formatClock,
  hourAtAngle,
  longitudeAtAngle,
  normalizeHours,
  specialMeridians,
} from '../../data/localTimeGeometry'

describe('§3.12 四条特殊经线', () => {
  it('0 时 / 6 时 / 12 时 / 18 时分别在直射经线的 ±180° 与 ±90°', () => {
    const m = specialMeridians(90)
    expect(m.map((x) => x.hour)).toEqual([0, 6, 12, 18])
    expect(m.map((x) => x.lon)).toEqual([-90, 0, 90, 180])
    expect(m.find((x) => x.hour === 6).note).toBe('晨线')
    expect(m.find((x) => x.hour === 18).note).toBe('昏线')
    expect(m.find((x) => x.hour === 0).note).toBe('在背面')
  })

  it('与 localHour 一致：直射经线 12 时、晨线 6 时、昏线 18 时', () => {
    expect(localHour(90, 90)).toBeCloseTo(12, 6)
    expect(localHour(0, 90)).toBeCloseTo(6, 6)
    expect(localHour(180, 90)).toBeCloseTo(18, 6)
    expect(localHour(-90, 90)).toBeCloseTo(0, 6)
  })
})

describe('§3.12 极点俯视的读数', () => {
  it('正午经线画在正下方，顺时针方向经度递减', () => {
    expect(longitudeAtAngle(270, 90)).toBeCloseTo(90, 6)
    expect(longitudeAtAngle(180, 90)).toBeCloseTo(0, 6)
    expect(longitudeAtAngle(0, 90)).toBeCloseTo(-180, 6)
    expect(longitudeAtAngle(90, 90)).toBeCloseTo(-90, 6)
  })

  it('方位角 → 地方时：270° 是 12 时，往逆时针（东）读数变大', () => {
    expect(hourAtAngle(270, 90)).toBeCloseTo(12, 6)
    expect(hourAtAngle(285, 90)).toBeCloseTo(13, 6)
    expect(hourAtAngle(300, 90)).toBeCloseTo(14, 6)
    expect(hourAtAngle(180, 90)).toBeCloseTo(6, 6)
    expect(hourAtAngle(0, 90)).toBeCloseTo(18, 6)
    expect(hourAtAngle(90, 90)).toBeCloseTo(0, 6)
  })

  it('同一条纬线上，经度每差 15° 读数差 1 小时', () => {
    expect(MINUTES_PER_DEGREE).toBe(4)
    expect(localHour(120, 90)).toBeCloseTo(14, 6)
  })

  it('钟面指针：12 点在正上方，每小时顺时针 30°', () => {
    const eight = clockHandAngles(8)
    expect(eight.hour).toBe(-150)
    expect(eight.minute).toBe(90)
    const twelve = clockHandAngles(12)
    expect(twelve.hour).toBe(90)
  })

  it('小时归一化与文字格式', () => {
    expect(normalizeHours(-6)).toBe(18)
    expect(normalizeHours(24)).toBe(0)
    expect(formatClock(11.7)).toBe('11 时 42 分')
  })
})

describe('§3.12 地方时演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(LocalTimeDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('相对太阳的位置')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('第二步把四个关键读数都标出来', async () => {
    const wrapper = mount(LocalTimeDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__seg')
    await dots[1].trigger('click')
    expect(wrapper.text()).toContain('12 时')
    expect(wrapper.text()).toContain('正午经线')
    expect(wrapper.text()).toContain('晨线')
    expect(wrapper.text()).toContain('昏线')
    expect(wrapper.text()).toContain('在背面')
  })

  it('第四步给出东先西后的钟面对照', async () => {
    const wrapper = mount(LocalTimeDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__seg')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('东边 · 8 时')
    expect(wrapper.text()).toContain('西边 · 7 时')
    expect(wrapper.text()).toContain('先后')
  })
})
