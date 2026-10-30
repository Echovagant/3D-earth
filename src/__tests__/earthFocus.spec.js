// @vitest-environment node
/**
 * 聚焦参数（?at=纬度,经度）的解析与拼装。
 *
 * 景区的「在地球上看看」靠它把镜头带到地方去；解析错了就会飞到
 * 镜像位置，所以边界情况在这里钉死。
 */
import { describe, it, expect } from 'vitest'
import { parseFocusQuery, formatFocusQuery } from '../utils/focusQuery.js'

describe('聚焦参数', () => {
  it('能解出坐标', () => {
    expect(parseFocusQuery({ at: '33.26,103.92' })).toEqual([33.26, 103.92])
  })

  it('没有或格式不对就返回 null', () => {
    expect(parseFocusQuery({})).toBeNull()
    expect(parseFocusQuery({ at: 'abc' })).toBeNull()
    expect(parseFocusQuery({ at: '99,200' })).toBeNull()
  })

  it('参数个数不对、非数字、超出地球范围都判为无效', () => {
    expect(parseFocusQuery({ at: '33.26' })).toBeNull()
    expect(parseFocusQuery({ at: '33.26,103.92,12' })).toBeNull()
    expect(parseFocusQuery({ at: '33.26,' })).toBeNull()
    expect(parseFocusQuery({ at: ',103.92' })).toBeNull()
    expect(parseFocusQuery({ at: '91,0' })).toBeNull()
    expect(parseFocusQuery({ at: '0,181' })).toBeNull()
  })

  it('非字符串的 at（数组、对象、数字）不当成坐标', () => {
    expect(parseFocusQuery({ at: 123 })).toBeNull()
    expect(parseFocusQuery({ at: ['33', '104'] })).toBeNull()
    expect(parseFocusQuery({ at: { lat: 33 } })).toBeNull()
    expect(parseFocusQuery(undefined)).toBeNull()
  })

  it('两端极值是合法的', () => {
    expect(parseFocusQuery({ at: '90,180' })).toEqual([90, 180])
    expect(parseFocusQuery({ at: '-90,-180' })).toEqual([-90, -180])
  })

  it('拼回查询串：纬度在前，保留五位小数', () => {
    expect(formatFocusQuery([33.26, 103.92])).toBe('33.26000,103.92000')
  })

  it('拼装与解析能往返', () => {
    const coords = [39.9163, 116.3972]
    expect(parseFocusQuery({ at: formatFocusQuery(coords) })).toEqual(coords)
  })

  it('坐标不合法时拼不出查询串', () => {
    expect(formatFocusQuery(null)).toBeNull()
    expect(formatFocusQuery([33.26])).toBeNull()
    expect(formatFocusQuery(['a', 'b'])).toBeNull()
  })
})
