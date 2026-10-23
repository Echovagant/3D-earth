// @vitest-environment jsdom
/**
 * 洋流判读实验的回归守卫。
 *
 * 这一页最容易错的不是画图，而是下面几条判据事实：
 *   ① 寒暖必须与走线方向自洽：暖流总体向高纬、寒流总体向低纬。
 *      但赤道逆流、西风漂流、地中海密度流这类东西向流要按各自的规则核对，
 *      不能一律套「低纬→高纬」——否则会把正确的实现判成错的。
 *   ② 北印度洋季风洋流「夏顺冬逆」：索马里半岛沿岸冬季是暖流、夏季是寒流，
 *      且不服从「8—0」模式。这是最常错的一条。
 *   ③ 上升补偿流一般是寒流（上来的是底层冷水）；向岸风处没有上升补偿流。
 *   ④ 「8—0」：北半球中高纬是「8」字、连接处在北纬 40° 附近；
 *      南半球中低纬是逆时针「0」字、没有副极地环流圈；赤道有赤道逆流。
 *   ⑤ 判读三步法：判半球 → 判流向（与等温线凸出一致）→ 判性质，第二步第三步不能混。
 *   ⑥ 马达加斯加岛东侧迎风坡是热带雨林、西侧背风坡是热带草原。
 *
 * 断言写成「先收集问题、再一次性比对」的形式：
 * vitest/no-conditional-expect 不允许把 expect 写在 if 里，
 * 而逐条断言又看不出是「哪一条」坏了。
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import OceanCurrentLab from '../components/OceanCurrentLab.vue'
import {
  CAUSE_LABELS,
  GYRE_ANCHORS,
  GYRE_FILTERS,
  HEAT_LABELS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MONSOON_CURRENT,
  NATURE_LABELS,
  OCEAN_CURRENTS,
  OCEAN_CURRENT_QUESTIONS,
  PITFALLS,
  READING_STEPS,
  SEASONS,
  VIEW_MODES,
  buildCoastPaths,
  currentLabelAt,
  deriveNature,
  project,
} from '../data/oceanCurrentLab'

/** 去掉强调标记，方便和渲染后的文本比对 */
const plain = (text) => String(text ?? '').replace(/\*\*/g, '')

/** 首尾点的绝对纬度差：正值=更靠近极点，负值=更靠近赤道 */
const polewardDelta = (current) => {
  const path = current?.path ?? []
  const first = path[0]?.[1] ?? 0
  const last = path[path.length - 1]?.[1] ?? 0
  return Math.abs(last) - Math.abs(first)
}

/** 首尾点的经度差：正值=向东，负值=向西 */
const eastwardDelta = (current) => {
  const path = current?.path ?? []
  return (path[path.length - 1]?.[0] ?? 0) - (path[0]?.[0] ?? 0)
}

const findCurrent = (id) => OCEAN_CURRENTS.find((item) => item.id === id)

/** 判据关键词：反馈文案里出现这些词，才算真的讲了判据，而不是只丢一句「错误」 */
const CRITERION_WORDS = [
  '等温线',
  '水温',
  '流向',
  '半球',
  '寒流',
  '暖流',
  '补偿流',
  '离岸风',
  '向岸风',
  '密度',
  '西风漂流',
  '季风',
  '副极地',
]

/** 反馈文案里命中的判据关键词 */
const criterionHits = (text) => CRITERION_WORDS.filter((word) => text.includes(word))

/**
 * 测试用底图：一个最小的 FeatureCollection。
 * 组件的底图走 props 传入，测试全程不碰网络。
 */
const FIXTURE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '测试大陆', iso3: 'TST' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-10, 0],
            [10, 0],
            [10, 10],
            [-10, 10],
            [-10, 0],
          ],
        ],
      },
    },
  ],
}

