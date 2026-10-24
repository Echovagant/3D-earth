/**
 * §3.8 地转偏向力的大小与手势法：手势的方向、偏转方向与大小随纬度的变化。
 *
 * 讲义原话：手心朝上；**南半球用左手、北半球用右手**；
 * **四指 = 原始运动方向，拇指 = 偏转后方向**；赤道不偏。
 *
 * 几何上，手势与「右偏/左偏」是同一件事：
 *   右手手心朝上、四指指北 → 拇指指东（= 面朝北时的右手边 = 北半球的右偏）；
 *   左手手心朝上、四指指北 → 拇指指西（= 南半球的左偏）。
 * 所以「拇指方向」与「偏转方向」必须永远一致。
 */

/** 拇指相对四指的夹角（度） */
export const THUMB_OFFSET_DEG = 90

/**
 * 偏转方向：相对原运动方向偏多少度（数学角，逆时针为正）。
 *
 * 北半球向右偏 = 顺时针 = −90°；南半球向左偏 = 逆时针 = +90°；赤道不偏 = 0°。
 *
 * @param {'north'|'south'|'equator'} hemisphere
 */
export function deflectionAngle(hemisphere) {
  if (hemisphere === 'equator') return 0
  return hemisphere === 'north' ? -THUMB_OFFSET_DEG : THUMB_OFFSET_DEG
}

/**
 * 拇指指向的角度（数学角）。
 *
 * @param {number} fingersAngleDeg 四指（= 原运动方向）的角度
 * @param {'left'|'right'} handedness 右手（北半球）／左手（南半球）
 */
export function thumbAngle(fingersAngleDeg, handedness) {
  return handedness === 'right'
    ? fingersAngleDeg - THUMB_OFFSET_DEG
    : fingersAngleDeg + THUMB_OFFSET_DEG
}

/**
 * 手势的 SVG 变换。
 *
 * 基准手形画成「右手、手心朝向观者、四指指向 +x、拇指指向 +y（屏幕下方）」。
 * 四指要指到 angleDeg，就绕原点转 −angleDeg（SVG 的正角度是顺时针）；
 * 左手再沿 y 轴镜像一次。
 *
 * @param {number} x 手掌中心的落点
 * @param {number} y 手掌中心的落点
 * @param {number} angleDeg 四指指向（数学角，0 在正右方、逆时针为正）
 * @param {'left'|'right'} handedness
 */
export function handTransform(x, y, angleDeg, handedness) {
  const mirror = handedness === 'left' ? ' scale(1,-1)' : ''
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(-angleDeg).toFixed(2)})${mirror}`
}

/**
 * 地转偏向力的大小因子：F = 2mvω·sinφ。
 *
 * m、v、ω 一定时，F 随 sinφ 增大——与纬度正相关，赤道为 0。
 *
 * @param {number} latDeg 纬度（度）
 */
export function coriolisFactor(latDeg) {
  return Math.sin((latDeg * Math.PI) / 180)
}

/**
 * 几个典型纬度上的 sinφ（讲义的大小规律表）。
 *
 * @param {number[]} lats 纬度数组
 */
export function coriolisFactors(lats) {
  return lats.map((lat) => ({ lat, factor: coriolisFactor(lat) }))
}
