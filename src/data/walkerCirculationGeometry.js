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
 *
 * 环流不是三个割裂的定格状态：暖水堆位置可以取中线以外的任意值，
 * 海面倾斜、低层气流长度都随它连续变化（见 seaTiltAmount）。
 * 参数轴「东南信风强弱」经 warmPoolXFromTrade 映射到暖水堆位置，
 * 于是拖动参数时整个环流是连续变形的，而不是在两个状态之间跳。
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

/** 中线：暖水堆与冷水源重合的位置——环流在这里停摆 */
export const MIDLINE = 0.5

/**
 * 海面倾斜达到满幅所需的「暖水堆偏离中线的距离」。
 *
 * 取三个锚点状态里最小的那个（厄尔尼诺：|0.70 − 0.5| = 0.20）：
 * 这样正常年、拉尼娜、厄尔尼诺三张定格的倾斜幅度与原来完全一样，
 * 只有暖水堆靠近中线时海面才逐渐变平。
 */
export const TILT_FULL_SPREAD = 0.2

/** 低层气流停摆的判定：暖水堆离中线这么近就算停 */
export const STALL_EPS = 0.02

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
 * 东南信风强弱（−1 … +1）→ 暖水堆位置。
 *
 * 正值 = 信风增强，暖水被推到更西边（拉尼娜）；负值 = 信风偏弱，
 * 暖水回流到东边（厄尔尼诺）。两段线性，锚点：
 *   0 → 正常年 0.25，+1 → 拉尼娜 0.14，−1 → 厄尔尼诺 0.70。
 *
 * 弱信风那一段的斜率要带上负号：信风越弱，暖水越往东走。
 */
export function warmPoolXFromTrade(trade) {
  const t = clamp(trade, -1, 1)
  if (t >= 0) return WARM_POOL_X.normal + (WARM_POOL_X.lanina - WARM_POOL_X.normal) * t
  return WARM_POOL_X.normal + (WARM_POOL_X.elnino - WARM_POOL_X.normal) * -t
}

/**
 * 海面倾斜的幅度系数：0 = 停摆（海面是平的），1 = 满幅。
 *
 * 幅度只看暖水堆离中线多远，离得越远倾斜越厉害。
 * 用 smoothstep 而不是 min(1, x)：两端斜率都归零，
 * 拖参数时海面是渐入渐出地变平、翻面，不会出现折角。
 */
export function seaTiltAmount(warmPoolX) {
  const off = Math.abs(MIDLINE - clamp(warmPoolX, 0.02, 0.98))
  const x = Math.min(1, off / TILT_FULL_SPREAD)
  return x * x * (3 - 2 * x)
}

/**
 * 近地面气流的走向。
 *
 * 'west' = 自东向西（东南信风），'east' = 自西向东（反向），'stall' = 停摆。
 * 走向只由暖水堆位置决定：暖水在西 → 吹向西；暖水在东 → 吹向东。
 * 「信风向西、暖水在西」这条不变式就锁在这里——
 * 箭头方向要问几何要，别单独改箭头。
 */
export function surfaceFlowDirection(warmPoolX) {
  const warm = clamp(warmPoolX, 0.02, 0.98)
  if (Math.abs(warm - MIDLINE) <= STALL_EPS) return 'stall'
  return warm < MIDLINE ? 'west' : 'east'
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

  // 暖水一侧海面高（画布 y 小），冷水一侧海面低。
  // 幅度随暖水堆离开中线的距离连续变化：中线上环流停摆、海面是平的，
  // 越偏离中线越倾斜；两侧都是满幅，所以三个定格状态的倾斜与原来完全一样。
  const tiltAmount = seaTiltAmount(warm)
  const tilt = Math.sign(MIDLINE - warm) * tiltAmount * seaTilt
  const seaWestY = seaLevel - tilt
  const seaEastY = seaLevel + tilt

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
    /** 倾斜幅度系数 0…1（0 = 海面是平的） */
    tiltAmount,
    /** 带符号的倾斜量（画布像素，正 = 西边高） */
    tilt,
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
