// @vitest-environment jsdom
/**
 * §11.17 厄尔尼诺与拉尼娜（含 §11.16 沃克环流底图）的契约测试。
 *
 * 这一组演示最要紧的是**方向不能画反**：
 *   东南信风从东南吹向赤道 → 近地面箭头指向**西**；暖水因此堆在**西**太平洋。
 * 单测测不出「画得像不像」，但能测出「箭头朝哪边」——
 * 所以这里把方向角、支的位置、海面倾斜都钉死。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import {
  PLOT,
  STATE_META,
  WARM_POOL_X,
  directionAngle,
  walkerCirculation,
} from '../../data/walkerCirculationGeometry'
import WalkerCirculationDemo from '../../components/demos/WalkerCirculationDemo.vue'

const MID = PLOT.left + (PLOT.right - PLOT.left) / 2

describe('§11.17 沃克环流的几何', () => {
  it('正常年：暖水堆在西太平洋，上升支在西、下沉支在东', () => {
    const c = walkerCirculation(WARM_POOL_X.normal)
    expect(c.warmX).toBeLessThan(MID)
    expect(c.coldX).toBeGreaterThan(MID)
    expect(c.rise.x).toBe(c.warmX)
    expect(c.sink.x).toBe(c.coldX)
  })

  it('正常年：近地面气流（东南信风）指向西，高空气流指向东', () => {
    const c = walkerCirculation(WARM_POOL_X.normal)
    // 近地面：下沉支（东）→ 上升支（西），所以由东吹向西
    expect(c.surfaceFlow.fromX).toBeGreaterThan(c.surfaceFlow.toX)
    // 高空：上升支（西）→ 下沉支（东），所以由西吹向东
    expect(c.upperFlow.fromX).toBeLessThan(c.upperFlow.toX)
  })

  it('信风箭头的方向角落在正西（±180°）附近', () => {
    const c = walkerCirculation(WARM_POOL_X.normal)
    const angle = directionAngle(c.surfaceFlow.fromX, 200, c.surfaceFlow.toX, 200)
    // 指向正西：atan2 对水平向左可能给出 +180 或 -180，两者都表示西
    expect(Math.abs(angle)).toBeCloseTo(180, 6)
  })

  it('拉尼娜：暖水比正常年更靠西，下沉支更靠东', () => {
    const normal = walkerCirculation(WARM_POOL_X.normal)
    const lanina = walkerCirculation(WARM_POOL_X.lanina)
    expect(lanina.warmX).toBeLessThan(normal.warmX)
    expect(lanina.coldX).toBeGreaterThan(normal.coldX)
    // 信风增强 → 方向不变，仍然指向西
    expect(lanina.surfaceFlow.fromX).toBeGreaterThan(lanina.surfaceFlow.toX)
  })

  it('厄尔尼诺：暖水回流东太平洋，冷热源反转、低层气流反向', () => {
    const c = walkerCirculation(WARM_POOL_X.elnino)
    expect(c.warmX).toBeGreaterThan(MID)
    expect(c.coldX).toBeLessThan(MID)
    expect(c.rise.x).toBeGreaterThan(MID)
    expect(c.sink.x).toBeLessThan(MID)
    // 暖水在东 → 低层气流由西吹向东
    expect(c.surfaceFlow.fromX).toBeLessThan(c.surfaceFlow.toX)
  })

  it('海面在暖水一侧高（画布 y 更小）', () => {
    const normal = walkerCirculation(WARM_POOL_X.normal)
    expect(normal.seaWestY).toBeLessThan(normal.seaEastY)
    const elnino = walkerCirculation(WARM_POOL_X.elnino)
    expect(elnino.seaEastY).toBeLessThan(elnino.seaWestY)
  })

  it('暖水层在暖水池正下方最厚，向两端趋近于零', () => {
    const c = walkerCirculation(WARM_POOL_X.normal)
    expect(c.layerThickness(c.warmX)).toBeGreaterThan(c.layerThickness(c.coldX))
    expect(c.layerThickness(c.coldX)).toBeLessThan(c.layerThickness(c.warmX) / 4)
  })

  it('三个状态的标题与我国影响都写全了', () => {
    for (const key of ['normal', 'lanina', 'elnino']) {
      expect(STATE_META[key].title.length).toBeGreaterThan(1)
      expect(STATE_META[key].china).toBeTruthy()
    }
    expect(STATE_META.lanina.china).toContain('南旱北涝')
    expect(STATE_META.elnino.china).toContain('北旱南涝')
  })
})

describe('§11.17 演示组件', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(WalkerCirculationDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('正常年')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能往后走，三步分别是正常年、拉尼娜、厄尔尼诺', async () => {
    const wrapper = mount(WalkerCirculationDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('拉尼娜')
    expect(wrapper.text()).toContain('2 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('厄尔尼诺')
    expect(wrapper.text()).toContain('3 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('并排')
    expect(wrapper.text()).toContain('4 / 4')
  })

  it('第一步在头一步时「上一步」是禁用的', () => {
    const wrapper = mount(WalkerCirculationDemo)
    const prev = wrapper.findAll('.demo__controls button').find((b) => b.text() === '上一步')
    expect(prev.attributes('disabled')).toBeDefined()
  })
})
