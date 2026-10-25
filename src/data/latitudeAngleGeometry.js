/**
 * 纬度的几何定义（§2.5 纬度：它是怎样定出来的）。
 *
 * 纬度 = 线面角：
 *   线 = 地面上某点与地心的连线
 *   面 = 赤道平面（赤道这条纬线所在的平面）
 *   角 = 这条线与这个面的夹角
 *
 * 要在纸面上把这个角量准，取的点必须落在「观察者视线的侧平面」里
 * ——也就是侧视图上球的边缘那一圈。这样从地心到点的半径长度不变、
 * 朝向不变，量出来的角就是真纬度（赤道 0°，极点 90°）。
 *
 * 赤道面在侧视图上画成一个扁椭圆盘：长半轴 = 球半径，
 * 短半轴 = 球半径 × sin(视角仰角)，用 EQUATOR_SQUASH 定这个系数。
 */

/** 赤道面画成扁椭圆盘时的短轴系数（sin 视角仰角） */
export const EQUATOR_SQUASH = 0.3

/** 侧视图边缘上（侧平面内）某个纬度对应的点 */
export function limbPoint(lat, cx, cy, radius) {
  const a = (lat * Math.PI) / 180
  return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) }
}

/**
 * 垂足：点在赤道平面上的正投影。
 * 它既在赤道面里、也在屏幕平面里，所以「地心→垂足」这条线段与半径的
 * 夹角就是线面角，画在纸上不会变形。
 */
export function planeFoot(lat, cx, cy, radius) {
  const a = (lat * Math.PI) / 180
  return { x: cx + radius * Math.cos(a), y: cy }
}

/** 线面角 = 纬度 */
export function latitudeAngleDeg(lat) {
  return lat
}

/**
 * 直角三角形 △OFP 的两条直角边。
 *
 * O 是地心、P 是地面上的点、F 是 P 在赤道平面上的垂足：
 *   OF = R·cosφ（半径在面内的射影）
 *   FP = R·sinφ（P 离开赤道平面的高度）
 * 于是 ∠FOP = φ 就是线面角。
 */
export function planeTriangleSides(lat, radius) {
  const a = (lat * Math.PI) / 180
  return { of: radius * Math.cos(a), fp: radius * Math.sin(a) }
}

/**
 * 赤道面（扁椭圆盘）近处的半圈：近处这一半挡在球前面。
 * 路径不闭合——填充时浏览器会自动闭合，描边时不会多画那条直径。
 */
export function equatorPlaneFront(cx, cy, radius, squash = EQUATOR_SQUASH) {
  const ry = radius * squash
  return `M ${cx - radius} ${cy} A ${radius} ${ry.toFixed(2)} 0 0 0 ${cx + radius} ${cy}`
}

/** 赤道面（扁椭圆盘）远处那一半：被球挡住，用虚线示意 */
export function equatorPlaneBack(cx, cy, radius, squash = EQUATOR_SQUASH) {
  const ry = radius * squash
  return `M ${cx - radius} ${cy} A ${radius} ${ry.toFixed(2)} 0 0 1 ${cx + radius} ${cy}`
}
