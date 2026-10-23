// @vitest-environment jsdom
/**
 * 气压带风带互动实验的回归守卫。
 *
 * 这一页最容易出错的不是画图，而是下面几条事实：
 *   ① 气压带 7 个、风带 6 个，且气压带的纬度区间互不重叠。
 *   ② 北半球从北往南的气压带顺序：极地高压 → 副极地低压 → 副热带高压 → 赤道低压。
 *   ③ 南北半球同纬度带位置、天气、气候一致，风向相反。
 *   ④ 只有副热带高气压带可以简称「副高」。
 *   ⑤ 副极地低气压带是「温湿」，信风带是「热干」——两个最容易写错的点。
 *   ⑥ 太阳直射点北移时，整组气压带风带跟着北移。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import PressureBeltLab from '../components/PressureBeltLab.vue'
import {
  ALTERNATION_RULE,
  COMMON_MISTAKES,
  PRESSURE_BELTS,
  PRESSURE_BELT_TOTAL,
  QUIZ_ITEMS,
  SHORT_NAME_RULE,
  WIND_BELTS,
  WIND_BELT_TOTAL,
  beltCenterAt,
  beltRangeAt,
  findBelt,
  formatLatRange,
  hemispherePairs,
  matchKeywords,
  validateBeltData,
} from '../data/pressureBeltLab'

/** 挂载组件：组件本身不依赖网络，数据直接喂 props */
const mountLab = async (props = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } }],
  })
  await router.push('/course')
  await router.isReady()
  const wrapper = mount(PressureBeltLab, { props, global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

/** 去掉强调标记，方便和渲染后的文本比对 */
const plain = (text) => String(text ?? '').replace(/\*\*/g, '')

describe('气压带风带实验：数据契约', () => {
  it('气压带恰好 7 个、风带恰好 6 个', () => {
    expect(PRESSURE_BELTS.length).toBe(7)
    expect(WIND_BELTS.length).toBe(6)
    expect(PRESSURE_BELT_TOTAL).toBe(7)
    expect(WIND_BELT_TOTAL).toBe(6)
  })

  it('气压带的纬度区间互不重叠，合起来正好铺满 −90°–90°', () => {
    const sorted = [...PRESSURE_BELTS].sort((a, b) => a.latFrom - b.latFrom)
    const overlaps = []
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].latFrom < sorted[i - 1].latTo) {
        overlaps.push(`${sorted[i - 1].id} 与 ${sorted[i].id}`)
      }
    }
    expect(overlaps).toEqual([])
    expect(sorted[0].latFrom).toBe(-90)
    expect(sorted[sorted.length - 1].latTo).toBe(90)
  })

  it('北半球自北向南的气压带顺序：极地高压 → 副极地低压 → 副热带高压 → 赤道低压', () => {
    const north = PRESSURE_BELTS.filter((belt) => belt.hemisphere === 'north').sort(
      (a, b) => b.centerLat - a.centerLat,
    )
    expect(north.map((belt) => belt.pairKey)).toEqual([
      'polar-high',
      'subpolar-low',
      'subtropical-high',
    ])
    // 赤道低气压带跨赤道，单独占一行
    const equatorial = PRESSURE_BELTS.find((belt) => belt.hemisphere === 'both')
    expect(equatorial.pairKey).toBe('equatorial-low')
    expect(equatorial.centerLat).toBe(0)
  })

  it('气压带两侧一定是风带（相间分布）', () => {
    const all = [...PRESSURE_BELTS, ...WIND_BELTS].sort((a, b) => a.latFrom - b.latFrom)
    const kinds = all.map((belt) => belt.kind)
    const broken = kinds.filter((kind, index) => {
      if (index === 0 || index === kinds.length - 1) return false
      return kind === kinds[index - 1] && kind === kinds[index + 1]
    })
    expect(broken).toEqual([])
  })

  it('南北半球同纬度带：位置、天气、气候一致，风向相反', () => {
    const pairs = hemispherePairs([...PRESSURE_BELTS, ...WIND_BELTS])
    expect(pairs.length).toBe(6)

    // 纬度区间按绝对值比：南半球的 latFrom 是靠极点那一侧，不能直接比符号
    const extent = (belt) => [
      Math.min(Math.abs(belt.latFrom), Math.abs(belt.latTo)),
      Math.max(Math.abs(belt.latFrom), Math.abs(belt.latTo)),
    ]

    const problems = []
    for (const pair of pairs) {
      if (Math.abs(pair.north.centerLat) !== Math.abs(pair.south.centerLat)) {
        problems.push(`${pair.key}: 中心纬度不一致`)
      }
      if (extent(pair.north)[0] !== extent(pair.south)[0]) {
        problems.push(`${pair.key}: 纬度区间不一致`)
      }
      if (extent(pair.north)[1] !== extent(pair.south)[1]) {
        problems.push(`${pair.key}: 纬度区间上界不一致`)
      }
      if (pair.kind === 'pressure') {
        if (pair.north.weather !== pair.south.weather) problems.push(`${pair.key}: 天气不一致`)
        if (pair.north.climate !== pair.south.climate) problems.push(`${pair.key}: 气候不一致`)
        if (pair.north.causeType !== pair.south.causeType) problems.push(`${pair.key}: 成因不一致`)
      } else {
        if (pair.north.heat !== pair.south.heat) problems.push(`${pair.key}: 热量不一致`)
        if (pair.north.moisture !== pair.south.moisture) problems.push(`${pair.key}: 干湿不一致`)
        // 风向相反：经向分量相同、南北分量相反
        if (pair.north.flow.lon !== pair.south.flow.lon) problems.push(`${pair.key}: 经向分量不一致`)
        if (pair.north.flow.lat !== -pair.south.flow.lat) problems.push(`${pair.key}: 风向没有相反`)
        if (pair.north.windName === pair.south.windName) problems.push(`${pair.key}: 风向名相同`)
      }
    }
    expect(problems).toEqual([])
  })

  it('只有副热带高气压带允许简称「副高」', () => {
    const allowed = PRESSURE_BELTS.filter((belt) => belt.shortNameAllowed)
    expect(allowed.map((belt) => belt.pairKey)).toEqual(['subtropical-high', 'subtropical-high'])
    expect(allowed.every((belt) => belt.shortName === '副高')).toBe(true)

    const others = PRESSURE_BELTS.filter((belt) => !belt.shortNameAllowed)
    expect(others.every((belt) => belt.shortName === null)).toBe(true)
    expect(SHORT_NAME_RULE).toContain('副热带高气压带')
  })

  it('副极地低气压带是「温湿」，信风带是「热干」', () => {
    const subpolar = PRESSURE_BELTS.filter((belt) => belt.pairKey === 'subpolar-low')
    expect(subpolar.length).toBe(2)
    expect(subpolar.every((belt) => belt.climate === '温湿')).toBe(true)
    expect(subpolar.every((belt) => belt.climate !== '冷湿')).toBe(true)

    const trades = WIND_BELTS.filter((belt) => belt.pairKey === 'trade')
    expect(trades.length).toBe(2)
    expect(trades.every((belt) => belt.thermalMoisture === '热干')).toBe(true)
    expect(trades.every((belt) => belt.heat === '偏热' && belt.moisture === '偏干')).toBe(true)
  })

  it('风带的热量与干湿自洽：西风温湿、东风冷干', () => {
    const westerly = WIND_BELTS.filter((belt) => belt.pairKey === 'westerly')
    const easterly = WIND_BELTS.filter((belt) => belt.pairKey === 'polar-easterly')
    expect(westerly.every((belt) => belt.thermalMoisture === '温湿')).toBe(true)
    expect(easterly.every((belt) => belt.thermalMoisture === '冷干')).toBe(true)
  })

  it('每个带都带齐了展示与判定需要的字段', () => {
    const broken = [...PRESSURE_BELTS, ...WIND_BELTS].flatMap((belt) => {
      const missing = []
      if (!belt.id || !belt.name || !belt.shortLabel) missing.push('名称')
      if (!Number.isFinite(belt.latFrom) || !Number.isFinite(belt.latTo)) missing.push('纬度区间')
      if (!Number.isFinite(belt.centerLat)) missing.push('中心纬度')
      if (!belt.positionText) missing.push('位置说明')
      if (!Array.isArray(belt.keywords) || !belt.keywords.length) missing.push('判据关键词')
      if (belt.kind === 'pressure') {
        if (!belt.causeType || !belt.cause) missing.push('成因')
        if (!belt.vertical || !belt.weather || !belt.climate) missing.push('天气气候')
      } else {
        if (!belt.windName) missing.push('风向')
        if (!belt.heat || !belt.moisture || !belt.thermalMoisture) missing.push('冷热干湿')
        if (!belt.mechanism || !belt.precipitation) missing.push('机制降水')
        if (!belt.flow) missing.push('气流方向')
      }
      return missing.length ? [`${belt.id}: 缺 ${missing.join('/')}`] : []
    })
    expect(broken).toEqual([])
  })

  it('易错提醒覆盖了最容易写错的几个点', () => {
    const ids = COMMON_MISTAKES.map((mistake) => mistake.id)
    expect(ids).toContain('shortname')
    expect(ids).toContain('subpolar-climate')
    expect(ids).toContain('trade-heat')
    expect(ids).toContain('scale')
    expect(ALTERNATION_RULE).toContain('两侧')
  })
})

