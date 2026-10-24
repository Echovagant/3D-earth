/**
 * SVG 图解里那些「容易画错」的原语。
 *
 * 这些函数只算几何，不画——画法统一交给组件。
 * 把它们单独立出来是因为弧的方向、箭头的朝向这类东西
 * 靠肉眼看截图最容易看错，画错一次就是教错一次。
 */

/**
 * 圆的左半（x < cx 那一侧）。
 *
 * SVG 弧的 sweep-flag=1 是屏幕上的顺时针。从上顶点出发顺时针会先走右边，
 * 所以左半要用 0。
 */
export function leftHalfPath(cx, cy, r) {
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} L ${cx} ${cy - r} Z`
}

/** 圆的右半（x > cx 那一侧） */
export function rightHalfPath(cx, cy, r) {
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} L ${cx} ${cy - r} Z`
}

/** 整个圆画成一条路径——要画虚线的大圆时用（circle 元素没法只描一半） */
export function circlePath(cx, cy, r) {
  return `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r}`
}

/**
 * 极坐标转直角坐标。
 *
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} radius 半径
 * @param {number} angleDeg 角度，0 度在正右方，逆时针为正
 */
export function polarToXY(cx, cy, radius, angleDeg) {
  const a = (angleDeg * Math.PI) / 180
  return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) }
}

/**
 * 一段圆弧：从起始角画到终止角（角度以正右方为 0，逆时针为正）。
 *
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} r 半径
 * @param {number} fromDeg 起始角
 * @param {number} toDeg 终止角
 */
export function arcPath(cx, cy, r, fromDeg, toDeg) {
  const from = polarToXY(cx, cy, r, fromDeg)
  const to = polarToXY(cx, cy, r, toDeg)
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
  // 屏幕坐标 y 向下，角度逆时针为正 → 路径方向与角度方向相反 → sweep 取 0
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
}

/**
 * 箭头头部：一个指向 angleDeg 方向的小三角，尖端落在 (x, y)。
 *
 * @param {number} x 尖端坐标 x
 * @param {number} y 尖端坐标 y
 * @param {number} angleDeg 指向方向，0 度为正右方，逆时针为正
 * @param {number} size 箭头大小
 */
export function arrowHead(x, y, angleDeg, size = 12) {
  const a = (angleDeg * Math.PI) / 180
  const spread = 24 * (Math.PI / 180)
  const back = size
  const bx = x - back * Math.cos(a)
  const by = y + back * Math.sin(a)
  const p1 = { x: bx + size * 0.5 * Math.cos(a + spread), y: by - size * 0.5 * Math.sin(a + spread) }
  const p2 = { x: bx + size * 0.5 * Math.cos(a - spread), y: by - size * 0.5 * Math.sin(a - spread) }
  return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`
}

/**
 * 圆柱投影的映射：经度 → x，纬度 → y。
 *
 * 横轴是经度，纵轴是纬度——讲义里「把地球沿经线剪开铺平」的那种图。
 *
 * @param {object} box 绘图区 { left, right, top, bottom }
 */
export function cylinderProjection(box) {
  return {
    x: (lon) => box.left + ((lon + 180) / 360) * (box.right - box.left),
    y: (lat) => box.top + ((90 - lat) / 180) * (box.bottom - box.top),
  }
}
