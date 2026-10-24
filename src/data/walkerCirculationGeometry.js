/**
 * 沃克环流剖面图的几何。
 *
 * 横轴是太平洋——**西在左、东在右**；纵轴是高度（越往上越高）。
 *
 * 整个环流只由一个参数推出来：暖水堆在横向的哪个位置（warmPoolX，0 = 最西，1 = 最东）。
 * 其余全部由它推出，不手摆：
 *   · 上升支落在暖水池正上方（热源 → 热低 → 上升）
 *   · 下沉支落在冷水源上方（冷高 → 下沉）
 *   · 近地面气流由下沉支吹向上升支（高压 → 低压）
 *   · 高空气流由上升支流向下沉支
 *   · 海面在暖水一侧高、在冷水一侧低
 *
 * 于是「正常年」与「厄尔尼诺」只需换 warmPoolX，方向自动反过来：
 * 暖水在西 → 近地面箭头指向西；暖水在东 → 近地面箭头指向东。
 * 两个方向相反（信风向西、暖水在西）永远绑在一起，不会画反。
 */

/** 剖面绘图区（画布坐标） */
export const PLOT = { left: 100, right: 680, top: 74, bottom: 312 }

/** 平均海平面的画布 y（越小越高） */
export const SEA_LEVEL = 244

/** 海面倾斜幅度：暖水一侧高多少 */
export const SEA_TILT = 14

/** 暖水层的最大厚度 */
export const WARM_LAYER_THICKNESS = 74

/** 暖水层的横向影响范围（占绘图区宽度的比例） */
export const WARM_LAYER_SPREAD = 0.24

/**
 * 三个状态的暖水堆位置。
 *
 * 正常年暖水堆在西太平洋 → 上升支在西、下沉支在东、近地面箭头指向西。
 * 拉尼娜暖水更集中、更西，信风更强。
 * 厄尔尼诺暖水回流到东太平洋 → 上升支跑到东边、冷热源反转。
 */
export const WARM_POOL_X = {
  lanina: 0.14,
  normal: 0.25,
  elnino: 0.7,
}

/** 三个状态的文字说明 */
export const STATE_META = {
  lanina: {
    id: 'lanina',
    title: '拉尼娜',
    subtitle: '东南信风异常增强（PLUS 版）',
    trade: '东南信风异常增强',
    west: '西太平洋更暖更湿，暴雨、台风增多',
    east: '东太平洋更冷，下沉更强，更加干旱',
    china: '我国：南旱北涝、台风偏多、冷冬',
  },
  normal: {
    id: 'normal',
    title: '正常年（沃克环流）',
    subtitle: '太平洋上空的热力环流',
    trade: '东南信风（自东向西）',
    west: '西太平洋热源：上升、降水',
    east: '东太平洋冷源：下沉、晴朗干旱',
    china: '判别口诀：东冷西热，东沉西升',
  },
  elnino: {
    id: 'elnino',
    title: '厄尔尼诺',
    subtitle: '东南信风异常偏弱（反转版）',
    trade: '信风异常偏弱 → 低层气流反向',
    west: '西太平洋下沉转晴：旱灾、森林火灾',
    east: '东太平洋上升转暖：阴雨、洪涝',
    china: '我国：北旱南涝、台风偏少、暖冬',
  },
}

/** 把数值夹在区间内 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * 从 (x1, y1) 到 (x2, y2) 的方向角。
 * 0° 向右，90° 向上，逆时针为正——与 svgParts 的 arrowHead 一致。
 */
export function directionAngle(x1, y1, x2, y2) {
  return (Math.atan2(-(y2 - y1), x2 - x1) * 180) / Math.PI
}

/**
 * 由暖水堆位置推出整个沃克环流。
 *
 * @param {number} warmPoolX 暖水堆的横向位置，0 = 最西，1 = 最东
 * @param {object} [box] 绘图区，默认 PLOT
 * @param {object} [opts] { seaLevel, seaTilt, warmThickness }——小图要把海平面一起缩小
 */
export function walkerCirculation(warmPoolX, box = PLOT, opts = {}) {
  const { left, right, top } = box
  const seaLevel = opts.seaLevel ?? SEA_LEVEL
  const seaTilt = opts.seaTilt ?? SEA_TILT
  const warmThickness = opts.warmThickness ?? WARM_LAYER_THICKNESS
  const warm = clamp(warmPoolX, 0.02, 0.98)
  const cold = 1 - warm

  const warmX = left + warm * (right - left)
  const coldX = left + cold * (right - left)

  // 暖水一侧海面高（画布 y 小），冷水一侧海面低
  const tilt = warm < 0.5 ? 1 : -1
  const seaWestY = seaLevel - tilt * seaTilt
  const seaEastY = seaLevel + tilt * seaTilt

  /** 某一点处的海面高度（线性倾斜） */
  const seaY = (x) => seaWestY + ((x - left) / (right - left)) * (seaEastY - seaWestY)

  /** 暖水层在某一点处的厚度：暖水池正下方最厚，两端趋近于 0 */
  const sigma = WARM_LAYER_SPREAD * (right - left)
  const layerThickness = (x) =>
    warmThickness * Math.exp(-((x - warmX) ** 2) / (2 * sigma * sigma))

  return {
    box,
    warmPoolX: warm,
    warmX,
    coldX,
    /** 上升支（热源上方） */
    rise: { x: warmX, y1: seaY(warmX), y2: top },
    /** 下沉支（冷源上方） */
    sink: { x: coldX, y1: top, y2: seaY(coldX) },
    /** 近地面气流：下沉支 → 上升支（高压吹向低压） */
    surfaceFlow: { fromX: coldX, toX: warmX },
    /** 高空气流：上升支 → 下沉支 */
    upperFlow: { fromX: warmX, toX: coldX },
    seaWestY,
    seaEastY,
    seaY,
    layerThickness,
  }
}

/**
 * 暖水层下边界（温跃层）的采样点——暖水层画成一块透镜形。
 */
export function warmLayerPoints(circulation, steps = 48) {
  const { left, right } = circulation.box
  const points = []
  for (let i = 0; i <= steps; i += 1) {
    const x = left + ((right - left) * i) / steps
    points.push({ x, y: circulation.seaY(x) + circulation.layerThickness(x) })
  }
  return points
}
