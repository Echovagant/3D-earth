// @vitest-environment jsdom
/**
 * §15.10 中国地图速记方法：骨架与钉点必须逐字对上讲义。
 *
 * 讲义原文：6 条经线 = 东经 80、90、100、110、120、130；
 * 6 条纬线 = 北纬 20、30、40、50 + 北回归线 + 北纬 34°。
 * 钉点逐条照抄讲义的表：海口(20°,110°E)、拉萨(30°,90°E)、巫山(30°,110°E)、
 * 杭州(30°,120°E)、秦岭(34°,110°E)、北京(40°,116°E)、大兴安岭(50°,120°E)、
 * 阿尔泰山地(50°,90°E)……
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import MapGridMnemonicDemo from '../../components/demos/MapGridMnemonicDemo.vue'
import {
  ANCHOR_ROWS,
  EXTRA_POINT,
  EXTENT,
  MERIDIANS,
  PARALLELS,
  gridProjection,
  rowAnchors,
} from '../../data/mapGridMnemonicGeometry'

/** 在讲义的表里找某个钉点 */
function findAnchor(lat, lon) {
  for (const row of ANCHOR_ROWS) {
    if (row.lat !== lat) continue
    const hit = row.items.find((i) => i.kind === 'point' && i.lon === lon)
    if (hit) return hit
  }
  return null
}

describe('§15.10 骨架', () => {
  it('6 条经线：东经 80、90、100、110、120、130', () => {
    expect(MERIDIANS).toEqual([80, 90, 100, 110, 120, 130])
  })

  it('6 条纬线：北纬 20、30、40、50 + 北回归线 + 北纬 34°', () => {
    expect(PARALLELS).toHaveLength(6)
    expect(PARALLELS.map((p) => p.lat)).toEqual([50, 40, 34, 30, 23.5, 20])
    expect(PARALLELS.map((p) => p.label)).toEqual([
      '北纬 50°',
      '北纬 40°',
      '北纬 34°',
      '北纬 30°',
      '北回归线',
      '北纬 20°',
    ])
  })
})

describe('§15.10 钉点照讲义抄', () => {
  it('几个关键钉点的经纬度与名称与讲义一致', () => {
    expect(findAnchor(20, 110).name).toBe('海口')
    expect(findAnchor(23.5, 100).name).toBe('云南')
    expect(findAnchor(23.5, 110).name).toBe('广西')
    expect(findAnchor(23.5, 120).name).toBe('台湾')
    expect(findAnchor(30, 90).name).toBe('拉萨')
    expect(findAnchor(30, 100).name).toBe('横断山脉')
    expect(findAnchor(30, 105).name).toBe('成都')
    expect(findAnchor(30, 107).name).toBe('重庆')
    expect(findAnchor(30, 110).name).toBe('巫山')
    expect(findAnchor(30, 120).name).toBe('杭州')
    expect(findAnchor(34, 110).name).toBe('秦岭')
    expect(findAnchor(40, 90).name).toBe('塔里木盆地')
    expect(findAnchor(40, 100).name).toBe('祁连山 + 河西走廊')
    expect(findAnchor(40, 110).name).toBe('黄河几字弯')
    expect(findAnchor(40, 116).name).toBe('北京')
    expect(findAnchor(50, 90).name).toBe('阿尔泰山地')
    expect(findAnchor(50, 120).name).toBe('大兴安岭')
  })

  it('讲义没给经纬度的（广东、长江中下游）只作区间，不编坐标', () => {
    const tropic = ANCHOR_ROWS.find((r) => r.lat === 23.5)
    const guangdong = tropic.items.find((i) => i.name === '广东')
    expect(guangdong.kind).toBe('band')
    const row30 = ANCHOR_ROWS.find((r) => r.lat === 30)
    const yangtze = row30.items.find((i) => i.name === '长江中下游')
    expect(yangtze.kind).toBe('band')
    expect(yangtze.note).toContain('110°–120°')
  })

  it('骨架外的那一点：乌鲁木齐 北纬 44°、东经 88°', () => {
    expect(EXTRA_POINT.lat).toBe(44)
    expect(EXTRA_POINT.lon).toBe(88)
    expect(EXTRA_POINT.name).toBe('乌鲁木齐')
  })

  it('四至锚点在讲义里都有登记', () => {
    const text = EXTENT.map((e) => e.text).join(' ')
    expect(text).toContain('73°')
    expect(text).toContain('135°')
    expect(text).toContain('53°')
    expect(text).toContain('4°')
  })
})

describe('§15.10 网格投影', () => {
  it('经度增大向右、纬度增大向上', () => {
    const p = gridProjection({ left: 88, right: 640, top: 44, bottom: 300 }, 78, 132, 16, 52)
    expect(p.x(80)).toBeGreaterThan(p.x(70))
    expect(p.y(50)).toBeLessThan(p.y(20))
    expect(p.x(80)).toBeCloseTo(88 + (2 / 54) * 552, 6)
  })

  it('钉点的画布坐标由经纬度算出', () => {
    const p = gridProjection({ left: 88, right: 640, top: 44, bottom: 300 }, 78, 132, 16, 52)
    const row = ANCHOR_ROWS.find((r) => r.lat === 40)
    const anchors = rowAnchors(p, row)
    const beijing = anchors.find((a) => a.name === '北京')
    expect(beijing.x).toBeCloseTo(p.x(116), 6)
    expect(beijing.y).toBeCloseTo(p.y(40), 6)
  })
})

describe('§15.10 中国地图速记演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(MapGridMnemonicDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('先搭骨架')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('第二步点亮南段的钉点', async () => {
    const wrapper = mount(MapGridMnemonicDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__dot')
    await dots[1].trigger('click')
    expect(wrapper.text()).toContain('海口')
    expect(wrapper.text()).toContain('拉萨')
    expect(wrapper.text()).toContain('巫山')
  })

  it('第三步点亮北段的钉点，第四步给出钉钉子的方法与四至', async () => {
    const wrapper = mount(MapGridMnemonicDemo)
    await flushPromises()
    const dots = wrapper.findAll('.demo__dot')
    await dots[2].trigger('click')
    expect(wrapper.text()).toContain('秦岭')
    expect(wrapper.text()).toContain('北京')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('先钉格子，再往格子里填名字')
    expect(wrapper.text()).toContain('乌鲁木齐')
    expect(wrapper.text()).toContain('帕米尔')
  })
})
