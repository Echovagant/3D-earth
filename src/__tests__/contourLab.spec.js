// @vitest-environment jsdom
/**
 * 等高线判读实验的回归守卫。
 *
 * 这一页最容易出问题的三处，锁住：
 *   ① 山脊与山谷的判据不能写反：弯曲尖端凸向高值是山谷，凸向低值是山脊。
 *      规则一旦记反，页面上每一道弯曲题的答案都会跟着错，所以单独构造
 *      两组等高线直接断言算法的输出。
 *   ② 答案必须由判读算法从图上的几何算出来，而不是抄一份写在数据里；
 *      数据里的答案键和算法结果对不上时，这里会红。
 *   ③ 答错要给出纠正性提示，不能只丢一句「错误」。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import ContourLab from '../components/ContourLab.vue'
import {
  CONTOUR_CASES,
  classifyBend,
  classifyClosedContour,
  cliffRelativeHeightRange,
  expectedValue,
  steepestSegment,
} from '../data/contourLab'

/** 挂载组件：组件本身不依赖网络，案例数据直接喂 props */
const mountLab = async (props = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } }],
  })
  await router.push('/course')
  await router.isReady()
  const wrapper = mount(ContourLab, { props, global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

/** 去掉强调标记，方便和渲染后的文本比对 */
const plain = (text) => String(text ?? '').replace(/\*\*/g, '')

describe('等高线判读实验：数据', () => {
  it('至少 4 个案例，每个案例的等高线不少于 4 条，且都带高程值与坐标', () => {
    expect(CONTOUR_CASES.length).toBeGreaterThanOrEqual(4)

    const broken = CONTOUR_CASES.flatMap((item) => {
      const lines = Array.isArray(item.contours) ? item.contours : []
      if (lines.length < 4) return [`${item.id}: 等高线不足 4 条`]
      return lines.flatMap((line) => {
        const points = Array.isArray(line.points) ? line.points : []
        const ok =
          typeof line.elevation === 'number' &&
          points.length >= 2 &&
          points.every((p) => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number')
        return ok ? [] : [`${item.id}: 等高线缺高程或坐标`]
      })
    })
    expect(broken).toEqual([])
  })

  it('案例覆盖山顶、盆地、山脊、山谷、陡崖与平缓地形', () => {
    const terrains = CONTOUR_CASES.map((item) => item.terrain)
    const required = ['summit', 'basin', 'ridge', 'valley', 'cliff', 'plain']
    expect(required.filter((type) => !terrains.includes(type))).toEqual([])
  })

  it('每个案例都备好了题目、判据文案与答案键', () => {
    const broken = CONTOUR_CASES.flatMap((item) => {
      const missing = []
      if (!item.question) missing.push('question')
      if (!item.explain) missing.push('explain')
      if (!item.answerId) missing.push('answerId')
      if (item.mode === 'option' && !item.options?.length) missing.push('options')
      if (item.mode === 'section' && !item.sections?.length) missing.push('sections')
      return missing.length ? [`${item.id}: 缺 ${missing.join('/')}`] : []
    })
    expect(broken).toEqual([])
  })
})

describe('等高线判读实验：判读规则', () => {
  /**
   * 凸高为谷：弯曲尖端朝北，而北侧等高线数值更高（400 m 在北、100 m 在南），
   * 尖端凸向高值，所以是山谷。
   */
  const convexToHigh = [
    {
      id: 'c400',
      elevation: 400,
      points: [
        [0, 20],
        [28, 20],
        [50, 10],
        [72, 20],
        [100, 20],
      ],
    },
    {
      id: 'c300',
      elevation: 300,
      points: [
        [0, 36],
        [28, 36],
        [50, 26],
        [72, 36],
        [100, 36],
      ],
    },
    {
      id: 'c200',
      elevation: 200,
      points: [
        [0, 52],
        [28, 52],
        [50, 42],
        [72, 52],
        [100, 52],
      ],
    },
    {
      id: 'c100',
      elevation: 100,
      points: [
        [0, 68],
        [28, 68],
        [50, 58],
        [72, 68],
        [100, 68],
      ],
    },
  ]

  /**
   * 凸低为脊：形状与上面几乎一样，只是高程排布反过来（200 m 在北、500 m 在南），
   * 尖端凸向低值，所以是山脊。
   */
  const convexToLow = [
    {
      id: 'c200',
      elevation: 200,
      points: [
        [0, 18],
        [22, 18],
        [50, 8],
        [78, 18],
        [100, 18],
      ],
    },
    {
      id: 'c300',
      elevation: 300,
      points: [
        [0, 32],
        [22, 32],
        [50, 22],
        [78, 32],
        [100, 32],
      ],
    },
    {
      id: 'c400',
      elevation: 400,
      points: [
        [0, 46],
        [22, 46],
        [50, 36],
        [78, 46],
        [100, 46],
      ],
    },
    {
      id: 'c500',
      elevation: 500,
      points: [
        [0, 60],
        [22, 60],
        [50, 50],
        [78, 60],
        [100, 60],
      ],
    },
  ]

  it('弯曲尖端凸向高值时判为山谷（凸高为谷）', () => {
    expect(classifyBend(convexToHigh)).toBe('valley')
  })

  it('弯曲尖端凸向低值时判为山脊（凸低为脊）', () => {
    expect(classifyBend(convexToLow)).toBe('ridge')
  })

  it('案例里的山脊、山谷与算法判定一致', () => {
    const ridge = CONTOUR_CASES.find((item) => item.terrain === 'ridge')
    const valley = CONTOUR_CASES.find((item) => item.terrain === 'valley')
    expect(classifyBend(ridge.contours)).toBe('ridge')
    expect(classifyBend(valley.contours)).toBe('valley')
  })

  it('闭合曲线按内圈与外圈的数值分出山顶与盆地', () => {
    const summit = CONTOUR_CASES.find((item) => item.terrain === 'summit')
    const basin = CONTOUR_CASES.find((item) => item.terrain === 'basin')
    expect(classifyClosedContour(summit.contours)).toBe('summit')
    expect(classifyClosedContour(basin.contours)).toBe('basin')
  })

  it('陡崖按重合的等高线条数算出相对高度范围', () => {
    const cliff = CONTOUR_CASES.find((item) => item.terrain === 'cliff')
    const range = cliffRelativeHeightRange(cliff.contours, cliff.interval)
    expect(range.count).toBe(3)
    expect(range.min).toBe(200)
    expect(range.max).toBe(400)
  })

  it('坡度题里最陡的一段就是等高线间隔最小的那段', () => {
    const slope = CONTOUR_CASES.find((item) => item.task === 'slope')
    const segment = steepestSegment(slope.contours)
    const section = slope.sections.find((s) => s.id === slope.answerId)
    expect([section.between[0], section.between[1]]).toEqual([segment.lowerId, segment.upperId])
  })

  it('每个案例的答案键与判读算法算出的结果一致', () => {
    const mismatched = CONTOUR_CASES.filter((item) => {
      const value = expectedValue(item)
      if (item.mode === 'option') {
        const option = item.options.find((o) => o.id === item.answerId)
        return !option || option.value !== value
      }
      return item.answerId !== value
    })
    expect(mismatched.map((item) => item.id)).toEqual([])
  })
})

describe('等高线判读实验：组件', () => {
  it('挂载后渲染出等高线、题目区与返回课程地图的链接', async () => {
    const wrapper = await mountLab()

    expect(wrapper.classes()).toContain('learn-page')
    expect(wrapper.find('a[href="/course"]').exists()).toBe(true)
    expect(wrapper.find('.contour-lab__question').exists()).toBe(true)
    expect(wrapper.find('.contour-lab__answer-area').exists()).toBe(true)
    expect(wrapper.findAll('path.contour-lab__line').length).toBeGreaterThanOrEqual(4)
    expect(wrapper.findAll('text.contour-lab__value').length).toBeGreaterThanOrEqual(4)
  })

  it('答对时给出判读说明并高亮对应的等高线', async () => {
    const wrapper = await mountLab()
    const item = CONTOUR_CASES[0]
    const index = item.options.findIndex((o) => o.id === item.answerId)

    await wrapper.findAll('.contour-lab__option')[index].trigger('click')

    const feedback = wrapper.find('.contour-lab__feedback')
    expect(feedback.exists()).toBe(true)
    expect(feedback.text()).toContain('判读正确')
    expect(feedback.text()).toContain('内圈')
    expect(wrapper.findAll('path.contour-lab__line.is-answer').length).toBeGreaterThanOrEqual(2)
  })

  it('答错时给出纠正性提示，而不是只说一句错误', async () => {
    const wrapper = await mountLab()
    const item = CONTOUR_CASES[0]
    const index = item.options.findIndex((o) => o.id !== item.answerId)
    const chosen = item.options[index]

    await wrapper.findAll('.contour-lab__option')[index].trigger('click')

    const feedback = wrapper.find('.contour-lab__feedback')
    expect(feedback.text()).toContain('再核对一次')
    expect(feedback.text()).not.toContain('判读正确')
    expect(feedback.text()).toContain(plain(item.wrong[chosen.id]).slice(0, 10))
  })

  it('坡度题点击坡段作答，答对给出疏密判据', async () => {
    const slope = CONTOUR_CASES.find((item) => item.task === 'slope')
    const wrapper = await mountLab({ cases: [slope] })

    const sections = wrapper.findAll('g.contour-lab__section')
    expect(sections).toHaveLength(slope.sections.length)

    const index = slope.sections.findIndex((s) => s.id === slope.answerId)
    await sections[index].trigger('click')

    const feedback = wrapper.find('.contour-lab__feedback')
    expect(feedback.text()).toContain('判读正确')
    expect(feedback.text()).toContain('越密')
  })

  it('点选等高线可以查看它的高程数值', async () => {
    const wrapper = await mountLab()

    await wrapper.findAll('path.contour-lab__line')[0].trigger('click')

    expect(wrapper.findAll('path.contour-lab__line.is-picked')).toHaveLength(1)
    expect(wrapper.find('.contour-lab__picked').text()).toContain('m')
  })

  it('可以切到下一题，进度随之更新', async () => {
    const wrapper = await mountLab()

    expect(wrapper.find('.contour-lab__progress').text()).toContain('第 1 /')

    await wrapper.findAll('.contour-lab__nav button')[1].trigger('click')

    expect(wrapper.find('.contour-lab__progress').text()).toContain('第 2 /')
  })

  it('没有案例数据时给出空态', async () => {
    const wrapper = await mountLab({ cases: [] })

    expect(wrapper.find('.learn-empty').exists()).toBe(true)
    expect(wrapper.find('.learn-empty').text()).toContain('没有可用的等高线案例')
  })

  it('案例数据有问题时显示错误原因', async () => {
    const wrapper = await mountLab({ cases: [{ id: 'broken' }] })

    expect(wrapper.find('.learn-error').exists()).toBe(true)
    expect(wrapper.find('.learn-error').text()).toContain('等高线案例不可用')
  })
})
