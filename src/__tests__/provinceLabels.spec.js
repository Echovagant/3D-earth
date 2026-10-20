// @vitest-environment node
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'

import {
  LABEL_BASE_HEIGHT,
  LABEL_RADIUS,
  REFERENCE_DISTANCE,
  cameraDirectionInEarthFrame,
  earthLocalToWorld,
  featureSizeProxy,
  labelHeight,
  labelOpacity,
  labelPixelHeight,
  labelPosition,
  rectsOverlap,
  resolveLabelCenter,
} from '../utils/provinceLabels'

const TWO_PI = Math.PI * 2

describe('labelOpacity', () => {
  it('正对相机时完全不透明', () => {
    expect(labelOpacity(1)).toBe(1)
  })

  it('球体背面与边缘不显示', () => {
    expect(labelOpacity(0)).toBe(0)
    expect(labelOpacity(-0.5)).toBe(0)
    expect(labelOpacity(-1)).toBe(0)
  })

  it('临近边缘逐渐淡出且单调', () => {
    expect(labelOpacity(0.15)).toBeGreaterThan(0)
    expect(labelOpacity(0.15)).toBeLessThan(1)
    expect(labelOpacity(0.1)).toBeLessThan(labelOpacity(0.15))
    expect(labelOpacity(0.2)).toBeGreaterThan(labelOpacity(0.15))
  })

  it('非法输入返回 0', () => {
    expect(labelOpacity(NaN)).toBe(0)
    expect(labelOpacity(undefined)).toBe(0)
  })
})

describe('labelHeight', () => {
  it('基准距离上取基准高度', () => {
    expect(labelHeight(REFERENCE_DISTANCE)).toBeCloseTo(LABEL_BASE_HEIGHT, 10)
  })

  it('随距离线性变化，屏幕上大小基本恒定', () => {
    expect(labelHeight(REFERENCE_DISTANCE * 2)).toBeCloseTo(LABEL_BASE_HEIGHT * 2, 10)
    expect(labelHeight(REFERENCE_DISTANCE * 0.5)).toBeCloseTo(LABEL_BASE_HEIGHT * 0.5, 10)
  })

  it('非法距离返回 0', () => {
    expect(labelHeight(0)).toBe(0)
    expect(labelHeight(-1)).toBe(0)
    expect(labelHeight(NaN)).toBe(0)
  })
})

describe('resolveLabelCenter', () => {
  it('优先取 center', () => {
    const center = resolveLabelCenter({
      properties: { center: [116.4, 39.9], centroid: [117.1, 40.2] },
    })
    expect(center).toEqual([116.4, 39.9])
  })

  it('没有 center 时退回 centroid', () => {
    expect(resolveLabelCenter({ properties: { centroid: [117.1, 40.2] } })).toEqual([117.1, 40.2])
  })

  it('取不到或数据非法时返回 null', () => {
    expect(resolveLabelCenter({ properties: {} })).toBeNull()
    expect(resolveLabelCenter({ properties: { center: 'not-an-array' } })).toBeNull()
    expect(resolveLabelCenter({ properties: { center: [NaN, 39.9] } })).toBeNull()
    expect(resolveLabelCenter({})).toBeNull()
    expect(resolveLabelCenter(null)).toBeNull()
  })
})

describe('labelPosition', () => {
  it('落在指定半径的球面上', () => {
    const [x, y, z] = labelPosition([116.4, 39.9])
    expect(Math.hypot(x, y, z)).toBeCloseTo(LABEL_RADIUS, 6)
  })

  it('经度增大时绕 Y 轴按同样角度移动', () => {
    const [x1, , z1] = labelPosition([100, 30])
    const [x2, , z2] = labelPosition([110, 30])
    const angle = Math.atan2(z2, x2) - Math.atan2(z1, x1)
    expect(Math.abs(angle)).toBeCloseTo((10 * Math.PI) / 180, 5)
  })
})

