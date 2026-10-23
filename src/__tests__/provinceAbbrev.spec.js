// @vitest-environment jsdom
/**
 * 省级行政区简称表的回归守卫。
 *
 * 这张表最容易出问题的三处，锁住：
 *   ① 行数必须跟着索引走：省份数据增删后表里也得跟着变，
 *      所以既断言实际行数，也断言它等于索引里的条目数（数据变了会当场报错）
 *   ② 简称要跟索引里的 abbreviation 一一对应，不能自己另写一份简称表
 *   ③ 搜索框要同时按省名和简称过滤，并且搜不到时有明确空态
 *
 * 另外守住「不传 provinces 也能自己工作」：组件自己去取
 * public/data/provinces/index.json，取不到时要显示错误而不是空表。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount, flushPromises } from '@vue/test-utils'

import ProvinceAbbrevTable from '../components/ProvinceAbbrevTable.vue'
import { REGION_GROUPS } from '../utils/provinceColors'

/** 索引是仓库内的静态 JSON，测试直接读文件，不依赖网络 */
const index = JSON.parse(readFileSync('public/data/provinces/index.json', 'utf8'))
const provinces = index.provinces

/** 实际请求过的 URL */
const urls = []

/** 索引请求是否失败 */
let broken = false

beforeEach(() => {
  urls.length = 0
  broken = false
  vi.stubGlobal('fetch', async (url) => {
    urls.push(String(url))
    if (broken) return { ok: false, status: 404, json: async () => ({}) }
    return { ok: true, json: async () => index }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** 表里的省份行（分区标题行不算） */
const rowsOf = (wrapper) => wrapper.findAll('tr.prov-abbrev__row')

/** 一行里的三格：省份 / 简称 / 省会 */
const cellsOf = (row) => row.findAll('td').map((td) => td.text())

describe('省级行政区简称表', () => {
  it('外部喂数据时，表里 34 行，与索引条目数一致', async () => {
    const wrapper = mount(ProvinceAbbrevTable, { props: { provinces } })
    await flushPromises()

    const rows = rowsOf(wrapper)
    expect(rows).toHaveLength(34)
    // 索引变了（增删省份）时这条会当场失败，提醒同步更新行数
    expect(rows).toHaveLength(Object.keys(provinces).length)
    // 喂了数据就不该再去请求索引
    expect(urls).toHaveLength(0)
  })

  it('每行的简称与省会都跟索引里的 abbreviation / capital 一致', async () => {
    const wrapper = mount(ProvinceAbbrevTable, { props: { provinces } })
    await flushPromises()

    const byName = new Map(Object.values(provinces).map((p) => [p.name, p]))
    const rows = rowsOf(wrapper)
    expect(rows).toHaveLength(34)

    rows.forEach((row) => {
      const [name, abbreviation, capital] = cellsOf(row)
      const expected = byName.get(name)
      expect(expected).toBeTruthy()
      expect(abbreviation).toBe(expected.abbreviation)
      expect(capital).toBe(expected.capital)
    })
  })

  it('搜索框按省名和简称过滤', async () => {
    const wrapper = mount(ProvinceAbbrevTable, { props: { provinces } })
    await flushPromises()
    const input = wrapper.find('input[type="search"]')

    await input.setValue('四川')
    let rows = rowsOf(wrapper)
    expect(rows).toHaveLength(1)
    expect(cellsOf(rows[0])[0]).toBe('四川省')

    // 简称也要能命中同一个省
    await input.setValue('川')
    rows = rowsOf(wrapper)
    expect(rows).toHaveLength(1)
    expect(cellsOf(rows[0])[1]).toBe('川')

    // 清空后恢复全部
    await input.setValue('')
    expect(rowsOf(wrapper)).toHaveLength(34)
  })

  it('搜不到时有明确空态，且不残留省份行', async () => {
    const wrapper = mount(ProvinceAbbrevTable, { props: { provinces } })
    await flushPromises()

    await wrapper.find('input[type="search"]').setValue('不存在的省份')
    expect(rowsOf(wrapper)).toHaveLength(0)
    expect(wrapper.text()).toContain('没有匹配的省份')
  })

  it('按地理分区分组展示，分区名与顺序跟分区表一致', async () => {
    const wrapper = mount(ProvinceAbbrevTable, { props: { provinces } })
    await flushPromises()

    const labels = wrapper
      .findAll('tr.prov-abbrev__group')
      .map((tr) => tr.find('.prov-abbrev__group-label').text())
    expect(labels).toEqual(REGION_GROUPS.map((group) => group.label))
  })

  it('数组形态的 provinces 也能归一化成同样的行', async () => {
    const wrapper = mount(ProvinceAbbrevTable, {
      props: {
        provinces: [
          { adcode: '510000', name: '四川省', abbreviation: '川', capital: '成都市' },
          { adcode: '440000', name: '广东省', abbreviation: '粤', capital: '广州市' },
        ],
      },
    })
    await flushPromises()

    const rows = rowsOf(wrapper)
    expect(rows).toHaveLength(2)
    // 分组顺序按分区表：华南在西南之前，所以广东排在四川前面
    expect(cellsOf(rows[0])).toEqual(['广东省', '粤', '广州市'])
    expect(cellsOf(rows[1])).toEqual(['四川省', '川', '成都市'])
  })

  it('不传 provinces 时自己取索引', async () => {
    const wrapper = mount(ProvinceAbbrevTable)
    await flushPromises()
    await flushPromises()

    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain('/data/provinces/index.json')
    expect(rowsOf(wrapper)).toHaveLength(34)
    expect(wrapper.text()).not.toContain('读取省份索引')
  })

  it('索引取不到时显示错误并能重试', async () => {
    broken = true
    const wrapper = mount(ProvinceAbbrevTable)
    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('无法加载省份索引')
    expect(rowsOf(wrapper)).toHaveLength(0)

    broken = false
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await flushPromises()

    expect(rowsOf(wrapper)).toHaveLength(34)
  })
})
