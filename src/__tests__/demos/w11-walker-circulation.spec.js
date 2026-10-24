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
  MIDLINE,
  PLOT,
  SEA_TILT,
  STATE_META,
  WARM_POOL_X,
  directionAngle,
  seaTiltAmount,
  surfaceFlowDirection,
  walkerCirculation,
  warmPoolXFromTrade,
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

describe('§11.17 信风参数轴', () => {
  it('信风强弱 → 暖水堆位置：三个锚点钉死', () => {
    // 0 = 正常年，+1 = 信风最强（拉尼娜），−1 = 信风最弱（厄尔尼诺）
    expect(warmPoolXFromTrade(0)).toBeCloseTo(WARM_POOL_X.normal, 6)
    expect(warmPoolXFromTrade(1)).toBeCloseTo(WARM_POOL_X.lanina, 6)
    expect(warmPoolXFromTrade(-1)).toBeCloseTo(WARM_POOL_X.elnino, 6)
  })

  it('暖水堆位置随信风连续变化，中途没有跳变', () => {
    const problems = []
    let prev = warmPoolXFromTrade(-1)
    for (let t = -0.95; t <= 1.0001; t += 0.05) {
      const x = warmPoolXFromTrade(t)
      if (!Number.isFinite(x)) problems.push(`trade=${t.toFixed(2)} → ${x}`)
      if (Math.abs(x - prev) > 0.05) problems.push(`trade=${t.toFixed(2)} 处跳变：${prev} → ${x}`)
      prev = x
    }
    expect(problems).toEqual([])
  })

  it('暖水堆在中线时冷热源重合：低层气流停摆', () => {
    const c = walkerCirculation(MIDLINE)
    expect(c.rise.x).toBeCloseTo(c.sink.x, 6)
    expect(c.surfaceFlow.toX).toBeCloseTo(c.surfaceFlow.fromX, 6)
    expect(surfaceFlowDirection(MIDLINE)).toBe('stall')
  })

  it('低层气流走向与暖水堆位置绑在一起（暖水在西 → 吹向西）', () => {
    expect(surfaceFlowDirection(WARM_POOL_X.normal)).toBe('west')
    expect(surfaceFlowDirection(WARM_POOL_X.elnino)).toBe('east')
    const problems = []
    for (let t = -1; t <= 1.0001; t += 0.05) {
      const c = walkerCirculation(warmPoolXFromTrade(t))
      const warmInWest = c.warmX < c.coldX
      const blowsWest = c.surfaceFlow.toX < c.surfaceFlow.fromX
      if (warmInWest !== blowsWest) {
        problems.push(`trade=${t.toFixed(2)}：暖水${warmInWest ? '在西' : '在东'}，气流却吹向${blowsWest ? '西' : '东'}`)
      }
    }
    expect(problems).toEqual([])
  })

  it('海面倾斜：暖水堆在中线时海面是平的', () => {
    const flat = walkerCirculation(MIDLINE)
    expect(flat.seaWestY).toBeCloseTo(flat.seaEastY, 6)
    expect(flat.tiltAmount).toBeCloseTo(0, 6)
  })

  it('海面倾斜：三个定格状态的幅度与原来完全一致', () => {
    for (const key of ['normal', 'lanina', 'elnino']) {
      const c = walkerCirculation(WARM_POOL_X[key])
      expect(c.tiltAmount).toBeCloseTo(1, 6)
      expect(Math.abs(c.seaWestY - c.seaEastY)).toBeCloseTo(SEA_TILT * 2, 6)
    }
  })

  it('海面倾斜连续：越靠近中线越平，只在中线处翻一次面', () => {
    const problems = []
    let prevTilt = null
    let flips = 0
    let prevSign = 0
    for (let warm = 0.02; warm <= 0.9801; warm += 0.005) {
      const c = walkerCirculation(warm)
      const tilt = c.seaWestY - c.seaEastY
      if (!Number.isFinite(tilt)) {
        problems.push(`warm=${warm.toFixed(3)} → ${tilt}`)
        continue
      }
      // 平滑曲线的单步变化理论上限约 1.05px（smoothstep 最大斜率 1.5 ÷ 0.2 × 2 × 14）；
      // 原来的阶跃版一跨中线就跳 28px，这里用 1.5px 卡住「突变」
      if (prevTilt !== null && Math.abs(tilt - prevTilt) > 1.5) {
        problems.push(`warm=${warm.toFixed(3)} 处海面突跳：${prevTilt} → ${tilt}`)
      }
      const sign = Math.sign(tilt)
      if (prevSign !== 0 && sign !== 0 && sign !== prevSign) flips += 1
      if (sign !== 0) prevSign = sign
      prevTilt = tilt
    }
    expect(problems).toEqual([])
    expect(flips).toBe(1)
  })

  it('海面倾斜幅度随离中线的距离单调变化（不会先塌下去再涨回来）', () => {
    const problems = []
    let prev = seaTiltAmount(0.02)
    for (let warm = 0.025; warm <= 0.5001; warm += 0.005) {
      const amt = seaTiltAmount(warm)
      if (amt > prev + 1e-9) problems.push(`warm=${warm.toFixed(3)} 处幅度反而变大：${prev} → ${amt}`)
      prev = amt
    }
    expect(problems).toEqual([])
  })

  it('全程没有 NaN：暖水堆从最西拖到最东', () => {
    const problems = []
    for (let warm = 0.02; warm <= 0.9801; warm += 0.01) {
      const c = walkerCirculation(warm)
      const nums = [
        c.warmX,
        c.coldX,
        c.seaWestY,
        c.seaEastY,
        c.rise.x,
        c.sink.x,
        c.surfaceFlow.fromX,
        c.surfaceFlow.toX,
        c.upperFlow.fromX,
        c.upperFlow.toX,
      ]
      for (const n of nums) if (!Number.isFinite(n)) problems.push(`warm=${warm.toFixed(2)} → ${n}`)
    }
    expect(problems).toEqual([])
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

  it('第①步有参数轴，拖动后标题与读数跟着变', async () => {
    const wrapper = mount(WalkerCirculationDemo)
    await flushPromises()

    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(true)
    expect(wrapper.find('.demo__title').text()).toContain('正常年')
    expect(wrapper.find('.demo-slider__value').text()).toContain('暖水在西')

    await slider.setValue('1')
    await flushPromises()
    expect(wrapper.find('.demo__title').text()).toContain('信风异常增强')
    expect(wrapper.find('.demo-slider__value').text()).toContain('偏拉尼娜')

    await slider.setValue('-1')
    await flushPromises()
    expect(wrapper.find('.demo__title').text()).toContain('信风异常偏弱')
    expect(wrapper.find('.demo-slider__value').text()).toContain('偏厄尔尼诺')
  })

  it('第②步没有参数轴：三个状态是定格参照', async () => {
    const wrapper = mount(WalkerCirculationDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.find('input[type="range"]').exists()).toBe(false)
  })

  it('拖动参数只改第①步的图，②③的定格参照纹丝不动', async () => {
    const wrapper = mount(WalkerCirculationDemo)
    await flushPromises()

    const panels = () => wrapper.findAll('.demo__frame')
    // 暖水层的形状跟着暖水堆走，所以拿它当「这张图变了没有」的凭据
    const warmPathOf = (i) => panels()[i].find('.wk-warm').attributes().d
    const before = [warmPathOf(1), warmPathOf(2)]
    const liveBefore = warmPathOf(0)

    await wrapper.find('input[type="range"]').setValue('1')
    await flushPromises()

    expect([warmPathOf(1), warmPathOf(2)]).toEqual(before)
    expect(warmPathOf(0)).not.toBe(liveBefore)
  })

  it('拖动全程画出来的属性都合法：没有 NaN、路径以 M 开头', async () => {
    const wrapper = mount(WalkerCirculationDemo)
    await flushPromises()

    const problems = []
    for (const value of ['-1', '-0.6', '-0.55', '-0.4', '0', '0.4', '1']) {
      await wrapper.find('input[type="range"]').setValue(value)
      await flushPromises()
      for (const el of wrapper.findAll('.demo__canvas *')) {
        for (const [name, attr] of Object.entries(el.attributes())) {
          if (/NaN|undefined/.test(attr)) problems.push(`${value}：<${el.tagName} ${name}="${attr}">`)
        }
        const d = el.attributes().d
        if (d && !/^[Mm]/.test(d)) problems.push(`${value}：路径不是 M 开头 → ${d.slice(0, 40)}`)
      }
    }
    expect(problems).toEqual([])
  })
})
