// @vitest-environment jsdom
/**
 * §4 地球的公转——四个演示动画的契约测试。
 *
 * 守三件事：
 *   ① 演示 id 与组件对得上，步骤能切换；
 *   ② 轨道与光照图的几何是**算出来的**，数值必须对——
 *      近日/远日、二分二至的位置、等面积、切点纬度、太阳高度角；
 *   ③ 画法上最容易错的方向不能反：垂线过球心、切点与极圈相切。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import {
  ECCENTRICITY,
  NORTHERN_SUMMER_DAYS,
  NORTHERN_WINTER_DAYS,
  SEASONS,
  arcLength,
  equalAreaSectors,
  orbitPoint,
  seasonMarker,
  solveKepler,
  sweptArea,
} from '../../data/earthOrbitGeometry'
import {
  OBLIQUITY,
  POLAR_CIRCLE,
  SEASON_DAYS,
  TROPIC,
  declination,
  parallelSegment,
} from '../../data/obliqueAxisGeometry'
import {
  DECL,
  VIEW,
  cutLatitudes,
  declinationReadout,
  parallelSegment as dnParallelSegment,
  polarCapPath,
  polarDaySide,
  subsolarPoint,
  tangentPoints,
  terminatorLine,
} from '../../data/dayNightDrawingGeometry'
import {
  dayLengthHours,
  hourAngleRange,
  noonAltitude,
  noonSide,
  sunriseAzimuth,
  sunPosition,
} from '../../data/sunPathGeometry'
import EarthOrbitDemo from '../../components/demos/EarthOrbitDemo.vue'
import ObliqueAxisDemo from '../../components/demos/ObliqueAxisDemo.vue'
import DayNightDrawingDemo from '../../components/demos/DayNightDrawingDemo.vue'
import SunPathDemo from '../../components/demos/SunPathDemo.vue'

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const circle = (center, r) => (p) => Math.abs(dist(p, center) - r) < 1e-6

describe('§4.1 公转轨道的几何', () => {
  it('解开普勒方程：E − e·sinE = M', () => {
    for (const M of [0.3, 1.2, 3.0, 4.8, 6.1]) {
      const E = solveKepler(M)
      expect(E - ECCENTRICITY * Math.sin(E)).toBeCloseTo(M, 8)
    }
  })

  it('近日点与远日点分别在长轴两端，焦点上的太阳离近点更近', () => {
    const near = orbitPoint(0)
    const far = orbitPoint(Math.PI)
    expect(near.x).toBeGreaterThan(far.x)
    const sun = { x: near.x - 132 * ECCENTRICITY, y: near.y }
    expect(dist(sun, near)).toBeLessThan(dist(sun, far))
  })

  it('冬至离近日点最近、夏至离远日点最近', () => {
    const m = Object.fromEntries(SEASONS.map((s) => [s.key, seasonMarker(s)]))
    const angleTo = (marker, E) => {
      let d = Math.abs(((marker.E - E + Math.PI) % (2 * Math.PI)) - Math.PI)
      return d
    }
    expect(angleTo(m.winter, 0)).toBeLessThan(0.6)
    expect(angleTo(m.summer, Math.PI)).toBeLessThan(0.6)
  })

  it('二分二至按公转方向依次排开：春分 → 夏至 → 秋分 → 冬至', () => {
    const marks = SEASONS.map((s) => seasonMarker(s))
    for (let i = 1; i < marks.length; i += 1) {
      expect(marks[i].E).toBeGreaterThan(marks[i - 1].E)
    }
    expect(marks[0].E).toBeLessThan(marks[1].E)
  })

  it('等时间内扫过等面积，但近日点一侧的弧长明显更长', () => {
    const s = equalAreaSectors(30)
    expect(s.perihelion.area).toBeCloseTo(s.aphelion.area, 6)
    expect(s.perihelion.arc).toBeGreaterThan(s.aphelion.arc * 1.4)
    expect(s.ratio).toBeGreaterThan(1.4)
  })

  it('扫过的面积与平近点角成正比（开普勒第二定律）', () => {
    const a = sweptArea(solveKepler(1.0))
    const b = sweptArea(solveKepler(2.0))
    expect(b / a).toBeCloseTo(2, 6)
  })

  it('北半球夏半年比冬半年长：时间更多、弧长更短', () => {
    expect(NORTHERN_SUMMER_DAYS).toBeGreaterThan(NORTHERN_WINTER_DAYS)
    const m = Object.fromEntries(SEASONS.map((s) => [s.key, seasonMarker(s)]))
    const summerArc = arcLength(m.vernal.E, m.autumnal.E)
    const winterArc = arcLength(m.autumnal.E, m.vernal.E + Math.PI * 2)
    expect(summerArc).toBeLessThan(winterArc)
  })
})

describe('§4.1 地球公转演示', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(EarthOrbitDemo)
    await flushPromises()
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('1 / 4')
    expect(wrapper.text()).toContain('一近快')
  })

  it('点「下一步」能往后走', async () => {
    const wrapper = mount(EarthOrbitDemo)
    await flushPromises()
    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('2 / 4')
    expect(wrapper.text()).toContain('近日点')
  })
})

describe('§4.2 黄赤交角的几何', () => {
  it('回归线与极圈互余：23.5 + 66.5 = 90', () => {
    expect(TROPIC).toBe(OBLIQUITY)
    expect(POLAR_CIRCLE).toBe(90 - OBLIQUITY)
    expect(TROPIC + POLAR_CIRCLE).toBeCloseTo(90, 8)
  })

  it('侧视投影：赤道是直径，纬线段两端都落在球面上', () => {
    const center = { x: 300, y: 200 }
    const r = 100
    const onCircle = circle(center, r)
    const equator = parallelSegment(center, r, 0)
    expect(dist(equator.from, equator.to)).toBeCloseTo(2 * r, 6)
    expect(equator.mid.x).toBeCloseTo(center.x, 6)
    expect(equator.mid.y).toBeCloseTo(center.y, 6)
    for (const lat of [TROPIC, POLAR_CIRCLE, -TROPIC]) {
      const seg = parallelSegment(center, r, lat)
      expect(onCircle(seg.from)).toBe(true)
      expect(onCircle(seg.to)).toBe(true)
    }
  })

  it('直射点：二分日为 0、二至为 ±23.5，且越靠近回归线走得越慢', () => {
    expect(declination(SEASON_DAYS.vernal)).toBeCloseTo(0, 6)
    expect(declination(SEASON_DAYS.summer)).toBeCloseTo(OBLIQUITY, 6)
    expect(declination(SEASON_DAYS.autumnal)).toBeCloseTo(0, 6)
    expect(declination(SEASON_DAYS.winter)).toBeCloseTo(-OBLIQUITY, 6)
    // 赤道附近每天走得多，回归线附近走得少
    const nearEquator = Math.abs(declination(SEASON_DAYS.vernal + 10) - declination(SEASON_DAYS.vernal))
    const nearTropic = Math.abs(declination(SEASON_DAYS.summer) - declination(SEASON_DAYS.summer - 10))
    expect(nearEquator).toBeGreaterThan(nearTropic)
  })
})

describe('§4.2 黄赤交角演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(ObliqueAxisDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('黄赤交角')
    expect(wrapper.text()).toContain('1 / 4')
  })
})

describe('§4.3 光照图四步画法的几何', () => {
  it('直射点在球的左轮廓上（太阳在左边、光线水平）', () => {
    const p = subsolarPoint(VIEW, VIEW.r)
    expect(circle(VIEW, VIEW.r)(p)).toBe(true)
    expect(p.x).toBeCloseTo(VIEW.x - VIEW.r, 6)
    expect(p.y).toBeCloseTo(VIEW.y, 6)
  })

  it('晨昏线过球心且与太阳光线垂直', () => {
    const line = terminatorLine(VIEW, VIEW.r)
    expect(line).toContain(`M ${VIEW.x} ${VIEW.y - VIEW.r}`)
    expect(line).toContain(`L ${VIEW.x} ${VIEW.y + VIEW.r}`)
    // 竖直直线 → 垂直于水平的太阳光线
    expect(line.split(' ')[1]).toBe(String(VIEW.x))
  })

  it('切点纬度与直射点互余：90 − 23.5 = 66.5', () => {
    expect(cutLatitudes(DECL)[0]).toBeCloseTo(66.5, 6)
    expect(cutLatitudes(DECL)[1]).toBeCloseTo(-66.5, 6)
  })

  it('切点纬度按直射点纬度的绝对值算：直射点在南半球时切点仍是 ±66.5°', () => {
    expect(cutLatitudes(23.5)[0]).toBeCloseTo(66.5, 6)
    expect(cutLatitudes(23.5)[1]).toBeCloseTo(-66.5, 6)
    expect(cutLatitudes(-23.5)[0]).toBeCloseTo(66.5, 6)
    expect(cutLatitudes(-23.5)[1]).toBeCloseTo(-66.5, 6)
    expect(cutLatitudes(0)[0]).toBeCloseTo(90, 6)
    expect(cutLatitudes(0)[1]).toBeCloseTo(-90, 6)
  })

  it('极昼极夜归哪一侧随直射点的南北半球互换，赤道上不存在', () => {
    expect(polarDaySide(23.5)).toBe(1)
    expect(polarDaySide(-23.5)).toBe(-1)
    expect(polarDaySide(0)).toBe(0)
  })

  it('切点永远落在晨昏线上，且在切点纬度上南北对称', () => {
    for (const decl of [23.5, 12, 0, -12, -23.5]) {
      const t = tangentPoints(VIEW, VIEW.r, decl, -1)
      const problems = []
      for (const p of [t.north.tangent, t.south.tangent]) {
        if (Math.abs(p.x - VIEW.x) > 1e-6) problems.push(`δ=${decl}：切点没落在晨昏线上`)
      }
      if (t.north.segment.lat !== cutLatitudes(decl)[0]) {
        problems.push(`δ=${decl}：切点纬度不是 90 − |δ|`)
      }
      if (t.north.tangent.y > t.south.tangent.y) problems.push(`δ=${decl}：北切点跑到了南边`)
      expect(problems).toEqual([])
    }
  })

  it('参数轴读数：二至、二分各说各的，其余按数值读', () => {
    expect(declinationReadout(23.5)).toBe('23.5°N · 夏至日')
    expect(declinationReadout(-23.5)).toBe('23.5°S · 冬至日')
    expect(declinationReadout(0)).toBe('0° · 春分/秋分（昼夜等长）')
    expect(declinationReadout(12.5)).toBe('12.5°N')
    expect(declinationReadout(-12.5)).toBe('12.5°S')
  })

  it('切点就是晨昏线的两个端点，且落在极圈上', () => {
    const onCircle = circle(VIEW, VIEW.r)
    for (const lat of cutLatitudes(DECL)) {
      const seg = dnParallelSegment(VIEW, VIEW.r, lat, DECL, -1)
      // 两端都在球面上，且其中一端正落在晨昏线上（x = 球心 x）
      expect(onCircle(seg.from)).toBe(true)
      expect(onCircle(seg.to)).toBe(true)
      const onTerminator = [seg.from, seg.to].filter((p) => Math.abs(p.x - VIEW.x) < 1e-6)
      expect(onTerminator).toHaveLength(1)
    }
  })

  it('极昼范围在北极那一侧，极夜范围在南极那一侧', () => {
    const north = polarCapPath(VIEW, VIEW.r, cutLatitudes(DECL)[0], DECL, -1)
    const south = polarCapPath(VIEW, VIEW.r, cutLatitudes(DECL)[1], DECL, -1)
    // 北极点在昼半球（x < 球心 x）一侧
    const northPole = { x: VIEW.x - VIEW.r * Math.sin((DECL * Math.PI) / 180), y: VIEW.y - VIEW.r * Math.cos((DECL * Math.PI) / 180) }
    expect(northPole.x).toBeLessThan(VIEW.x)
    // 两块都必须是小圆缺（large-arc = 0）——曾经拿错极点的参照，
    // 南极圈那块围成了跨半球的 313° 大弧，把半个球都涂上了
    expect(north).toContain(`A ${VIEW.r} ${VIEW.r} 0 0`)
    expect(south).toContain(`A ${VIEW.r} ${VIEW.r} 0 0`)
  })
})

describe('§4.3 昼夜长短演示', () => {
  it('渲染出四步图解，四步的标题都在', async () => {
    const wrapper = mount(DayNightDrawingDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('找直射点')
    expect(wrapper.text()).toContain('垂线')
    expect(wrapper.text()).toContain('昼半球')
    expect(wrapper.text()).toContain('切点')
  })

  it('第一步时「上一步」是禁用的', () => {
    const wrapper = mount(DayNightDrawingDemo)
    const prev = wrapper.findAll('.demo__controls button').find((b) => b.text() === '上一步')
    expect(prev.attributes('disabled')).toBeDefined()
  })

  it('默认是夏至日：北极那侧极昼、南极那侧极夜', async () => {
    const wrapper = mount(DayNightDrawingDemo)
    await flushPromises()
    const caps = wrapper.findAll('.demo-cap')
    expect(caps).toHaveLength(2)
    expect(caps[0].classes()).toContain('demo-cap--day')
    expect(caps[1].classes()).toContain('demo-cap--night')
  })

  it('参数轴能把直射点拖到南半球：北极那块的明暗跟着互换', async () => {
    const wrapper = mount(DayNightDrawingDemo)
    await flushPromises()
    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(true)

    const problems = []
    await slider.setValue('-23.5')
    await flushPromises()
    const winter = wrapper.findAll('.demo-cap')
    if (winter.length !== 2) problems.push('冬至日没有画出极昼极夜范围')
    if (!winter[0]?.classes().includes('demo-cap--night')) problems.push('冬至日北极那侧不是极夜')
    if (!winter[1]?.classes().includes('demo-cap--day')) problems.push('冬至日南极那侧不是极昼')
    if (!wrapper.text().includes('冬至日')) problems.push('读数没有变成冬至日')

    await slider.setValue('0')
    await flushPromises()
    if (wrapper.findAll('.demo-cap').length !== 0) problems.push('直射点在赤道时不该画极昼极夜范围')
    if (!wrapper.text().includes('昼夜等长')) problems.push('赤道时没有说昼夜等长')

    expect(problems).toEqual([])
  })

  it('解说词跟着参数一起变', async () => {
    const wrapper = mount(DayNightDrawingDemo)
    await flushPromises()
    await wrapper.findAll('.demo__seg')[3].trigger('click')
    await flushPromises()
    const summer = wrapper.find('.demo__text').text()
    expect(summer).toContain('北圈内极昼')

    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('-23.5')
    await flushPromises()
    const winter = wrapper.find('.demo__text').text()
    expect(winter).toContain('北圈内极夜')
    expect(winter).not.toBe(summer)
  })
})

describe('§4.5 太阳视运动的几何', () => {
  it('正午太阳高度角 = 90 − |当地纬度 − 直射点纬度|', () => {
    expect(noonAltitude(40, 23.5)).toBeCloseTo(73.5, 6)
    expect(noonAltitude(23.5, 23.5)).toBeCloseTo(90, 6)
    expect(noonAltitude(40, -23.5)).toBeCloseTo(26.5, 6)
  })

  it('日出方位在东北（40°N 夏至约 58.6°），正午在正南', () => {
    expect(sunriseAzimuth(40, 23.5)).toBeCloseTo(58.6, 1)
    const noon = sunPosition(40, 23.5, 0)
    expect(noon.altitude).toBeCloseTo(73.5, 6)
    expect(noon.azimuth).toBeCloseTo(180, 6)
  })

  it('昼长与时角范围对得上（40°N 夏至约 14.9 小时）', () => {
    const r = hourAngleRange(40, 23.5)
    expect(r.to).toBeCloseTo(111.4, 1)
    expect(dayLengthHours(40, 23.5)).toBeCloseTo(14.85, 1)
  })

  it('正午太阳在正南还是正北：看直射点与当地的纬度关系', () => {
    expect(noonSide(40, 23.5)).toBe('south')
    expect(noonSide(20, 23.5)).toBe('north')
    expect(noonSide(23.5, 23.5)).toBe('overhead')
  })
})

describe('§4.5 太阳视运动演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(SunPathDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('天球')
    expect(wrapper.text()).toContain('1 / 4')
  })
})
