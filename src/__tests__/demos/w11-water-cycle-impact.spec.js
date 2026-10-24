// @vitest-environment jsdom
/**
 * §11.3 水循环的意义与人类活动的影响的契约测试。
 *
 * 这一节的全部考点压在一条链上：**下渗 ↑ → 地下径流 ↑ → 地表径流 ↓**。
 * 方向记反就全错，所以这里把六个环节的箭头方向、以及人类活动改了哪些环节
 * 都钉死。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import {
  CYCLE_LINKS,
  HUMAN_IMPACTS,
  MEANINGS,
  STAGE,
  UNIVERSAL_RULE,
  directionAngle,
  linkById,
} from '../../data/waterCycleImpactGeometry'
import WaterCycleImpactDemo from '../../components/demos/WaterCycleImpactDemo.vue'

describe('§11.3 水循环环的方向', () => {
  it('海洋在左、陆地在右', () => {
    expect(STAGE.oceanLeft).toBeLessThan(STAGE.oceanRight)
    expect(STAGE.oceanRight).toBeLessThanOrEqual(STAGE.landLeft)
    expect(STAGE.landRight).toBeGreaterThan(STAGE.landLeft)
    expect(STAGE.oceanLeft).toBeLessThan(STAGE.landRight / 2)
  })

  it('蒸发向上、降水向下', () => {
    const evap = linkById('evaporation')
    const precip = linkById('precipitation')
    expect(directionAngle(evap.from.x, evap.from.y, evap.to.x, evap.to.y)).toBeCloseTo(90, 6)
    expect(directionAngle(precip.from.x, precip.from.y, precip.to.x, precip.to.y)).toBeCloseTo(
      -90,
      6,
    )
  })

  it('水汽输送由海向陆（向右）', () => {
    const t = linkById('transport')
    expect(t.to.x).toBeGreaterThan(t.from.x)
    expect(directionAngle(t.from.x, t.from.y, t.to.x, t.to.y)).toBeCloseTo(0, 6)
  })

  it('地表径流与地下径流都回海（向左）', () => {
    for (const id of ['surface-runoff', 'groundwater-runoff']) {
      const link = linkById(id)
      expect(link.to.x).toBeLessThan(link.from.x)
      const angle = directionAngle(link.from.x, link.from.y, link.to.x, link.to.y)
      expect(Math.abs(angle)).toBeGreaterThan(170)
    }
  })

  it('下渗是向地下（向下）', () => {
    const inf = linkById('infiltration')
    expect(directionAngle(inf.from.x, inf.from.y, inf.to.x, inf.to.y)).toBeCloseTo(-90, 6)
  })

  it('六个环节一个不少', () => {
    expect(CYCLE_LINKS.map((l) => l.id)).toEqual([
      'evaporation',
      'transport',
      'precipitation',
      'surface-runoff',
      'infiltration',
      'groundwater-runoff',
    ])
  })
})

describe('§11.3 人类活动与万能公式', () => {
  it('城市化：下渗减少、地表径流增加', () => {
    const urban = HUMAN_IMPACTS.find((a) => a.id === 'urbanization')
    const dir = Object.fromEntries(urban.changes.map((c) => [c.link, c.dir]))
    expect(dir['下渗']).toBe('down')
    expect(dir['地表径流']).toBe('up')
    expect(dir['地下径流']).toBe('down')
  })

  it('植树造林：下渗增加、地表径流减少', () => {
    const forest = HUMAN_IMPACTS.find((a) => a.id === 'afforestation')
    const dir = Object.fromEntries(forest.changes.map((c) => [c.link, c.dir]))
    expect(dir['下渗']).toBe('up')
    expect(dir['地表径流']).toBe('down')
  })

  it('万能公式：下渗↑ ⇔ 地下径流↑ ⇔ 地表径流↓，反过来也对', () => {
    expect(UNIVERSAL_RULE.up.map((i) => `${i.link}${i.dir}`)).toEqual([
      '下渗up',
      '地下径流up',
      '地表径流down',
    ])
    expect(UNIVERSAL_RULE.down.map((i) => `${i.link}${i.dir}`)).toEqual([
      '下渗down',
      '地下径流down',
      '地表径流up',
    ])
  })

  it('意义四层齐了', () => {
    expect(MEANINGS).toHaveLength(4)
    expect(MEANINGS.map((m) => m.title)).toEqual([
      '使陆地水体不断更新',
      '塑造地表形态',
      '促进物质迁移与能量转换',
      '调节水热平衡',
    ])
  })
})

describe('§11.3 演示组件', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(WaterCycleImpactDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('六个环节')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能往后走', async () => {
    const wrapper = mount(WaterCycleImpactDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('四个意义')
    expect(wrapper.text()).toContain('2 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('人类活动')
    expect(wrapper.text()).toContain('3 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('万能公式')
    expect(wrapper.text()).toContain('4 / 4')
  })
})
