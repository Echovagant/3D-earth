// @vitest-environment node
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'

import { lonLatToCartesian } from '../utils/geoDataProcessor'
import {
  cartToLonLat,
  cameraLonLat,
  cameraDirectionInEarthFrame,
  formatLonLat,
} from '../utils/provinceLabels'

describe('cartToLonLat', () => {
  it('与 lonLatToCartesian 严格互逆', () => {
    const samples = [
      [20, 10],
      [105, 33],
      [0, 0],
      [-73.9, 40.7],
      [151.2, -33.9],
      [179, -60],
    ]
    for (const [lon, lat] of samples) {
      const [lon2, lat2] = cartToLonLat(...lonLatToCartesian(lon, lat, 2))
      expect(lon2).toBeCloseTo(lon, 6)
      expect(lat2).toBeCloseTo(lat, 6)
    }
  })

  it('纬度从 Y 轴解算——写成 asin(z) 会把南北半球读反', () => {
    // 相机在北半球 y > 0，南半球 y < 0
    const [, northY] = lonLatToCartesian(0, 45, 2)
    const [, southY] = lonLatToCartesian(0, -45, 2)
    expect(northY).toBeGreaterThan(0)
    expect(southY).toBeLessThan(0)

    const [, northLat] = cartToLonLat(...lonLatToCartesian(0, 45, 2))
    const [, southLat] = cartToLonLat(...lonLatToCartesian(0, -45, 2))
    expect(northLat).toBeCloseTo(45, 6)
    expect(southLat).toBeCloseTo(-45, 6)
  })

  it('零向量返回原点而不是 NaN', () => {
    expect(cartToLonLat(0, 0, 0)).toEqual([0, 0])
  })
})

describe('cameraLonLat', () => {
  it('地球自转后仍读出正确的正对点', () => {
    // 真实场景：地球绕 Y 轴转了 θ，相机固定在世界坐标不动。
    // 所以相机位置要先跟着转成世界坐标，再由 cameraLonLat 逆旋转回局部坐标。
    // 不做这一步就相当于把局部坐标当世界坐标用，会凭空漂 41 度。
    const rotation = 60 * 0.0002 * 60
    const local = new THREE.Vector3(...lonLatToCartesian(105, 33, 3.6))
    const cameraPosition = local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation)

    const [lon, lat] = cameraLonLat(cameraPosition, rotation)
    expect(lon).toBeCloseTo(105, 6)
    expect(lat).toBeCloseTo(33, 6)
  })

  it('不做逆旋转就会偏离真实正对点', () => {
    // 复现旧实现的错误：直接拿世界坐标解算，60 秒自转后差 41.25 度
    const rotation = 60 * 0.0002 * 60
    const local = new THREE.Vector3(...lonLatToCartesian(105, 33, 3.6))
    const cameraPosition = local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation)

    const naive = cartToLonLat(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    expect(Math.abs(naive[0] - 105)).toBeGreaterThan(40)
  })

  it('自转 0 时与世界坐标解算一致', () => {
    const cameraPosition = new THREE.Vector3(...lonLatToCartesian(105, 33, 3.6))
    const [lon, lat] = cameraLonLat(cameraPosition, 0)
    expect(lon).toBeCloseTo(105, 6)
    expect(lat).toBeCloseTo(33, 6)
  })

  it('cameraDirectionInEarthFrame 返回单位向量', () => {
    const dir = cameraDirectionInEarthFrame(
      new THREE.Vector3(...lonLatToCartesian(105, 33, 3.6)),
      0.5,
    )
    expect(dir.length()).toBeCloseTo(1, 6)
  })
})

describe('formatLonLat', () => {
  it('按半球输出东西南北', () => {
    expect(formatLonLat(105, 33)).toBe('105.00°E 33.00°N')
    expect(formatLonLat(-73.9, 40.7)).toBe('73.90°W 40.70°N')
    expect(formatLonLat(151.2, -33.9)).toBe('151.20°E 33.90°S')
  })
})
