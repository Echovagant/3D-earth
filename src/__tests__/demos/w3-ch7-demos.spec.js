// @vitest-environment jsdom
/**
 * §7 大气环流——四个演示动画的契约测试。
 *
 * 守三件事：
 *   ① 演示 id 与组件对得上，步骤能切换；
 *   ② 气压中心的冬夏类型不能反：冬季亚洲是高压、夏季是低压；
 *   ③ 高原季风的风向不能反：风向指来向，箭头指去处。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import {
  BELT_ORDER,
  SUMMER_CENTERS,
  WINTER_CENTERS,
  polarProjection,
} from '../../data/pressureCentersGeometry'
import {
  MONSOON_ALIGNMENT,
  arrowAngle,
  windNameFromToward,
} from '../../data/tibetanPlateauGeometry'
import ChapterSevenPlanDemo from '../../components/demos/ChapterSevenPlanDemo.vue'
import PressureCentersDemo from '../../components/demos/PressureCentersDemo.vue'
import TibetanPlateauDemo from '../../components/demos/TibetanPlateauDemo.vue'
import AnswerFrameDemo from '../../components/demos/AnswerFrameDemo.vue'

describe('§7.12 气压中心的几何', () => {
  it('冬季：亚洲是高压，阿留申与冰岛是低压', () => {
    const byKey = Object.fromEntries(WINTER_CENTERS.map((c) => [c.key, c]))
    expect(byKey['asia-high'].kind).toBe('high')
    expect(byKey['alaska-low'].kind).toBe('low')
    expect(byKey['iceland-low'].kind).toBe('low')
    expect(byKey['asia-high'].name).toContain('蒙古—西伯利亚')
  })

  it('夏季：亚洲是低压（印度低压），夏威夷与亚速尔是高压', () => {
    const byKey = Object.fromEntries(SUMMER_CENTERS.map((c) => [c.key, c]))
    expect(byKey['india-low'].kind).toBe('low')
    expect(byKey['india-low'].name).toContain('印度低压')
    expect(byKey['hawaii-high'].kind).toBe('high')
    expect(byKey['azores-high'].kind).toBe('high')
  })

  it('同一位置冬夏类型相反：亚洲高压 ↔ 亚洲低压', () => {
    const winterAsia = WINTER_CENTERS.find((c) => c.key === 'asia-high')
    const summerAsia = SUMMER_CENTERS.find((c) => c.key === 'india-low')
    expect(winterAsia.kind).not.toBe(summerAsia.kind)
    expect(Math.abs(winterAsia.lon - summerAsia.lon)).toBeLessThan(30)
  })

  it('极地俯视图：0° 经线朝下，90°E 在右，90°W 在左', () => {
    // 北极上空看地球自转是逆时针，经度向东增大；0° 在正下方，
    // 从正下方逆时针数，下一个到的就是右边的 90°E。
    // §2.4 的极点俯视图用的是同一套约定——两处不能画成相反的。
    const p = polarProjection(200, 190, 100)
    const zero = p(0, 0)
    const east = p(0, 90)
    const west = p(0, 270)
    expect(zero.x).toBeCloseTo(200, 6)
    expect(zero.y).toBeGreaterThan(190)
    expect(east.x).toBeGreaterThan(200)
    expect(west.x).toBeLessThan(200)
  })

  it('气压带自北向南：极地高 → 副极地低 → 副热带高 → 赤道低', () => {
    expect(BELT_ORDER).toEqual([
      '极地高气压带',
      '副极地低气压带',
      '副热带高气压带',
      '赤道低气压带',
    ])
  })
})

describe('§7.16 高原季风的几何', () => {
  it('风向指来向：箭头指去处，名字说反方向', () => {
    expect(windNameFromToward('nw')).toBe('东南风')
    expect(windNameFromToward('ne')).toBe('西南风')
    expect(windNameFromToward('se')).toBe('西北风')
    expect(windNameFromToward('sw')).toBe('东北风')
  })

  it('箭头角度：西北 = 135°、东北 = 45°、东南 = −45°、西南 = −135°', () => {
    expect(arrowAngle('nw')).toBeCloseTo(135, 6)
    expect(arrowAngle('ne')).toBeCloseTo(45, 6)
    expect(arrowAngle('se')).toBeCloseTo(-45, 6)
    expect(arrowAngle('sw')).toBeCloseTo(-135, 6)
  })

  it('夏季同向叠加的是东南风与西南风，冬季是西北风与东北风', () => {
    const summer = MONSOON_ALIGNMENT.summer.filter((m) => m.reinforce).map((m) => m.name)
    const winter = MONSOON_ALIGNMENT.winter.filter((m) => m.reinforce).map((m) => m.name)
    expect(summer).toEqual(['东南风', '西南风'])
    expect(winter).toEqual(['西北风', '东北风'])
  })

  it('高原季风是叠加在季风之上的，四季都指向高原辐散', () => {
    for (const season of ['summer', 'winter']) {
      expect(MONSOON_ALIGNMENT[season]).toHaveLength(4)
    }
  })
})

describe('§7 的四个演示', () => {
  it('§7.1 三节课的分工：三步，分 P 与覆盖节次都在', async () => {
    const wrapper = mount(ChapterSevenPlanDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(3)
    expect(wrapper.text()).toContain('p030')
    expect(wrapper.text()).toContain('p031')
    expect(wrapper.text()).toContain('p032')
    expect(wrapper.text()).toContain('1 / 3')
  })

  it('§7.12 高低压中心：四步，冬夏两季的气压中心都在', async () => {
    const wrapper = mount(PressureCentersDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('蒙古—西伯利亚高压')
    expect(wrapper.text()).toContain('印度低压')
    expect(wrapper.text()).toContain('夏威夷高压')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('§7.16 高原季风：四步，冬夏风向都在', async () => {
    const wrapper = mount(TibetanPlateauDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('东南风')
    expect(wrapper.text()).toContain('西北风')
    expect(wrapper.text()).toContain('加强')
  })

  it('§7.19 答题框架：四步，三层结构与常见错误都在', async () => {
    const wrapper = mount(AnswerFrameDemo)
    await flushPromises()
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('主题句')
    expect(wrapper.text()).toContain('分析')
    expect(wrapper.text()).toContain('结论')
    expect(wrapper.text()).toContain('风输送水汽')
  })

  it('每个演示点「下一步」都能往后走', async () => {
    for (const Comp of [
      ChapterSevenPlanDemo,
      PressureCentersDemo,
      TibetanPlateauDemo,
      AnswerFrameDemo,
    ]) {
      const wrapper = mount(Comp)
      await flushPromises()
      const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
      await next.trigger('click')
      expect(wrapper.text()).toContain('2 /')
    }
  })
})
