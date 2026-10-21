// @vitest-environment node
// 球面交互的纯函数测试。
//
// 这些计算原先内联在两个场景组件里，既没法单测，又在拷贝过程中漂移。
import { describe, it, expect } from 'vitest'

import {
  pointerToNdc,
  easeInOutCubic,
  spinAroundY,
  lerpPoint,
} from '../utils/globeMath'
import { placeLabels } from '../utils/provinceLabels'

const rect = { left: 0, top: 0, width: 1000, height: 500 }

describe('pointerToNdc', () => {
  it('画布左上角是 (-1, 1)，右下角是 (1, -1)', () => {
    expect(pointerToNdc(0, 0, rect)).toEqual({ x: -1, y: 1 })
    expect(pointerToNdc(1000, 500, rect)).toEqual({ x: 1, y: -1 })
  })

  it('画布中心是原点', () => {
    const ndc = pointerToNdc(500, 250, rect)
    expect(ndc.x).toBeCloseTo(0, 10)
    expect(ndc.y).toBeCloseTo(0, 10)
  })

  it('画布不在视口原点时要减去偏移', () => {
    const offset = { left: 100, top: 50, width: 1000, height: 500 }
    const ndc = pointerToNdc(600, 300, offset)
    expect(ndc.x).toBeCloseTo(0, 10)
    expect(ndc.y).toBeCloseTo(0, 10)
  })
})

describe('easeInOutCubic', () => {
  it('两端与中点符合缓入缓出', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10)
  })

  it('单调递增', () => {
    let previous = -1
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const value = easeInOutCubic(t)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('越界与非法输入被钳住', () => {
    expect(easeInOutCubic(-1)).toBe(0)
    expect(easeInOutCubic(2)).toBe(1)
    expect(easeInOutCubic(NaN)).toBe(0)
  })
})

describe('spinAroundY', () => {
  it('绕 Y 轴旋转不改变 y', () => {
    const rotated = spinAroundY({ x: 1, y: 2, z: 3 }, 0.7)
    expect(rotated.y).toBe(2)
  })

  it('保持向量长度', () => {
    const before = Math.hypot(1, 2, 3)
    const rotated = spinAroundY({ x: 1, y: 2, z: 3 }, 1.3)
    expect(Math.hypot(rotated.x, rotated.y, rotated.z)).toBeCloseTo(before, 10)
  })

  it('转一整圈回到原位', () => {
    const rotated = spinAroundY({ x: 1, y: 2, z: 3 }, Math.PI * 2)
    expect(rotated.x).toBeCloseTo(1, 8)
    expect(rotated.z).toBeCloseTo(3, 8)
  })

  it('与 three 的 applyAxisAngle 同向', () => {
    // 绕 Y 轴正向旋转：+X 转向 -Z（右手定则，three 的约定）
    const rotated = spinAroundY({ x: 1, y: 0, z: 0 }, Math.PI / 2)
    expect(rotated.x).toBeCloseTo(0, 10)
    expect(rotated.z).toBeCloseTo(-1, 10)
  })
})

describe('lerpPoint', () => {
  it('两端与中点正确', () => {
    const from = { x: 0, y: 0, z: 0 }
    const to = { x: 2, y: 4, z: 6 }
    expect(lerpPoint(from, to, 0)).toEqual({ x: 0, y: 0, z: 0 })
    expect(lerpPoint(from, to, 1)).toEqual({ x: 2, y: 4, z: 6 })
    const mid = lerpPoint(from, to, 0.5)
    expect(mid.x).toBeCloseTo(1, 10)
    expect(mid.y).toBeCloseTo(2, 10)
  })
})

describe('placeLabels', () => {
  const makeSprite = () => ({
    visible: true,
    material: { opacity: 0 },
    scale: { x: 1, y: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z } },
  })

  it('大区域优先占位，小区域让位', () => {
    const big = { sprite: makeSprite(), opacity: 1, priority: 100, aspect: 1, distance: 5, x: 500, y: 250 }
    const small = { sprite: makeSprite(), opacity: 1, priority: 1, aspect: 1, distance: 5, x: 502, y: 251 }
    const placed = placeLabels([small, big], 20)
    expect(placed).toBe(1)
    expect(big.sprite.visible).toBe(true)
    expect(small.sprite.visible).toBe(false)
  })

  it('不重叠的都放下', () => {
    const a = { sprite: makeSprite(), opacity: 1, priority: 2, aspect: 1, distance: 5, x: 100, y: 100 }
    const b = { sprite: makeSprite(), opacity: 1, priority: 1, aspect: 1, distance: 5, x: 900, y: 400 }
    expect(placeLabels([a, b], 20)).toBe(2)
    expect(a.sprite.visible).toBe(true)
    expect(b.sprite.visible).toBe(true)
  })

  it('放置后按距离设定屏幕尺寸恒定', () => {
    const item = { sprite: makeSprite(), opacity: 0.8, priority: 1, aspect: 2, distance: 5, x: 100, y: 100 }
    placeLabels([item], 20)
    expect(item.sprite.visible).toBe(true)
    expect(item.sprite.material.opacity).toBe(0.8)
    // scale.y 是世界高度（随距离缩放），scale.x 是它乘宽高比
    expect(item.sprite.scale.x).toBeCloseTo(item.sprite.scale.y * 2, 10)
  })
})
