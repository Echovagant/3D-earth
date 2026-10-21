// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  featureAreaKm2,
  featureLevel,
  featureParentAdcode,
  formatArea,
  geometryAreaKm2,
} from '../utils/areaData'

/** 以赤道为基准、边长 1°×1° 的经纬格子，球面面积约 12366 km² */
const EQUATOR_CELL_KM2 = 12366

const ring = (lon, lat, dLon = 1, dLat = 1) => [
  [lon, lat],
  [lon + dLon, lat],
  [lon + dLon, lat + dLat],
  [lon, lat + dLat],
  [lon, lat],
]

describe('geometryAreaKm2', () => {
  it('赤道上的 1°×1° 格子约 12366 km²', () => {
    const area = geometryAreaKm2({ type: 'Polygon', coordinates: [ring(0, 0)] })
    expect(area).toBeGreaterThan(EQUATOR_CELL_KM2 * 0.99)
    expect(area).toBeLessThan(EQUATOR_CELL_KM2 * 1.01)
  })

  it('面积随经度跨度线性变化', () => {
    const one = geometryAreaKm2({ type: 'Polygon', coordinates: [ring(0, 0, 1, 1)] })
    const two = geometryAreaKm2({ type: 'Polygon', coordinates: [ring(0, 0, 2, 1)] })
    expect(two / one).toBeCloseTo(2, 2)
  })

  it('高纬度格子面积更小（经线收敛）', () => {
    const equator = geometryAreaKm2({ type: 'Polygon', coordinates: [ring(0, 0)] })
    const north = geometryAreaKm2({ type: 'Polygon', coordinates: [ring(0, 60)] })
    expect(north).toBeLessThan(equator)
  })

  it('带洞的 Polygon 面积比不含洞的小', () => {
    const outer = ring(0, 0, 4, 4)
    const hole = ring(1, 1, 2, 2)
    const solid = geometryAreaKm2({ type: 'Polygon', coordinates: [outer] })
    const holed = geometryAreaKm2({ type: 'Polygon', coordinates: [outer, hole] })
    expect(holed).toBeLessThan(solid)
    expect(solid - holed).toBeCloseTo(
      geometryAreaKm2({ type: 'Polygon', coordinates: [hole] }),
      3,
    )
  })

  it('MultiPolygon 是各部分的和', () => {
    const a = ring(0, 0)
    const b = ring(10, 0)
    const multi = geometryAreaKm2({ type: 'MultiPolygon', coordinates: [[a], [b]] })
    const single = geometryAreaKm2({ type: 'Polygon', coordinates: [a] })
    expect(multi).toBeCloseTo(single * 2, 3)
  })

  it('非法几何返回 0', () => {
    expect(geometryAreaKm2(null)).toBe(0)
    expect(geometryAreaKm2({ type: 'Point', coordinates: [1, 2] })).toBe(0)
    expect(geometryAreaKm2({ type: 'Polygon', coordinates: [] })).toBe(0)
    expect(geometryAreaKm2({ type: 'Polygon', coordinates: [[[0, 0]]] })).toBe(0)
  })
})

describe('featureAreaKm2', () => {
  it('取要素几何的面积', () => {
    const feature = { geometry: { type: 'Polygon', coordinates: [ring(0, 0)] } }
    expect(featureAreaKm2(feature)).toBeCloseTo(
      geometryAreaKm2(feature.geometry),
      6,
    )
  })

  it('要素缺少几何时返回 0', () => {
    expect(featureAreaKm2({})).toBe(0)
    expect(featureAreaKm2(null)).toBe(0)
  })
})

describe('formatArea', () => {
  it('格式化成千分位', () => {
    expect(formatArea(12366.4)).toBe('12,366 km²')
  })

  it('非法值显示占位符', () => {
    expect(formatArea(0)).toBe('—')
    expect(formatArea(NaN)).toBe('—')
    expect(formatArea(-1)).toBe('—')
  })
})

describe('要素元信息', () => {
  it('取层级与父级 adcode', () => {
    const feature = { properties: { level: 'city', parent: { adcode: 440000 } } }
    expect(featureLevel(feature)).toBe('city')
    expect(featureParentAdcode(feature)).toBe('440000')
  })

  it('缺失时返回空值', () => {
    expect(featureLevel({})).toBe('')
    expect(featureParentAdcode({})).toBeNull()
  })
})
