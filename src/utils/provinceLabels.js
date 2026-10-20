import * as THREE from 'three'
import { lonLatToCartesian } from './geoDataProcessor'

/**
 * 球面省名标注。
 *
 * 标注用 Sprite 绘制，永远正对相机，位置钉在各省的中心点上。
 * 纯计算部分（朝向、透明度、尺寸、中心点解析）在本文件里导出，便于单测；
 * 画布纹理那部分依赖 DOM，放在浏览器里验证。
 */

/** 标签所在球面半径：要高于省份网格（2 + 0.02），否则会被面挡住 */
export const LABEL_RADIUS = 2.04
/** 基准距离：首屏相机距球心 3.6 */
export const REFERENCE_DISTANCE = 3.6
/** 基准标签世界高度 */
export const LABEL_BASE_HEIGHT = 0.1
/** 淡出区间：正对相机为 1，球体切线处为 0 */
const FADE_START = 0.04
const FADE_END = 0.26

const UP = new THREE.Vector3(0, 1, 0)

/**
 * 朝向余弦 → 不透明度。
 * 小于等于 0 表示在球体背面或贴着边缘，不显示。
 */
export function labelOpacity(facingDot) {
  if (!Number.isFinite(facingDot) || facingDot <= FADE_START) return 0
  const t = (facingDot - FADE_START) / (FADE_END - FADE_START)
  return Math.min(1, Math.max(0, t))
}

/**
 * 标签世界高度：随距离线性变化，屏幕上看起来大小基本恒定（HUD 风格）。
 */
export function labelHeight(distance, referenceDistance = REFERENCE_DISTANCE) {
  if (!Number.isFinite(distance) || distance <= 0) return 0
  return LABEL_BASE_HEIGHT * (distance / referenceDistance)
}

/**
 * 取要素的标注中心：优先 center，其次 centroid。取不到返回 null。
 */
export function resolveLabelCenter(feature) {
  const props = feature?.properties ?? {}
  const center = props.center ?? props.centroid
  if (!Array.isArray(center) || center.length < 2) return null
  const [lon, lat] = center
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
  return [lon, lat]
}

/** 标注在球面上的位置（返回 three 的三元组） */
export function labelPosition(center, radius = LABEL_RADIUS) {
  return lonLatToCartesian(center[0], center[1], radius)
}

/**
 * 要素的地理尺寸代理：包围盒面积（平方度）。
 * 只用作标注的去重叠优先级——面积大的省先放，小省让位。
 */
export function featureSizeProxy(feature) {
  const geom = feature?.geometry
  if (!geom?.coordinates) return 0

  const rings = []
  if (geom.type === 'Polygon') rings.push(...geom.coordinates)
  else if (geom.type === 'MultiPolygon') {
    for (const polygon of geom.coordinates) rings.push(...polygon)
  }

  let minLon = 180
  let minLat = 90
  let maxLon = -180
  let maxLat = -90
  let count = 0

  for (const ring of rings) {
    for (const coord of ring) {
      const [lon, lat] = coord
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      count++
    }
  }
  if (!count) return 0
  return (maxLon - minLon) * (maxLat - minLat)
}

/**
 * 标签在屏幕上占多大（像素高）。
 * 标签世界高度是按距离缩放的，投影到屏幕后大小基本恒定，所以可以直接算出来。
 */
export function labelPixelHeight(worldHeight, fovDegrees, viewportHeight, referenceDistance = REFERENCE_DISTANCE) {
  const fovRad = (fovDegrees * Math.PI) / 180
  const denominator = 2 * Math.tan(fovRad / 2)
  if (!denominator || !viewportHeight) return 0
  return (worldHeight / denominator) * (viewportHeight / referenceDistance)
}

/**
 * 两个屏幕空间的轴对齐矩形是否相交（标签去重叠用）。
 * 传入的是矩形的左/右/上/下边界。
 */
export function rectsOverlap(a, b, padding = 0) {
  return !(
    a.r + padding < b.l ||
    a.l - padding > b.r ||
    a.b + padding < b.t ||
    a.t - padding > b.b
  )
}

/**
 * 相机位置换算到地球自身的坐标系。
 * 地球只绕 Y 轴自转，所以逆着转回去即可，不依赖 matrixWorld 是否已刷新。
 */
export function cameraDirectionInEarthFrame(cameraPosition, earthRotationY) {
  return cameraPosition.clone().applyAxisAngle(UP, -earthRotationY).normalize()
}

/** 地球局部坐标 → 世界坐标（同样只绕 Y 轴，直接算，不依赖 matrixWorld） */
export function earthLocalToWorld(local, earthRotationY) {
  return local.clone().applyAxisAngle(UP, earthRotationY)
}

/**
 * 画出省名纹理。返回 { texture, width, height }。
 */
export function createLabelTexture(text, { fontSize = 40 } = {}) {
  const fontStack =
    '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Source Han Sans SC",system-ui,sans-serif'
  const font = `500 ${fontSize}px ${fontStack}`

  const measure = document.createElement('canvas').getContext('2d')
  measure.font = font
  const textWidth = measure.measureText(text).width

  const paddingX = 18
  const paddingY = 10
  const width = Math.ceil(textWidth) + paddingX * 2
  const height = fontSize + paddingY * 2

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 底衬：半透明深色圆角块 + 细描边
  ctx.fillStyle = 'rgba(4, 10, 20, 0.62)'
  ctx.beginPath()
  ctx.roundRect(1, 1, width - 2, height - 2, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.45)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#e2f4ff'
  ctx.fillText(text, width / 2, height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return { texture, width, height }
}