describe('地球坐标系换算', () => {
  it('自转为 0 时相机方向就是相机位置的方向', () => {
    const cam = new THREE.Vector3(0.3, 0.5, 0.8)
    const dir = cameraDirectionInEarthFrame(cam, 0)
    expect(dir.length()).toBeCloseTo(1, 10)
    expect(dir.x).toBeCloseTo(cam.x / cam.length(), 10)
    expect(dir.y).toBeCloseTo(cam.y / cam.length(), 10)
    expect(dir.z).toBeCloseTo(cam.z / cam.length(), 10)
  })

  it('地球自转 θ 时，相机方向要逆着转回去', () => {
    const theta = 0.7
    const cam = new THREE.Vector3(0.3, 0.5, 0.8)
    const dir = cameraDirectionInEarthFrame(cam, theta)
    // 逆旋转 θ 后再正转 θ 应回到原方向
    const back = earthLocalToWorld(dir, theta)
    const norm = cam.length()
    expect(back.x).toBeCloseTo(cam.x / norm, 8)
    expect(back.y).toBeCloseTo(cam.y / norm, 8)
    expect(back.z).toBeCloseTo(cam.z / norm, 8)
  })

  it('自转为 0 时局部坐标与世界坐标一致', () => {
    const world = earthLocalToWorld(new THREE.Vector3(1, 2, 3), 0)
    expect(world.x).toBeCloseTo(1, 10)
    expect(world.y).toBeCloseTo(2, 10)
    expect(world.z).toBeCloseTo(3, 10)
  })

  it('绕 Y 轴旋转保持模长不变', () => {
    for (const theta of [0.3, 1.2, TWO_PI - 0.4]) {
      const world = earthLocalToWorld(new THREE.Vector3(1, 2, 3), theta)
      expect(world.length()).toBeCloseTo(Math.hypot(1, 2, 3), 10)
    }
  })
})

describe('featureSizeProxy', () => {
  const poly = (rings) => ({ geometry: { type: 'Polygon', coordinates: rings } })
  const multi = (polys) => ({ geometry: { type: 'MultiPolygon', coordinates: polys } })

  it('Polygon 用包围盒面积衡量大小', () => {
    const big = poly([[
      [100, 20],
      [130, 20],
      [130, 50],
      [100, 50],
      [100, 20],
    ]])
    const small = poly([[
      [110, 30],
      [111, 30],
      [111, 31],
      [110, 31],
      [110, 30],
    ]])
    expect(featureSizeProxy(big)).toBeCloseTo(30 * 30, 6)
    expect(featureSizeProxy(small)).toBeCloseTo(1 * 1, 6)
    expect(featureSizeProxy(big)).toBeGreaterThan(featureSizeProxy(small))
  })

  it('MultiPolygon 取所有环的并集包围盒', () => {
    const m = multi([
      [
        [
          [100, 20],
          [110, 20],
          [110, 30],
          [100, 30],
          [100, 20],
        ],
      ],
      [
        [
          [120, 40],
          [130, 40],
          [130, 50],
          [120, 50],
          [120, 40],
        ],
      ],
    ])
    expect(featureSizeProxy(m)).toBeCloseTo(30 * 30, 6)
  })

  it('数据缺失或非法时返回 0', () => {
    expect(featureSizeProxy({})).toBe(0)
    expect(featureSizeProxy({ geometry: { type: 'Polygon', coordinates: [] } })).toBe(0)
    expect(
      featureSizeProxy({
        geometry: { type: 'Polygon', coordinates: [[[NaN, 1], [2, 3]]] },
      }),
    ).toBe(0)
  })
})

describe('labelPixelHeight', () => {
  it('随视口高度线性变化', () => {
    const a = labelPixelHeight(LABEL_BASE_HEIGHT, 75, 800)
    const b = labelPixelHeight(LABEL_BASE_HEIGHT, 75, 1600)
    expect(b).toBeCloseTo(a * 2, 10)
  })

  it('随世界高度线性变化', () => {
    const a = labelPixelHeight(LABEL_BASE_HEIGHT, 75, 800)
    const b = labelPixelHeight(LABEL_BASE_HEIGHT * 3, 75, 800)
    expect(b).toBeCloseTo(a * 3, 10)
  })

  it('视口高度为 0 时返回 0', () => {
    expect(labelPixelHeight(LABEL_BASE_HEIGHT, 75, 0)).toBe(0)
  })
})

describe('rectsOverlap', () => {
  const box = (l, t, r, b) => ({ l, t, r, b })

  it('相交时为 true', () => {
    expect(rectsOverlap(box(0, 0, 10, 10), box(5, 5, 15, 15))).toBe(true)
    expect(rectsOverlap(box(0, 0, 10, 10), box(8, 8, 18, 18))).toBe(true)
  })

  it('分离时为 false', () => {
    expect(rectsOverlap(box(0, 0, 10, 10), box(20, 20, 30, 30))).toBe(false)
    expect(rectsOverlap(box(0, 0, 10, 10), box(11, 0, 20, 10))).toBe(false)
  })

  it('padding 会让判定更严格', () => {
    expect(rectsOverlap(box(0, 0, 10, 10), box(12, 0, 20, 10))).toBe(false)
    expect(rectsOverlap(box(0, 0, 10, 10), box(12, 0, 20, 10), 3)).toBe(true)
  })
})