describe('气压带风带实验：季节移动', () => {
  it('δ 增大（北半球夏至方向）时，每个带的位置都整体北移', () => {
    const belts = [...PRESSURE_BELTS, ...WIND_BELTS]
    const notMovingNorth = belts
      .filter((belt) => beltCenterAt(belt, 23.5) <= beltCenterAt(belt, 0))
      .map((belt) => belt.id)
    expect(notMovingNorth).toEqual([])
  })

  it('δ 减小时（北半球冬至方向）各带整体南移', () => {
    const belts = [...PRESSURE_BELTS, ...WIND_BELTS]
    const notMovingSouth = belts
      .filter((belt) => beltCenterAt(belt, -23.5) >= beltCenterAt(belt, 0))
      .map((belt) => belt.id)
    expect(notMovingSouth).toEqual([])
  })

  it('平移后气压带与风带仍然相接、不互相压叠', () => {
    for (const delta of [-23.5, -10, 0, 10, 23.5]) {
      const ranges = [...PRESSURE_BELTS, ...WIND_BELTS]
        .map((belt) => beltRangeAt(belt, delta))
        .sort((a, b) => a.latFrom - b.latFrom)
      const overlaps = []
      for (let i = 1; i < ranges.length; i += 1) {
        if (ranges[i].latFrom < ranges[i - 1].latTo - 1e-9) {
          overlaps.push([ranges[i - 1], ranges[i]])
        }
      }
      expect(overlaps).toEqual([])
      expect(ranges[0].latFrom).toBeGreaterThanOrEqual(-90.0001)
      expect(ranges[ranges.length - 1].latTo).toBeLessThanOrEqual(90.0001)
    }
  })

  it('赤道低气压带在夏至方向移到赤道以北', () => {
    const equatorial = findBelt('equatorial-low')
    expect(beltCenterAt(equatorial, 23.5)).toBeGreaterThan(0)
    expect(beltCenterAt(equatorial, -23.5)).toBeLessThan(0)
  })

  it('极地高气压带始终留在极点一侧，不会跑出地球', () => {
    const polar = PRESSURE_BELTS.filter((belt) => belt.polarRole === 'cap')
    expect(polar.length).toBe(2)
    for (const belt of polar) {
      const range = beltRangeAt(belt, 23.5)
      expect(range.latFrom).toBeGreaterThanOrEqual(-90.0001)
      expect(range.latTo).toBeLessThanOrEqual(90.0001)
    }
  })
})

