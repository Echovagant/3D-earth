// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import earcut from 'earcut'

import { createProvinceMeshFromFeature, lonLatToCartesian } from '../utils/geoDataProcessor'

const geo = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../public/geojson/china-provinces.json', import.meta.url)),
    'utf-8',
  ),
)

/** 把球面坐标反解回经纬度 */
const cartToLonLat = (x, y, z) => {
  const r = Math.hypot(x, y, z)
  const lat = 90 - (Math.acos(y / r) * 180) / Math.PI
  let lon = (Math.atan2(z, -x) * 180) / Math.PI - 180
  while (lon < -180) lon += 360
  while (lon > 180) lon -= 360
  return [lon, lat]
}

const meshBounds = (mesh) => {
  const p = mesh.geometry.attributes.position.array
  const b = { minLon: 180, minLat: 90, maxLon: -180, maxLat: -90 }
  for (let i = 0; i < p.length; i += 3) {
    const [lon, lat] = cartToLonLat(p[i], p[i + 1], p[i + 2])
    b.minLon = Math.min(b.minLon, lon)
    b.maxLon = Math.max(b.maxLon, lon)
    b.minLat = Math.min(b.minLat, lat)
    b.maxLat = Math.max(b.maxLat, lat)
  }
  return b
}

const sourceBounds = (feature) => {
  const polys =
    feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  const b = { minLon: 180, minLat: 90, maxLon: -180, maxLat: -90 }
  for (const poly of polys)
    for (const ring of poly)
      for (const [lon, lat] of ring) {
        b.minLon = Math.min(b.minLon, lon)
        b.maxLon = Math.max(b.maxLon, lon)
        b.minLat = Math.min(b.minLat, lat)
        b.maxLat = Math.max(b.maxLat, lat)
      }
  return b
}

/**
 * 参考实现：每个 polygon 独立三角化后拼接。
 * earcut 的索引在每个 polygon 内从 0 开始，所以顶点表也必须每个 polygon 重建。
 */
const referencePositions = (feature, radius, elevation) => {
  const out = []
  const polys =
    feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  for (const poly of polys) {
    const flat2D = []
    const holeIndices = []
    const verts = []
    poly.forEach((ring, rIndex) => {
      if (rIndex > 0) holeIndices.push(flat2D.length / 2)
      for (const [lon, lat] of ring) {
        flat2D.push(lon, lat)
        verts.push(lonLatToCartesian(lon, lat, radius + elevation))
      }
    })
    const tris = earcut(flat2D, holeIndices, 2)
    for (let i = 0; i < tris.length; i += 3) {
      out.push(...verts[tris[i]], ...verts[tris[i + 1]], ...verts[tris[i + 2]])
    }
  }
  return out
}

const byName = (name) => geo.features.find((f) => f.properties.name === name)

describe('createProvinceMeshFromFeature', () => {
  it('每个 feature 的渲染范围都覆盖源范围', () => {
    const problems = []
    for (const feature of geo.features) {
      const label = feature.properties.name || feature.properties.adcode
      const mesh = createProvinceMeshFromFeature(feature, { radius: 2, elevation: 0.02 })
      const m = meshBounds(mesh)
      const s = sourceBounds(feature)
      if (m.minLon > s.minLon + 0.05) problems.push(`${label} minLon ${m.minLon.toFixed(3)} > ${s.minLon.toFixed(3)}`)
      if (m.maxLon < s.maxLon - 0.05) problems.push(`${label} maxLon ${m.maxLon.toFixed(3)} < ${s.maxLon.toFixed(3)}`)
      if (m.minLat > s.minLat + 0.05) problems.push(`${label} minLat ${m.minLat.toFixed(3)} > ${s.minLat.toFixed(3)}`)
      if (m.maxLat < s.maxLat - 0.05) problems.push(`${label} maxLat ${m.maxLat.toFixed(3)} < ${s.maxLat.toFixed(3)}`)
    }
    expect(problems).toEqual([])
  })

  it('与参考实现逐顶点一致', () => {
    const problems = []
    for (const feature of geo.features) {
      const label = feature.properties.name || feature.properties.adcode
      const mesh = createProvinceMeshFromFeature(feature, { radius: 2, elevation: 0.02 })
      const actual = Array.from(mesh.geometry.attributes.position.array)
      const expected = referencePositions(feature, 2, 0.02)
      if (actual.length !== expected.length) {
        problems.push(`${label} 顶点数量 ${actual.length} != ${expected.length}`)
        continue
      }
      let maxDelta = 0
      for (let i = 0; i < expected.length; i++) {
        maxDelta = Math.max(maxDelta, Math.abs(actual[i] - expected[i]))
      }
      if (maxDelta >= 1e-5) problems.push(`${label} 顶点偏差 ${maxDelta}`)
    }
    expect(problems).toEqual([])
  })

  it('海南覆盖三沙群岛（最低纬度低于 5°）', () => {
    const mesh = createProvinceMeshFromFeature(byName('海南省'), { radius: 2, elevation: 0.02 })
    expect(meshBounds(mesh).minLat).toBeLessThan(5)
  })

  it('台湾覆盖东侧离岛（最东经度大于 124°）', () => {
    const mesh = createProvinceMeshFromFeature(byName('台湾省'), { radius: 2, elevation: 0.02 })
    expect(meshBounds(mesh).maxLon).toBeGreaterThan(124)
  })

  it('九段线覆盖西沙（最西经度低于 110°）', () => {
    const mesh = createProvinceMeshFromFeature(byName(''), { radius: 2, elevation: 0.02 })
    expect(meshBounds(mesh).minLon).toBeLessThan(110)
  })
})