/** 挂载组件：底图与数据都走 props，不发网络请求 */
const mountLab = async (props = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } }],
  })
  await router.push('/course')
  await router.isReady()
  const wrapper = mount(OceanCurrentLab, {
    props: { geojson: FIXTURE_GEOJSON, ...props },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

/** 视图模式按钮 */
const viewButtons = (wrapper) => wrapper.findAll('[aria-label="环流模式"] button')
/** 季节按钮 */
const seasonButtons = (wrapper) => wrapper.findAll('[aria-label="季节"] button')
/** 找到某条洋流画出来的那条 path（路径串按空白归一，避免被分隔符写法影响） */
const normalizePath = (d) => String(d ?? '').trim().replace(/\s+/g, ' ')
const flowOf = (wrapper, current) => {
  const target = normalizePath(
    current.path
      .map((point, index) => {
        const [x, y] = project(point)
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' '),
  )
  return wrapper
    .findAll('path.ocean-lab__flow')
    .find((node) => normalizePath(node.attributes('d')) === target)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('洋流判读实验：数据契约', () => {
  it('暖流与寒流各有若干条，且每条都带齐判读需要的字段', () => {
    const warm = OCEAN_CURRENTS.filter((item) => item.nature === 'warm')
    const cold = OCEAN_CURRENTS.filter((item) => item.nature === 'cold')

    expect(warm.length).toBeGreaterThanOrEqual(10)
    expect(cold.length).toBeGreaterThanOrEqual(8)

    const broken = OCEAN_CURRENTS.flatMap((item) => {
      const missing = []
      if (!item.id) missing.push('id')
      if (!item.name) missing.push('name')
      if (!NATURE_LABELS[item.nature]) missing.push('nature')
      if (!CAUSE_LABELS[item.cause]) missing.push('cause')
      if (!HEAT_LABELS[item.heat]) missing.push('heat')
      if (!item.region) missing.push('region')
      if (!item.key) missing.push('key')
      if (!item.impact) missing.push('impact')
      if (!Array.isArray(item.path) || item.path.length < 2) missing.push('path')
      return missing.length ? [`${item.id}: 缺 ${missing.join('/')}`] : []
    })
    expect(broken).toEqual([])
  })

  it('每条洋流的寒暖与 heat/water 推出的结论一致（谁把字段写反了这里会红）', () => {
    const mismatched = OCEAN_CURRENTS.filter((item) => deriveNature(item) !== item.nature)
    expect(mismatched.map((item) => item.id)).toEqual([])
  })

  it('deriveNature 的规则本身正确：向高纬=暖、向低纬=寒、垂直上升=寒', () => {
    expect(deriveNature({ heat: 'poleward', water: 'high' })).toBe('warm')
    expect(deriveNature({ heat: 'equatorward', water: 'low' })).toBe('cold')
    expect(deriveNature({ heat: 'vertical', water: 'low' })).toBe('cold')
    expect(deriveNature({ heat: 'zonal', water: 'high' })).toBe('warm')
    expect(deriveNature({ heat: 'zonal', water: 'low' })).toBe('cold')
  })

  it('暖流总体向高纬、寒流总体向低纬：走线首尾点的纬度差与性质自洽', () => {
    // poleward 必须更靠近极点，equatorward 必须更靠近赤道。
    // zonal（东西向）与 vertical（垂直上升）不按高纬低纬核对，另有一组断言。
    const problems = []
    for (const current of OCEAN_CURRENTS) {
      const delta = polewardDelta(current)
      if (current.heat === 'poleward' && delta <= 0) {
        problems.push(`${current.id}: 暖流却更靠近赤道（Δ纬度 ${delta}）`)
      }
      if (current.heat === 'equatorward' && delta >= 0) {
        problems.push(`${current.id}: 寒流却更靠近极点（Δ纬度 ${delta}）`)
      }
    }
    expect(problems).toEqual([])
  })

  it('寒暖与首尾点纬度方向对不上时，箭头本身也会画反', () => {
    // 反过来锁一次：性质与走线方向必须同时成立，不能只对一半。
    const mismatched = OCEAN_CURRENTS.filter((current) => {
      const delta = polewardDelta(current)
      if (current.heat === 'poleward') return delta <= 0
      if (current.heat === 'equatorward') return delta >= 0
      return false
    })
    expect(mismatched.map((item) => `${item.id}(${item.nature}/${item.heat})`)).toEqual([])
  })

  it('东西向流按东西向核对，不套「低纬→高纬」', () => {
    const zonal = OCEAN_CURRENTS.filter((item) => item.heat === 'zonal')
    expect(zonal.length).toBeGreaterThanOrEqual(4)

    const problems = []
    for (const current of zonal) {
      const lon = Math.abs(eastwardDelta(current))
      const lat = Math.abs(polewardDelta(current))
      if (lon <= lat * 2) problems.push(`${current.id}: 走向不像东西向（经差 ${lon} / 纬差 ${lat}）`)
    }
    expect(problems).toEqual([])
  })

  it('西风漂流是寒流，自西向东绕地球', () => {
    const drift = findCurrent('west-wind-drift')
    expect(drift.nature).toBe('cold')
    expect(drift.cause).toBe('wind')
    expect(eastwardDelta(drift)).toBeGreaterThan(0)
    expect(polewardDelta(drift)).toBeLessThan(0)
  })

  it('赤道逆流自西向东，与南北赤道暖流方向相反', () => {
    const counter = findCurrent('equatorial-counter')
    const north = findCurrent('north-equatorial-pacific')
    const south = findCurrent('south-equatorial-pacific')

    expect(counter.nature).toBe('warm')
    expect(eastwardDelta(counter)).toBeGreaterThan(0)
    expect(eastwardDelta(north)).toBeLessThan(0)
    expect(eastwardDelta(south)).toBeLessThan(0)
    // 文案里的方向必须和箭头一致：不能写「自东向西」而箭头朝东
    expect(counter.key).toContain('自西向东')
    expect(counter.key).not.toContain('自东向西')
    expect(counter.region).toContain('自西向东')
  })

  it('上升补偿流标注为寒流（上来的是底层冷水）', () => {
    const upwellings = OCEAN_CURRENTS.filter((item) => item.cause === 'compensation')
    expect(upwellings.length).toBeGreaterThanOrEqual(1)

    const wrong = upwellings.filter((item) => item.nature !== 'cold')
    expect(wrong.map((item) => item.id)).toEqual([])

    const peru = findCurrent('peru-upwelling')
    expect(peru.heat).toBe('vertical')
    expect(deriveNature(peru)).toBe('cold')
  })

  it('北印度洋季风洋流：夏季寒流、冬季暖流（最常错的一条）', () => {
    const summer = MONSOON_CURRENT.seasons.summer
    const winter = MONSOON_CURRENT.seasons.winter

    expect(summer.nature).toBe('cold')
    expect(deriveNature(summer)).toBe('cold')
    expect(winter.nature).toBe('warm')
    expect(deriveNature(winter)).toBe('warm')

    // 夏季靠上升补偿（离岸风），冬季靠向岸风推上来的表层暖水
    expect(summer.heat).toBe('vertical')
    expect(summer.cause).toBe('compensation')
    expect(winter.heat).toBe('zonal')
    expect(winter.water).toBe('high')
  })

  it('季风洋流的季节与 SEASONS 一一对应，且不套进「8—0」模式', () => {
    const seasonIds = SEASONS.map((item) => item.id)
    expect(seasonIds).toEqual(Object.keys(MONSOON_CURRENT.seasons))
    expect(MONSOON_CURRENT.gyre).toBe('monsoon')
    expect(GYRE_FILTERS.north).not.toContain('monsoon')
    expect(GYRE_FILTERS.south).not.toContain('monsoon')
  })

  it('索马里半岛夏季沿岸离岸风、冬季向岸风，且文案写明「没有上升补偿流」', () => {
    const summer = MONSOON_CURRENT.seasons.summer
    const winter = MONSOON_CURRENT.seasons.winter

    expect(summer.detail).toContain('离岸风')
    expect(summer.detail).toContain('寒流')
    expect(winter.detail).toContain('向岸风')
    expect(winter.detail).toContain('暖流')
    expect(winter.detail).toContain('没有上升补偿流')
  })

  it('马达加斯加岛：东侧迎风坡是热带雨林，西侧背风坡是热带草原', () => {
    const mozambique = findCurrent('mozambique-current')
    expect(mozambique.impact).toContain('迎风坡')
    expect(mozambique.impact).toContain('热带雨林')
    expect(mozambique.impact).toContain('背风')
    expect(mozambique.impact).toContain('热带草原')

    const question = OCEAN_CURRENT_QUESTIONS.find((item) => item.id === 'madagascar')
    expect(question.answerId).toBe('rainforest')
    expect(question.options.map((option) => option.id)).toContain('savanna')
  })

  it('箭头路径的首尾点方向正确：暖流箭头指向高纬、寒流箭头指向低纬', () => {
    // 用首尾两点再算一次纬度差，确保「性质」和「箭头朝向」指向同一个方向
    const wrong = OCEAN_CURRENTS.filter((current) => {
      const first = current.path[0][1]
      const last = current.path[current.path.length - 1][1]
      const towardPole = Math.abs(last) > Math.abs(first)
      if (current.nature === 'warm' && current.heat === 'poleward') return !towardPole
      if (current.nature === 'cold' && current.heat === 'equatorward') return towardPole
      return false
    })
    expect(wrong.map((item) => item.id)).toEqual([])
  })

  it('判读三步法：判半球 → 判流向 → 判性质，第二步第三步没有混', () => {
    expect(READING_STEPS.map((step) => step.no)).toEqual([1, 2, 3])
    expect(READING_STEPS.map((step) => step.title)).toEqual(['判半球', '判流向', '判性质'])

    const [hemisphere, direction, nature] = READING_STEPS
    expect(hemisphere.text).toContain('北半球向北递减')
    expect(hemisphere.text).toContain('南半球向南递减')
    expect(direction.text).toContain('等温线凸出')
    expect(direction.text).toContain('不定性质')
    expect(nature.text).toContain('水温高处')
    expect(nature.text).toContain('水温低处')
  })

  it('易错提示覆盖：寒暖是相对概念、上升补偿流、向岸风、季风、南半球无副极地环流圈', () => {
    const text = PITFALLS.map((item) => `${item.title}${item.text}`).join('\n')
    const required = [
      '寒暖是相对概念',
      '流经海域',
      '上升补偿流一般是寒流',
      '底层冷水',
      '向岸风',
      '夏顺冬逆',
      '冬季暖流',
      '夏季寒流',
      '副极地环流圈',
    ]
    expect(required.filter((word) => !text.includes(word))).toEqual([])
  })

  it('练习题答案键都在选项里，且每个错选都有针对性的纠正性提示', () => {
    expect(OCEAN_CURRENT_QUESTIONS.length).toBeGreaterThanOrEqual(8)

    const problems = []
    for (const question of OCEAN_CURRENT_QUESTIONS) {
      const ids = question.options.map((option) => option.id)
      if (!ids.includes(question.answerId)) problems.push(`${question.id}: answerId 不在选项里`)
      if (!question.explain) problems.push(`${question.id}: 缺 explain`)
      for (const option of question.options) {
        if (option.id === question.answerId) continue
        if (!question.wrong?.[option.id] && !question.wrongDefault) {
          problems.push(`${question.id}: 错选 ${option.id} 没有纠正性提示`)
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('判读练习覆盖寒暖、成因、模式、认洋流与季节反转', () => {
    const kinds = OCEAN_CURRENT_QUESTIONS.map((question) => question.kind)
    expect(kinds).toContain('nature')
    expect(kinds).toContain('cause')
    expect(kinds).toContain('identify')

    const ids = OCEAN_CURRENT_QUESTIONS.map((question) => question.id)
    expect(ids).toContain('monsoon-summer')
    expect(ids).toContain('monsoon-winter')
    expect(ids).toContain('upwelling-cold')
    expect(ids).toContain('gyre-junction')
    expect(ids).toContain('gyre-south')
  })

  it('季节反转两题的答案分别锁定「夏寒冬暖」', () => {
    const summer = OCEAN_CURRENT_QUESTIONS.find((item) => item.id === 'monsoon-summer')
    const winter = OCEAN_CURRENT_QUESTIONS.find((item) => item.id === 'monsoon-winter')
    expect(summer.answerId).toBe('cold')
    expect(winter.answerId).toBe('warm')
    expect(summer.explain).toContain('离岸风')
    expect(winter.explain).toContain('向岸')
    expect(winter.explain).toContain('夏寒冬暖')
  })

  it('「8」字连接处与南半球「0」字的事实被写进题目与判据', () => {
    const junction = OCEAN_CURRENT_QUESTIONS.find((item) => item.id === 'gyre-junction')
    expect(junction.answerId).toBe('forty')
    expect(junction.explain).toContain('北纬 40° 附近')

    const south = OCEAN_CURRENT_QUESTIONS.find((item) => item.id === 'gyre-south')
    expect(south.answerId).toBe('zero-counterclockwise')
    expect(south.explain).toContain('逆时针')
    expect(south.explain).toContain('没有副极地环流圈')
  })

  it('数据里没有成段讲义正文（逐行不超过 220 字符，与知识数据的硬闸门同尺度）', () => {
    const lines = []
    const walk = (value, trail) => {
      if (typeof value === 'string') {
        lines.push(...String(value).split('\n').map((line) => ({ trail, line })))
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, `${trail}[${index}]`))
      } else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) walk(item, `${trail}.${key}`)
      }
    }
    walk(OCEAN_CURRENTS, 'OCEAN_CURRENTS')
    walk(MONSOON_CURRENT, 'MONSOON_CURRENT')
    walk(OCEAN_CURRENT_QUESTIONS, 'QUESTIONS')
    walk(PITFALLS, 'PITFALLS')
    walk(READING_STEPS, 'READING_STEPS')

    const tooLong = lines.filter((item) => item.line.length > 220).map((item) => item.trail)
    expect(tooLong).toEqual([])
  })
})

describe('洋流判读实验：「8—0」模式', () => {
  it('视图模式与过滤表一一对应', () => {
    expect(VIEW_MODES.map((mode) => mode.id)).toEqual(['all', 'north', 'south'])
    expect(Object.keys(GYRE_FILTERS).sort()).toEqual(['all', 'north', 'south'])
  })

  it('北半球视图说明里写明「8」字与北纬 40° 附近的连接处', () => {
    const north = VIEW_MODES.find((mode) => mode.id === 'north')
    expect(north.label).toContain('8')
    expect(north.note).toContain('北纬 40° 附近')
    expect(north.note).toContain('西风漂流')
  })

  it('南半球视图说明里写明逆时针「0」字与没有副极地环流圈', () => {
    const south = VIEW_MODES.find((mode) => mode.id === 'south')
    expect(south.label).toContain('0')
    expect(south.note).toContain('逆时针')
    expect(south.note).toContain('没有副极地环流圈')
  })

  it('模式标注点：连接处在北纬 40° 附近，赤道逆流与西风漂流各就各位', () => {
    const junction = GYRE_ANCHORS.find((anchor) => anchor.id === 'gyre-eight-junction')
    expect(junction.lat).toBeGreaterThanOrEqual(35)
    expect(junction.lat).toBeLessThanOrEqual(45)
    expect(junction.modes).toContain('north')
    expect(junction.modes).not.toContain('south')

    const counter = GYRE_ANCHORS.find((anchor) => anchor.id === 'equatorial-counter')
    expect(counter.lat).toBeGreaterThan(0)
    expect(counter.lat).toBeLessThan(15)
    expect(counter.modes).toContain('all')

    const drift = GYRE_ANCHORS.find((anchor) => anchor.id === 'west-wind-drift')
    expect(drift.lat).toBeLessThan(-30)
    expect(drift.modes).toContain('south')
    expect(drift.modes).not.toContain('north')
  })

  it('北半球视图含副极地环流成员，南半球视图不含（南半球没有副极地环流圈）', () => {
    const subpolarNorth = ['oyashio-current', 'east-greenland-current']
    const problems = subpolarNorth.filter(
      (id) => !GYRE_FILTERS.north.includes('north') || findCurrent(id).gyre !== 'north',
    )
    expect(problems).toEqual([])
    // 南半球的「0」字里不能混进北半球的副极地环流成员
    const northMembers = OCEAN_CURRENTS.filter((item) => item.gyre === 'north').map((item) => item.id)
    expect(GYRE_FILTERS.south.filter((id) => northMembers.includes(id))).toEqual([])
  })

  it('西风漂流只在南半球视图与全图视图出现', () => {
    expect(GYRE_FILTERS.south).toContain('south')
    expect(GYRE_FILTERS.north).not.toContain('south')
    expect(findCurrent('west-wind-drift').gyre).toBe('south')
  })
})

describe('洋流判读实验：工具函数', () => {
  it('project 是北在上：纬度越高画得越靠上', () => {
    expect(project([0, 40])[1]).toBeLessThan(project([0, 0])[1])
    expect(project([0, -40])[1]).toBeGreaterThan(project([0, 0])[1])
    expect(project([0, 0])[1]).toBeCloseTo(MAP_HEIGHT / 2, 6)
    expect(project([-180, 0])[0]).toBeCloseTo(0, 6)
    expect(project([180, 0])[0]).toBeCloseTo(MAP_WIDTH, 6)
  })

  it('buildCoastPaths 能把真实的世界国界转成轮廓路径', () => {
    const geojson = JSON.parse(readFileSync('public/geojson/world-countries.json', 'utf8'))
    const paths = buildCoastPaths(geojson)

    expect(paths.length).toBe(geojson.features.length)
    const broken = paths.filter((item) => !item.d.startsWith('M') || !item.d.endsWith('Z'))
    expect(broken).toEqual([])
  })

  it('buildCoastPaths 对空数据与坏数据不炸', () => {
    expect(buildCoastPaths(null)).toEqual([])
    expect(buildCoastPaths({ features: [] })).toEqual([])
    expect(buildCoastPaths({ features: [{ geometry: { type: 'Polygon', coordinates: [] } }] })).toEqual([])
  })

  it('currentLabelAt 优先用 labelAt，没有就取走线中点', () => {
    const withLabel = findCurrent('kuroshio')
    expect(currentLabelAt(withLabel)).toEqual(project(withLabel.labelAt))

    const withoutLabel = { path: [[0, 0], [10, 10], [20, 20]] }
    expect(currentLabelAt(withoutLabel)).toEqual(project([10, 10]))
  })
})

describe('洋流判读实验：组件', () => {
  it('挂载后渲染出底图、洋流箭头、练习区与返回课程地图的链接', async () => {
    const wrapper = await mountLab()

    expect(wrapper.classes()).toContain('learn-page')
    expect(wrapper.find('a[href="/course"]').exists()).toBe(true)
    expect(wrapper.find('svg.ocean-lab__map').exists()).toBe(true)
    // 底图：props 传入的 GeoJSON 转成一条轮廓
    expect(wrapper.findAll('path.ocean-lab__coast')).toHaveLength(1)
    // 洋流：24 条常规洋流 + 1 条季风洋流
    expect(wrapper.findAll('g.ocean-lab__current')).toHaveLength(OCEAN_CURRENTS.length + 1)
    expect(wrapper.find('.ocean-lab__quiz').exists()).toBe(true)
  })

  it('箭头的指向就是洋流流向：path 从首点画到末点，箭头标在末点', async () => {
    const wrapper = await mountLab()
    const gulf = findCurrent('gulf-stream')

    const flow = flowOf(wrapper, gulf)
    expect(flow.exists()).toBe(true)
    expect(flow.attributes('marker-end')).toBe('url(#ocean-arrow-warm)')

    const coords = [...flow.attributes('d').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ])
    const first = project(gulf.path[0])
    const last = project(gulf.path[gulf.path.length - 1])
    expect(coords[0][0]).toBeCloseTo(first[0], 1)
    expect(coords[0][1]).toBeCloseTo(first[1], 1)
    expect(coords[coords.length - 1][0]).toBeCloseTo(last[0], 1)
    expect(coords[coords.length - 1][1]).toBeCloseTo(last[1], 1)
    // 箭头末点在北侧，暖流指向高纬
    expect(coords[coords.length - 1][1]).toBeLessThan(coords[0][1])
  })

  it('寒流用冷色箭头，且箭头末点指向低纬', async () => {
    const wrapper = await mountLab()
    const california = findCurrent('california-current')

    const flow = flowOf(wrapper, california)
    expect(flow.attributes('marker-end')).toBe('url(#ocean-arrow-cold)')

    const coords = [...flow.attributes('d').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ])
    // 投影是北在上：纬度降低时 y 变大
    expect(coords[coords.length - 1][1]).toBeGreaterThan(coords[0][1])
  })

  it('点选箭头会显示该洋流的寒暖、成因与影响', async () => {
    const wrapper = await mountLab()
    const target = findCurrent('california-current')

    const index = OCEAN_CURRENTS.findIndex((item) => item.id === target.id)
    await wrapper.findAll('g.ocean-lab__current')[index].trigger('click')

    const detail = wrapper.find('.ocean-lab__detail')
    expect(detail.text()).toContain(target.name)
    expect(detail.text()).toContain('寒流')
    expect(detail.text()).toContain('风海流')
    expect(detail.text()).toContain(plain(target.impact).slice(0, 12))
    expect(wrapper.findAll('g.ocean-lab__current.is-picked')).toHaveLength(1)
  })

  it('洋流一览按性质分组，暖流与寒流分列', async () => {
    const wrapper = await mountLab()

    const warm = wrapper.findAll('.ocean-lab__chip.is-warm')
    const cold = wrapper.findAll('.ocean-lab__chip.is-cold')
    expect(warm).toHaveLength(OCEAN_CURRENTS.filter((item) => item.nature === 'warm').length)
    expect(cold).toHaveLength(OCEAN_CURRENTS.filter((item) => item.nature === 'cold').length)
  })

  it('切到北半球视图后，南半球的洋流不再画在图上', async () => {
    const wrapper = await mountLab()

    const northButton = viewButtons(wrapper).find((node) => node.text().includes('北半球'))
    await northButton.trigger('click')

    // 北半球视图只留北半球环流 + 赤道逆流；季风洋流不套「8—0」模式，不画
    expect(wrapper.findAll('g.ocean-lab__current')).toHaveLength(
      OCEAN_CURRENTS.filter((item) => GYRE_FILTERS.north.includes(item.gyre)).length,
    )
    expect(wrapper.text()).toContain('北纬 40° 附近')
    const drift = flowOf(wrapper, findCurrent('west-wind-drift'))
    expect(drift).toBeUndefined()
    const monsoon = flowOf(wrapper, MONSOON_CURRENT.seasons.summer)
    expect(monsoon).toBeUndefined()
  })

  it('切到南半球视图后，能看到西风漂流，但看不到北半球副极地环流成员', async () => {
    const wrapper = await mountLab()

    const southButton = viewButtons(wrapper).find((node) => node.text().includes('南半球'))
    await southButton.trigger('click')

    expect(flowOf(wrapper, findCurrent('west-wind-drift'))).toBeDefined()
    expect(flowOf(wrapper, findCurrent('oyashio-current'))).toBeUndefined()
    expect(flowOf(wrapper, findCurrent('east-greenland-current'))).toBeUndefined()
    expect(wrapper.text()).toContain('没有副极地环流圈')
  })

  it('北印度洋季节切换：夏季是寒流、冬季是暖流，索马里半岛方向同时改变', async () => {
    const wrapper = await mountLab()

    // 默认夏季
    const notes = wrapper.findAll('.ocean-lab__note')
    expect(notes[1].text()).toContain('夏季')
    expect(notes[1].text()).toContain('寒流')

    const winterButton = seasonButtons(wrapper).find((node) => node.text() === '冬季')
    await winterButton.trigger('click')

    const after = wrapper.findAll('.ocean-lab__note')
    expect(after[1].text()).toContain('冬季')
    expect(after[1].text()).toContain('暖流')
  })

  it('季风洋流按季节换箭头：夏季寒流箭头指北、冬季暖流箭头指南', async () => {
    const wrapper = await mountLab()

    const summer = MONSOON_CURRENT.seasons.summer
    const summerFlow = flowOf(wrapper, summer)
    expect(summerFlow).toBeDefined()
    expect(summerFlow.attributes('marker-end')).toBe('url(#ocean-arrow-cold)')
    const summerCoords = [...summerFlow.attributes('d').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(
      (match) => [Number(match[1]), Number(match[2])]
    )
    // 夏季沿岸北上：末点纬度更高，投影后 y 更小
    expect(summerCoords[summerCoords.length - 1][1]).toBeLessThan(summerCoords[0][1])

    const winterButton = seasonButtons(wrapper).find((node) => node.text() === '冬季')
    await winterButton.trigger('click')

    const winter = MONSOON_CURRENT.seasons.winter
    const winterFlow = flowOf(wrapper, winter)
    expect(winterFlow).toBeDefined()
    expect(winterFlow.attributes('marker-end')).toBe('url(#ocean-arrow-warm)')
    const winterCoords = [...winterFlow.attributes('d').matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(
      (match) => [Number(match[1]), Number(match[2])]
    )
    // 冬季沿岸南下：末点纬度更低，投影后 y 更大
    expect(winterCoords[winterCoords.length - 1][1]).toBeGreaterThan(winterCoords[0][1])
  })

  it('答对时给出判读说明，说明里出现判据词', async () => {
    const question = OCEAN_CURRENT_QUESTIONS[0]
    const wrapper = await mountLab({ questions: [question] })

    const index = question.options.findIndex((option) => option.id === question.answerId)
    await wrapper.findAll('.ocean-lab__option')[index].trigger('click')

    const feedback = wrapper.find('.ocean-lab__feedback')
    expect(feedback.exists()).toBe(true)
    expect(feedback.classes()).toContain('is-right')
    expect(feedback.text()).toContain('判读正确')
    expect(feedback.text()).toContain(plain(question.explain))
    expect(criterionHits(feedback.text())).toContain('等温线')
    expect(criterionHits(feedback.text()).length).toBeGreaterThanOrEqual(2)
  })

  it('答错时给出针对该选项的纠正性提示，而不是只说一句错误', async () => {
    const question = OCEAN_CURRENT_QUESTIONS[0]
    const wrapper = await mountLab({ questions: [question] })

    const index = question.options.findIndex((option) => option.id !== question.answerId)
    const chosen = question.options[index]
    await wrapper.findAll('.ocean-lab__option')[index].trigger('click')

    const feedback = wrapper.find('.ocean-lab__feedback')
    expect(feedback.classes()).toContain('is-wrong')
    expect(feedback.text()).toContain('再核对一次')
    expect(feedback.text()).not.toContain('判读正确')
    // 纠正性提示必须针对选错的那一项，不能是通用兜底文案
    expect(feedback.text()).toContain(plain(question.wrong[chosen.id]))
    expect(feedback.text()).not.toContain(plain(question.wrongDefault))
    expect(criterionHits(feedback.text()).length).toBeGreaterThanOrEqual(2)
  })

  it('答错后选项被锁住，不会二次作答', async () => {
    const question = OCEAN_CURRENT_QUESTIONS[0]
    const wrapper = await mountLab({ questions: [question] })

    const index = question.options.findIndex((option) => option.id !== question.answerId)
    await wrapper.findAll('.ocean-lab__option')[index].trigger('click')
    await wrapper.findAll('.ocean-lab__option')[0].trigger('click')

    const feedback = wrapper.find('.ocean-lab__feedback')
    expect(feedback.text()).toContain('再核对一次')
    expect(wrapper.findAll('.ocean-lab__option').every((node) => node.attributes('disabled') !== undefined)).toBe(
      true,
    )
  })

  it('答对计入进度，切到下一题后答案清空', async () => {
    const questions = OCEAN_CURRENT_QUESTIONS.slice(0, 2)
    const wrapper = await mountLab({ questions })

    const index = questions[0].options.findIndex((option) => option.id === questions[0].answerId)
    await wrapper.findAll('.ocean-lab__option')[index].trigger('click')
    expect(wrapper.find('.ocean-lab__progress').text()).toContain('已判对 1 / 2 题')

    await wrapper.findAll('.ocean-lab__nav button')[1].trigger('click')
    expect(wrapper.find('.ocean-lab__feedback').exists()).toBe(false)
    expect(wrapper.find('.ocean-lab__quiz').text()).toContain('第 2 / 2 题')
  })

  it('判读三步法与易错提示都渲染出来', async () => {
    const wrapper = await mountLab()

    expect(wrapper.findAll('.ocean-lab__step')).toHaveLength(READING_STEPS.length)
    expect(wrapper.text()).toContain('判半球')
    expect(wrapper.text()).toContain('判流向')
    expect(wrapper.text()).toContain('判性质')
    expect(wrapper.findAll('.learn-item')).toHaveLength(PITFALLS.length)
    expect(wrapper.text()).toContain('夏顺冬逆')
  })

  it('洋流数据为空时给出空态', async () => {
    const wrapper = await mountLab({ currents: [] })

    expect(wrapper.find('.learn-empty').exists()).toBe(true)
    expect(wrapper.find('.learn-empty').text()).toContain('没有可用的洋流数据')
  })

  it('练习题为空时给出空态', async () => {
    const wrapper = await mountLab({ questions: [] })

    expect(wrapper.find('.learn-empty').exists()).toBe(true)
    expect(wrapper.find('.learn-empty').text()).toContain('没有可用的练习题')
  })

  it('底图加载失败时给出明确提示并可重试', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 }))
    const wrapper = await mountLab({ geojson: null })

    expect(wrapper.find('.learn-error').exists()).toBe(true)
    expect(wrapper.find('.learn-error').text()).toContain('世界底图加载失败')
    expect(wrapper.find('.learn-error').text()).toContain('404')
    expect(wrapper.find('.learn-error button').exists()).toBe(true)
  })

  it('底图加载失败后点重试能重新加载', async () => {
    let attempt = 0
    vi.stubGlobal('fetch', async () => {
      attempt += 1
      if (attempt === 1) return { ok: false, status: 500 }
      return { ok: true, json: async () => FIXTURE_GEOJSON }
    })
    const wrapper = await mountLab({ geojson: null })
    expect(wrapper.find('.learn-error').exists()).toBe(true)

    await wrapper.find('.learn-error button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.learn-error').exists()).toBe(false)
    expect(wrapper.findAll('path.ocean-lab__coast')).toHaveLength(1)
  })
})