describe('气压带风带实验：工具函数', () => {
  it('findBelt 能按 id 找到带', () => {
    expect(findBelt('subtropical-high-n').pairKey).toBe('subtropical-high')
    expect(findBelt('不存在的带')).toBeNull()
  })

  it('formatLatRange 输出带南北纬的区间文字', () => {
    expect(formatLatRange({ latFrom: 25, latTo: 35 })).toBe('25.0°–35.0°N')
    expect(formatLatRange({ latFrom: -90, latTo: -85 })).toBe('85.0°–90.0°S')
  })

  it('matchKeywords 找出描述里的判据关键词', () => {
    const belt = findBelt('equatorial-low')
    const hits = matchKeywords('某地终年高温多雨，空气盛行上升', belt)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits).toContain('终年高温')
  })

  it('validateBeltData 能挑出坏数据', () => {
    expect(validateBeltData({ pressureBelts: PRESSURE_BELTS, windBelts: WIND_BELTS })).toBe(true)
    expect(() => validateBeltData({ pressureBelts: [], windBelts: WIND_BELTS })).toThrow()
    expect(() => validateBeltData({ pressureBelts: PRESSURE_BELTS, windBelts: [] })).toThrow()
    expect(() => validateBeltData({ pressureBelts: [{ id: 'x' }], windBelts: WIND_BELTS })).toThrow()
  })
})

