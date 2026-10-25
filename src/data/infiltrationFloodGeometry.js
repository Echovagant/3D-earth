/**
 * §11.4 下渗剖面的几何。
 *
 * 讲义里影响下渗的是四类条件，方向全部指向「下渗↑」：
 *   降水强度↓、坡度缓、植被覆盖率高、岩层透水。
 *
 * 特别注意：降水强度与下渗成**负相关**——不是「雨下得越多渗得越多」。
 * 所以条形图里的长度必须按百分比**成正比**算出来，不能随手画。
 */

/**
 * 剖面竖向位置（画布 y）。
 *
 * 这几个数是**一套**：地面线、可透水土层底、不透水岩层底、地下水位
 * 必须对得上——地下水位要落在可透水土层里，落到岩层里就是画错了。
 */
export const PROFILE = {
  skyTop: 36,
  surfaceY: 168,
  soilBottomY: 264,
  bedrockBottomY: 316,
  waterTableY: 236,
  left: 60,
  right: 660,
}

/**
 * 影响下渗的四类条件（讲义原话的方向）。
 * `effect` 是这条条件推动的结果，四个都是「下渗↑」。
 */
export const INFILTRATION_FACTORS = [
  { id: 'intensity', label: '降水强度↓', effect: '下渗↑', note: '雨太急，水来不及渗就冲走了' },
  { id: 'slope', label: '坡度缓', effect: '下渗↑', note: '坡陡流速快，水没空往土里钻' },
  { id: 'vegetation', label: '植被覆盖率高', effect: '下渗↑', note: '树叶拦一下、减速一下' },
  { id: 'permeability', label: '岩层透水', effect: '下渗↑', note: '不透水岩层上根本不下渗' },
]

/**
 * 讲义里的真实例题数据（§11.4 题型一）：
 * 自然路面与城市路面的下渗占比——自然路面 25%，浅城 10%，深城 5%。
 */
export const INFILTRATION_SHARE = {
  natural: 25,
  shallowUrban: 10,
  deepUrban: 5,
}

/**
 * 下渗占比条的长度：百分比 → 像素宽度（严格成正比）。
 *
 * @param {number} percent 占比百分数
 * @param {number} width 满量程对应的像素宽度
 * @param {number} [scaleMax] 满量程按多少百分比算，默认 100
 */
export function shareBar(percent, width, scaleMax = 100) {
  return (percent / scaleMax) * width
}

/**
 * 下渗箭头的长度：按占比折算，长短一眼可比。
 *
 * @param {number} percent 下渗占比百分数
 * @param {number} maxLength 满量程时的箭头长度
 * @param {number} [scaleMax] 满量程按多少百分比算，默认 100
 * @param {number} [minLength] 占比为 0 时的箭头长度（留一小截，否则看不出方向）
 */
export function infiltrationArrowLength(percent, maxLength, scaleMax = 100, minLength = 0) {
  return minLength + (percent / scaleMax) * (maxLength - minLength)
}

/**
 * 城市内涝的成因链：硬化路面 → 下渗↓ → 地下径流↓ → 地表径流↑ → 地表积水。
 */
export const FLOOD_CHAIN = [
  { id: 'paving', label: '硬化路面', kind: 'start' },
  { id: 'infiltration', label: '下渗↓', kind: 'down' },
  { id: 'groundwater', label: '地下径流↓', kind: 'down' },
  { id: 'runoff', label: '地表径流↑', kind: 'up' },
  { id: 'ponding', label: '地表积水', kind: 'end' },
]

/**
 * 四条应对措施（讲义：思路统一——增加下渗）。
 */
export const SOLUTIONS = [
  { id: 'sponge', label: '海绵城市', note: '地面像海绵一样吸水' },
  { id: 'roof', label: '屋顶花园', note: '屋顶的雨直接下渗' },
  { id: 'brick', label: '透水砖', note: '带缝隙，替代不透水地砖' },
  { id: 'swale', label: '植草沟', note: '施工量小、节约成本' },
]

/** 城市硬化路面的厚度（画布单位） */
export const PAVEMENT_THICKNESS = 12

/**
 * 剖面各层的厚度与埋深（画布单位）。
 *
 * 用来核对剖面画得对不对：地下水位必须落在可透水土层里，
 * 落到岩层里就是画错了。
 */
export function profileLayers(profile = PROFILE) {
  return {
    soil: profile.soilBottomY - profile.surfaceY,
    bedrock: profile.bedrockBottomY - profile.soilBottomY,
    depthToWaterTable: profile.waterTableY - profile.surfaceY,
    waterTableAboveBedrock: profile.soilBottomY - profile.waterTableY,
  }
}

/**
 * 下渗占比之间的差与倍数（讲义数据之间的对比）。
 *
 * 「自然路面比深城高 20 个百分点」「深城只有自然路面的五分之一」，
 * 这些话由它算出来，不手写。
 */
export function shareComparison(share = INFILTRATION_SHARE) {
  return {
    naturalVsShallow: share.natural - share.shallowUrban,
    shallowVsDeep: share.shallowUrban - share.deepUrban,
    naturalOverDeep: share.natural / share.deepUrban,
  }
}
