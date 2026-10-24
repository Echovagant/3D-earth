// @vitest-environment jsdom
/**
 * §11.15 海气相互作用：水分交换、热量交换与环流的契约测试。
 *
 * 最常被记反的是这一对：**海洋给大气的主要是热量，大气给海洋的主要是动力（风）**。
 * 另外「87.5% 的水汽来自海洋」老师说过不用记——这里只守住它出现在图上，
 * 不把它展开成考点。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import {
  EXCHANGE_DIRECTION,
  HEAT_CHANNELS,
  HEAT_STORAGE,
  STAGE,
  WATER_LOOP,
  directionAngle,
} from '../../data/airSeaExchangeGeometry'
import AirSeaExchangeDemo from '../../components/demos/AirSeaExchangeDemo.vue'

describe('§11.15 水分交换', () => {
  it('蒸发向上、降水向下', () => {
    const evap = WATER_LOOP.find((w) => w.id === 'evaporation')
    const precip = WATER_LOOP.find((w) => w.id === 'precipitation-sea')
    expect(directionAngle(evap.from.x, evap.from.y, evap.to.x, evap.to.y)).toBeCloseTo(90, 6)
    expect(directionAngle(precip.from.x, precip.from.y, precip.to.x, precip.to.y)).toBeCloseTo(
      -90,
      6,
    )
  })

  it('蒸发是从海面起的，降水落回海面与陆地', () => {
    const evap = WATER_LOOP.find((w) => w.id === 'evaporation')
    expect(evap.from.y).toBe(STAGE.seaSurfaceY)
    const toSea = WATER_LOOP.find((w) => w.id === 'precipitation-sea')
    const toLand = WATER_LOOP.find((w) => w.id === 'precipitation-land')
    expect(toSea.to.x).toBeLessThan(STAGE.seaRight)
    expect(toLand.to.x).toBeGreaterThan(STAGE.landLeft)
  })

  it('蒸发吸热、凝结放热——潜热这条隐形通道的方向不能反', () => {
    const evap = WATER_LOOP.find((w) => w.id === 'evaporation')
    const cond = WATER_LOOP.find((w) => w.id === 'condensation')
    expect(evap.heat).toBe('吸热')
    expect(cond.heat).toBe('放热')
  })
})

describe('§11.15 热量交换与环流', () => {
  it('海洋给大气热量、大气给海洋动力', () => {
    expect(EXCHANGE_DIRECTION.toAtmosphere.what).toContain('热量')
    expect(EXCHANGE_DIRECTION.toOcean.what).toContain('动力')
    expect(EXCHANGE_DIRECTION.toAtmosphere.from).toBe('海洋')
    expect(EXCHANGE_DIRECTION.toOcean.from).toBe('大气')
  })

  it('热量两条通道：潜热与长波辐射', () => {
    expect(HEAT_CHANNELS.map((h) => h.id)).toEqual(['latent', 'longwave'])
    expect(HEAT_CHANNELS[0].detail).toContain('蒸发吸热')
    expect(HEAT_CHANNELS[0].detail).toContain('凝结放热')
  })

  it('85% 的热量储存在海洋表层——海洋是大气最主要的热量储存库', () => {
    expect(HEAT_STORAGE.percent).toBe(85)
    expect(HEAT_STORAGE.text).toContain('85%')
    expect(HEAT_STORAGE.conclusion).toContain('热量储存库')
  })
})

describe('§11.15 演示组件', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(AirSeaExchangeDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('水分交换')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('87.5% 只标一下，不展开成考点', async () => {
    const wrapper = mount(AirSeaExchangeDemo)
    await flushPromises()

    const dots = wrapper.findAll('.demo__seg')
    await dots[1].trigger('click')
    expect(wrapper.text()).toContain('87.5%')
    expect(wrapper.text()).toContain('不用记')
  })

  it('点「下一步」能往后走', async () => {
    const wrapper = mount(AirSeaExchangeDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('双向')
    expect(wrapper.text()).toContain('2 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('潜热')
    expect(wrapper.text()).toContain('3 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('动力')
    expect(wrapper.text()).toContain('4 / 4')
  })
})