describe('气压带风带实验：组件', () => {
  it('挂载后渲染出地球示意图、条带与返回课程地图的链接', async () => {
    const wrapper = await mountLab()

    expect(wrapper.classes()).toContain('learn-page')
    expect(wrapper.find('a[href="/course"]').exists()).toBe(true)
    expect(wrapper.find('svg.pressure-belt-lab__globe').exists()).toBe(true)
    // 7 个气压带 + 6 个风带
    expect(wrapper.findAll('.pressure-belt-lab__band')).toHaveLength(13)
    expect(wrapper.findAll('.pressure-belt-lab__band-rect.pressure')).toHaveLength(7)
    expect(wrapper.findAll('.pressure-belt-lab__band-rect.wind')).toHaveLength(6)
  })

  it('点选一条气压带会显示它的成因、天气与气候', async () => {
    const wrapper = await mountLab()

    await wrapper.findAll('.pressure-belt-lab__band')[0].trigger('click')

    const side = wrapper.find('.pressure-belt-lab__side')
    expect(side.text()).toContain('赤道低气压带')
    expect(side.text()).toContain('成因')
    expect(side.text()).toContain('天气')
    expect(side.text()).toContain('气候')
    expect(wrapper.findAll('.pressure-belt-lab__band.is-selected')).toHaveLength(1)
  })

  it('点选一条风带会显示风向与冷热干湿', async () => {
    const wrapper = await mountLab()

    const tradeIndex = wrapper
      .findAll('.pressure-belt-lab__band')
      .findIndex((node) => node.attributes('aria-label')?.includes('信风带（北半球）'))
    await wrapper.findAll('.pressure-belt-lab__band')[tradeIndex].trigger('click')

    const side = wrapper.find('.pressure-belt-lab__side')
    expect(side.text()).toContain('东北信风')
    expect(side.text()).toContain('偏热')
    expect(side.text()).toContain('偏干')
  })

  it('拖动滑块改直射点纬度时，条带跟着移动', async () => {
    const wrapper = await mountLab()

    const band = () => wrapper.findAll('.pressure-belt-lab__band')[0]
    const before = band().find('rect').attributes('y')

    await wrapper.find('input[type="range"]').setValue(23.5)

    expect(wrapper.find('.pressure-belt-lab__season-value').text()).toContain('23.5°N')
    expect(band().find('rect').attributes('y')).not.toBe(before)
  })

  it('切换到南半球视图会淡出北半球的带', async () => {
    const wrapper = await mountLab()

    const southButton = wrapper
      .findAll('.pressure-belt-lab__hemispheres button')
      .find((node) => node.text().includes('南半球'))
    await southButton.trigger('click')

    const dimmed = wrapper.findAll('.pressure-belt-lab__band.is-dim')
    expect(dimmed.length).toBeGreaterThan(0)
    expect(dimmed.every((node) => node.attributes('aria-label')?.includes('北半球'))).toBe(true)
  })

  it('南北半球对照表把每一对带列出来，并点明风向相反', async () => {
    const wrapper = await mountLab()

    const rows = wrapper.findAll('.pressure-belt-lab__table tbody tr')
    expect(rows).toHaveLength(6)
    expect(wrapper.find('.pressure-belt-lab__table').text()).toContain('风向相反')
    expect(wrapper.find('.pressure-belt-lab__table').text()).toContain('东北信风')
    expect(wrapper.find('.pressure-belt-lab__table').text()).toContain('东南信风')
  })

  it('答对时给出判据说明', async () => {
    const wrapper = await mountLab()
    const item = QUIZ_ITEMS[0]
    const index = item.options.indexOf(item.answerId)

    await wrapper.findAll('.pressure-belt-lab__option')[index].trigger('click')

    const feedback = wrapper.find('.pressure-belt-lab__feedback')
    expect(feedback.exists()).toBe(true)
    expect(feedback.text()).toContain('判读正确')
    expect(feedback.text()).toContain('赤道低气压带')
    expect(feedback.classes()).toContain('is-right')
  })

  it('答错时给出纠正性提示，而不是只说一句错误', async () => {
    const wrapper = await mountLab()
    const item = QUIZ_ITEMS[0]
    const index = item.options.findIndex((option) => option !== item.answerId)
    const chosen = item.options[index]

    await wrapper.findAll('.pressure-belt-lab__option')[index].trigger('click')

    const feedback = wrapper.find('.pressure-belt-lab__feedback')
    expect(feedback.text()).toContain('再核对一次')
    expect(feedback.text()).not.toContain('判读正确')
    expect(feedback.text()).toContain(plain(item.wrong[chosen]).slice(0, 12))
    expect(feedback.classes()).toContain('is-wrong')
  })

  it('可以切到下一题，进度随之更新', async () => {
    const wrapper = await mountLab()

    expect(wrapper.find('.pressure-belt-lab__quiz').text()).toContain('第 1 /')

    await wrapper.findAll('.pressure-belt-lab__nav button')[1].trigger('click')

    expect(wrapper.find('.pressure-belt-lab__quiz').text()).toContain('第 2 /')
  })

  it('没有数据时给出空态', async () => {
    const wrapper = await mountLab({ pressureBelts: [], windBelts: [] })

    expect(wrapper.find('.learn-empty').exists()).toBe(true)
    expect(wrapper.find('.learn-empty').text()).toContain('没有可用的气压带风带数据')
  })

  it('数据有问题时显示错误原因', async () => {
    const wrapper = await mountLab({ pressureBelts: [{ id: 'broken' }] })

    expect(wrapper.find('.learn-error').exists()).toBe(true)
    expect(wrapper.find('.learn-error').text()).toContain('气压带风带数据不可用')
  })
})
