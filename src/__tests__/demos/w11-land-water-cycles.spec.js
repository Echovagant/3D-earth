// @vitest-environment jsdom
/**
 * §11.6 陆地水体之间的相互转化的契约测试。
 *
 * 讲义的总原则：两个水体只要连通，水位高的就补给水位低的。
 * 所以图上「红色箭头」= 双向补给的，两个方向都能走——
 * 铁三角（河流、湖泊、地下水）必须两两双向，单向箭头才固定方向。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import {
  IRON_TRIANGLE,
  LAKE_KINDS,
  LINKS,
  NODES,
  SEASON_SWITCH,
  isBidirectional,
} from '../../data/landWaterCyclesGeometry'
import LandWaterCyclesDemo from '../../components/demos/LandWaterCyclesDemo.vue'

describe('§11.6 逻辑图的结构', () => {
  it('讲义里点名的水体都在图上', () => {
    for (const id of [
      'precipitation',
      'river',
      'lake',
      'groundwater',
      'glacier',
      'marsh',
      'ocean',
    ]) {
      expect(NODES[id], `缺了 ${id}`).toBeTruthy()
    }
  })

  it('铁三角：河流、湖泊、地下水三者两两之间都是双向补给', () => {
    expect(IRON_TRIANGLE).toEqual(['river', 'lake', 'groundwater'])
    expect(isBidirectional('river', 'lake')).toBe(true)
    expect(isBidirectional('river', 'groundwater')).toBe(true)
    expect(isBidirectional('lake', 'groundwater')).toBe(true)
  })

  it('双向的只有铁三角那三条，其余方向固定', () => {
    const both = LINKS.filter((l) => l.both).map((l) => l.id).sort()
    expect(both).toEqual(['lake-groundwater', 'river-groundwater', 'river-lake'])
    expect(isBidirectional('river', 'ocean')).toBe(false)
    expect(isBidirectional('rain', 'river')).toBe(false)
  })

  it('外流河入海是单向的：河流 → 海洋', () => {
    const link = LINKS.find((l) => l.id === 'river-ocean')
    expect(link.from).toBe('river')
    expect(link.to).toBe('ocean')
    expect(link.both).toBeUndefined()
  })

  it('汛期与枯水期是同一对水体的两种方向', () => {
    expect(SEASON_SWITCH.map((s) => s.label)).toEqual(['汛期', '枯水期'])
    expect(SEASON_SWITCH[0].result).toBe('河流补给地下水')
    expect(SEASON_SWITCH[1].result).toBe('地下水补给河流')
  })

  it('内流湖外流湖的判据是出湖径流，不是咸淡', () => {
    expect(LAKE_KINDS.map((k) => k.mark)).toEqual(['有进有出', '有进无出'])
    expect(LAKE_KINDS[0].label).toBe('外流湖')
    expect(LAKE_KINDS[1].label).toBe('内流湖')
  })
})

describe('§11.6 演示组件', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(LandWaterCyclesDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('逻辑图')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能往后走', async () => {
    const wrapper = mount(LandWaterCyclesDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('铁三角')
    expect(wrapper.text()).toContain('2 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('汛期')
    expect(wrapper.text()).toContain('3 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('修水库')
    expect(wrapper.text()).toContain('4 / 4')
  })
})
