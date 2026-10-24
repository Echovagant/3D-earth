// @vitest-environment jsdom
/**
 * §2.18 图例和注记演示的回归守卫。
 *
 * 这一节不涉及几何，但有三件事必须守住：
 *   ① 演示能渲染、能逐步切换；
 *   ② 图上确实有图例和注记两类东西（不能画成一张真地图）；
 *   ③ 判读顺序那一步给出「先图例注记 → 再方向 → 最后量算」。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import MapLegendDemo from '../../components/demos/MapLegendDemo.vue'

describe('§2.18 图例和注记的演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(MapLegendDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('地图上画的都是符号')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('图上同时有图例（符号说明）和注记（文字）', async () => {
    const wrapper = mount(MapLegendDemo)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('图例')
    expect(text).toContain('山峰')
    expect(text).toContain('居民点')
    expect(text).toContain('河流')
    expect(text).toContain('铁路')
    expect(text).toContain('甲村')
    expect(text).toContain('1200 米')
  })

  it('最后一步给出判读顺序', async () => {
    const wrapper = mount(MapLegendDemo)
    await flushPromises()

    const dots = wrapper.findAll('.demo__dot')
    await dots[3].trigger('click')
    const text = wrapper.text()
    expect(text).toContain('先读图例和注记')
    expect(text).toContain('再定方向')
    expect(text).toContain('最后用比例尺量算')
    expect(text).toContain('4 / 4')
  })
})
