/**
 * §11.15 海气相互作用的示意几何。
 *
 * 讲义里只有两条通道：
 *   水分交换——海洋蒸发给大气水汽，大气降水还给海洋（合起来是海上内循环）；
 *   热量交换——潜热（蒸发吸热、凝结放热）+ 长波辐射。
 *
 * 箭头方向必须与解说一致：蒸发向上、降水向下、海洋给大气热量、
 * 大气给海洋动力（风）。位置与方向在这里算好。
 */

/** 画面底盘：海面、云、陆地 */
export const STAGE = {
  seaSurfaceY: 282,
  seaBottomY: 330,
  seaLeft: 40,
  seaRight: 500,
  cloudY: 92,
  landTopY: 232,
  landLeft: 500,
  landRight: 690,
}

/** 云：几团椭圆拼出来 */
export const CLOUD = {
  x: 320,
  y: 92,
  blobs: [
    { cx: 250, cy: 100, rx: 40, ry: 22 },
    { cx: 300, cy: 86, rx: 48, ry: 28 },
    { cx: 358, cy: 92, rx: 44, ry: 25 },
    { cx: 392, cy: 104, rx: 32, ry: 18 },
  ],
}

/**
 * 水分交换的一圈：海洋 → 大气 → 海洋。
 * 每条都标出这一步是吸热还是放热。
 */
export const WATER_LOOP = [
  {
    id: 'evaporation',
    label: '蒸发',
    heat: '吸热',
    from: { x: 150, y: 282 },
    to: { x: 150, y: 120 },
  },
  {
    id: 'condensation',
    label: '凝结成云',
    heat: '放热',
    from: { x: 164, y: 118 },
    to: { x: 232, y: 104 },
  },
  {
    id: 'precipitation-sea',
    label: '降水（落回海面）',
    heat: '',
    from: { x: 300, y: 118 },
    to: { x: 300, y: 274 },
  },
  {
    id: 'precipitation-land',
    label: '降水（到陆地）',
    heat: '',
    from: { x: 392, y: 118 },
    to: { x: 540, y: 224 },
  },
]

/**
 * 热量通道：海洋把热量交给大气的两条路。
 */
export const HEAT_CHANNELS = [
  {
    id: 'latent',
    label: '潜热输送',
    detail: '蒸发吸热 → 海面降温；凝结放热 → 大气增温',
    note: '水分交换的同时，把热量「偷偷摸摸」运上去',
  },
  {
    id: 'longwave',
    label: '长波辐射',
    detail: '海面把热量以长波辐射交给大气',
    note: '海面温度越高，释放的长波辐射越多',
  },
]

/**
 * 热量与动力的方向：这是本节最常被记反的一对。
 */
export const EXCHANGE_DIRECTION = {
  toAtmosphere: { from: '海洋', to: '大气', what: '热量（热力因素）' },
  toOcean: { from: '大气', to: '海洋', what: '动力（风）' },
}

/** 海洋里到底存了多少热：讲义给的结论 */
export const HEAT_STORAGE = {
  percent: 85,
  text: '海洋吸收了到达地表太阳辐射的大部分，其中 85% 的热量储存在海洋表层',
  conclusion: '海洋是大气最主要的热量储存库，大气温度主要来自海洋',
}

/**
 * 从 (x1, y1) 到 (x2, y2) 的方向角。
 * 0° 向右，90° 向上，逆时针为正——与 svgParts 的 arrowHead 一致。
 */
export function directionAngle(x1, y1, x2, y2) {
  return (Math.atan2(-(y2 - y1), x2 - x1) * 180) / Math.PI
}
