/**
 * 经线的几何（§2.3 经线：概念与五个特点）。
 *
 * 侧视图（观察者站在 0° 经线上、北极朝上）里，经线在屏幕上是一条
 * 从北极点到南极点的弧：
 *   屏幕 x = cx + R·cosφ·sinλ，屏幕 y = cy − R·sinφ
 * λ 是这条经线相对观察者的经度。所以 λ = 0 的经线投影成一条竖直线，
 * λ 越靠近 ±90° 弧越鼓——「经线是半圆」的直观来源就是这条弧：
 * 它从一个极点出发，到另一个极点结束，两头都是公共端点。
 *
 * 两根经线长度处处相等（都是大圆的一半 ≈ 2 万千米），
 * 但相邻经线的间隔随纬度递减，到极点为 0。
 */

/**
 * 侧视图上一条经线的屏幕弧（从北极点到南极点）。
 *
 * @param {number} cx 球心 x
 * @param {number} cy 球心 y
 * @param {number} radius 球半径
 * @param {number} lon 该经线相对观察者的经度（正数为东）
 * @param {number} steps 采样段数
 */
export function meridianArcPoints(cx, cy, radius, lon, steps = 48) {
  const k = (lon * Math.PI) / 180
  const points = []
  for (let i = 0; i <= steps; i += 1) {
    const phi = ((90 - (i / steps) * 180) * Math.PI) / 180
    points.push({
      x: cx + radius * Math.cos(phi) * Math.sin(k),
      y: cy - radius * Math.sin(phi),
    })
  }
  return points
}

/** 侧视图上一条经线的路径（可直接塞进 d 属性） */
export function meridianArcPath(cx, cy, radius, lon, steps = 48) {
  return meridianArcPoints(cx, cy, radius, lon, steps)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
}

/** 经线在赤道处的横向鼓出量（屏幕上能看见的宽度） */
export function meridianBulge(radius, lon) {
  return radius * Math.abs(Math.sin((lon * Math.PI) / 180))
}

/** 一根经线的实地长度（千米）——处处相等，约等于半个赤道 */
export function meridianLengthKm(earthRadiusKm = 6371) {
  return Math.PI * earthRadiusKm
}

/**
 * 相邻两条经线之间的实地距离（千米）。
 * 随纬度递减：纬线越短，同样的经度差挤得越近；极点处为 0。
 */
export function meridianGapKm(lat, degreeGap = 1, earthRadiusKm = 6371) {
  const c = Math.cos((lat * Math.PI) / 180)
  return degreeGap * (Math.PI / 180) * earthRadiusKm * c
}
