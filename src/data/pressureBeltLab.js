/**
 * 气压带与风带互动实验：事实数据、季节移动规则、判据文案。
 *
 * 这里只放结构化的地理事实（纬度区间、成因、天气、气候、风向、干湿）
 * 和自己撰写的判据与易错提示，不搬运讲义正文。
 *
 * 三条硬约束，测试里有对应断言守住：
 *   ① 气压带 7 个、风带 6 个，相间分布——气压带两侧一定是风带。
 *   ② 南北半球同纬度带的位置、天气、气候一致，只有风向相反。
 *   ③ 只有副热带高气压带允许简称「副高」。
 */

/** 气压带总数：赤道低压 ×1、副热带高压 ×2、副极地低压 ×2、极地高压 ×2 */
export const PRESSURE_BELT_TOTAL = 7

/** 风带总数：信风 ×2、盛行西风 ×2、极地东风 ×2 */
export const WIND_BELT_TOTAL = 6

/** 太阳直射点的最南 / 最北纬度（南北回归线） */
export const SUBSOLAR_LIMIT = 23.5

/**
 * 季节移动的示意比例：直射点移动 1°，整组气压带风带跟着移动 0.2°。
 *
 * 这是画图用的示意参数，不是地理常数——地球上各带的实际位移并不相等。
 * 取这个比例是为了在一年里画出「北半球夏至整组北移、冬至整组南移」，
 * 同时让极地一端的带子始终留在地球上。
 */
export const SHIFT_RATIO = 0.2

/** 极地高气压带在极点处保留的最小绘图宽度（度），保证它还能被点中 */
export const POLAR_CAP_MIN_DEG = 3

/**
 * 气压带（7 个）。
 *
 * latFrom / latTo 是春秋分（直射点 δ = 0）时的纬度区间，赤道以南为负；
 * centerLat 是该带的中心纬度；polarRole 标记贴着极点的两个带：
 *   cap     —— 极地高气压带（极点一侧钉在极点上）
 *   easterly—— 极地东风带（靠极点一侧停在极地高气压带的边上，两段始终相接）
 */
export const PRESSURE_BELTS = [
  {
    id: 'equatorial-low',
    name: '赤道低气压带（跨赤道）',
    shortLabel: '赤道低压',
    kind: 'pressure',
    hemisphere: 'both',
    pairKey: 'equatorial-low',
    pairName: '赤道低气压带',
    centerLat: 0,
    latFrom: -5,
    latTo: 5,
    positionText: '0° 为中心，南北各约 5°',
    causeType: '热力因素',
    cause: '地面受热膨胀，空气受热上升',
    vertical: '上升',
    weather: '多阴雨',
    climate: '热湿',
    nearbyWind: '少风／无风（赤道无风带）',
    shortName: null,
    shortNameAllowed: false,
    keywords: ['终年高温', '上升气流', '受热膨胀', '赤道'],
    pitfallIds: ['cause'],
  },
  {
    id: 'subtropical-high-n',
    name: '副热带高气压带（北半球）',
    shortLabel: '副热带高压',
    kind: 'pressure',
    hemisphere: 'north',
    pairKey: 'subtropical-high',
    pairName: '副热带高气压带',
    centerLat: 30,
    latFrom: 25,
    latTo: 35,
    positionText: '以 30°N 为对称，约 25°–35°N',
    causeType: '动力因素',
    cause: '高空西风堆积，气流被挤下沉',
    vertical: '下沉',
    weather: '晴',
    climate: '热干',
    nearbyWind: '少风／无风（马纬度）',
    shortName: '副高',
    shortNameAllowed: true,
    keywords: ['30°', '下沉气流', '动力因素', '堆积', '晴朗少雨'],
    pitfallIds: ['shortname', 'cause'],
  },
  {
    id: 'subtropical-high-s',
    name: '副热带高气压带（南半球）',
    shortLabel: '副热带高压',
    kind: 'pressure',
    hemisphere: 'south',
    pairKey: 'subtropical-high',
    pairName: '副热带高气压带',
    centerLat: -30,
    latFrom: -35,
    latTo: -25,
    positionText: '以 30°S 为对称，约 25°–35°S',
    causeType: '动力因素',
    cause: '高空西风堆积，气流被挤下沉',
    vertical: '下沉',
    weather: '晴',
    climate: '热干',
    nearbyWind: '少风／无风（马纬度）',
    shortName: '副高',
    shortNameAllowed: true,
    keywords: ['30°', '下沉气流', '动力因素', '堆积', '晴朗少雨'],
    pitfallIds: ['shortname', 'cause'],
  },
  {
    id: 'subpolar-low-n',
    name: '副极地低气压带（北半球）',
    shortLabel: '副极地低压',
    kind: 'pressure',
    hemisphere: 'north',
    pairKey: 'subpolar-low',
    pairName: '副极地低气压带',
    centerLat: 60,
    latFrom: 55,
    latTo: 65,
    positionText: '以 60°N 为对称，约 55°–65°N',
    causeType: '动力因素',
    cause: '冷暖气流相遇，暖气流被迫抬升',
    vertical: '上升',
    weather: '多阴雨',
    climate: '温湿',
    nearbyWind: '少风',
    shortName: null,
    shortNameAllowed: false,
    keywords: ['60°', '冷暖气流相遇', '暖气流抬升', '阴雨'],
    pitfallIds: ['subpolar-climate'],
  },
  {
    id: 'subpolar-low-s',
    name: '副极地低气压带（南半球）',
    shortLabel: '副极地低压',
    kind: 'pressure',
    hemisphere: 'south',
    pairKey: 'subpolar-low',
    pairName: '副极地低气压带',
    centerLat: -60,
    latFrom: -65,
    latTo: -55,
    positionText: '以 60°S 为对称，约 55°–65°S',
    causeType: '动力因素',
    cause: '冷暖气流相遇，暖气流被迫抬升',
    vertical: '上升',
    weather: '多阴雨',
    climate: '温湿',
    nearbyWind: '少风',
    shortName: null,
    shortNameAllowed: false,
    keywords: ['60°', '冷暖气流相遇', '暖气流抬升', '阴雨'],
    pitfallIds: ['subpolar-climate'],
  },
  {
    id: 'polar-high-n',
    name: '极地高气压带（北半球）',
    shortLabel: '极地高压',
    kind: 'pressure',
    hemisphere: 'north',
    pairKey: 'polar-high',
    pairName: '极地高气压带',
    centerLat: 87.5,
    latFrom: 85,
    latTo: 90,
    positionText: '90° 附近（极地）',
    causeType: '热力因素',
    cause: '极地冷却，空气收缩下沉',
    vertical: '下沉',
    weather: '晴',
    climate: '冷干',
    nearbyWind: '少风／无风',
    shortName: null,
    shortNameAllowed: false,
    polarRole: 'cap',
    keywords: ['90°', '极地', '冷却收缩', '下沉气流', '晴朗'],
    pitfallIds: ['cause'],
  },
  {
    id: 'polar-high-s',
    name: '极地高气压带（南半球）',
    shortLabel: '极地高压',
    kind: 'pressure',
    hemisphere: 'south',
    pairKey: 'polar-high',
    pairName: '极地高气压带',
    centerLat: -87.5,
    latFrom: -90,
    latTo: -85,
    positionText: '90° 附近（南极）',
    causeType: '热力因素',
    cause: '极地冷却，空气收缩下沉',
    vertical: '下沉',
    weather: '晴',
    climate: '冷干',
    nearbyWind: '少风／无风',
    shortName: null,
    shortNameAllowed: false,
    polarRole: 'cap',
    keywords: ['90°', '极地', '冷却收缩', '下沉气流', '晴朗'],
    pitfallIds: ['cause'],
  },
]

/**
 * 风带（6 个）。
 *
 * flow 是气流前进方向的两个分量：
 *   lon —— 东西分量，正值向东、负值向西；
 *   lat —— 南北分量，正值向北、负值向南。
 * 南北半球同一纬度带的经向分量相同、南北分量相反，
 * 这就是「北半球偏右、南半球偏左（北撇南捺）」的写法。
 */
export const WIND_BELTS = [
  {
    id: 'trade-n',
    name: '信风带（北半球）',
    shortLabel: '信风带',
    kind: 'wind',
    hemisphere: 'north',
    pairKey: 'trade',
    pairName: '信风带',
    centerLat: 15,
    latFrom: 5,
    latTo: 25,
    positionText: '0°–30°（约 5°–25°N）',
    windName: '东北信风',
    windFrom: '东北',
    flow: { lon: -1, lat: -1 },
    heat: '偏热',
    moisture: '偏干',
    thermalMoisture: '热干',
    mechanism: '由高纬吹向低纬（冷遇热），水汽不易凝结，反更易蒸发',
    precipitation: '少雨',
    keywords: ['信风', '由高纬吹向低纬', '偏热', '偏干', '少雨'],
    pitfallIds: ['trade-heat', 'scale'],
  },
  {
    id: 'trade-s',
    name: '信风带（南半球）',
    shortLabel: '信风带',
    kind: 'wind',
    hemisphere: 'south',
    pairKey: 'trade',
    pairName: '信风带',
    centerLat: -15,
    latFrom: -25,
    latTo: -5,
    positionText: '0°–30°（约 5°–25°S）',
    windName: '东南信风',
    windFrom: '东南',
    flow: { lon: -1, lat: 1 },
    heat: '偏热',
    moisture: '偏干',
    thermalMoisture: '热干',
    mechanism: '由高纬吹向低纬（冷遇热），水汽不易凝结，反更易蒸发',
    precipitation: '少雨',
    keywords: ['信风', '由高纬吹向低纬', '偏热', '偏干', '少雨'],
    pitfallIds: ['trade-heat', 'scale'],
  },
  {
    id: 'westerly-n',
    name: '盛行西风带（北半球）',
    shortLabel: '盛行西风带',
    kind: 'wind',
    hemisphere: 'north',
    pairKey: 'westerly',
    pairName: '盛行西风带',
    centerLat: 45,
    latFrom: 35,
    latTo: 55,
    positionText: '30°–60°（约 35°–55°N）',
    windName: '西南风',
    windFrom: '西南',
    flow: { lon: 1, lat: 1 },
    heat: '偏温',
    moisture: '偏湿',
    thermalMoisture: '温湿',
    mechanism: '由低纬吹向高纬，越吹越冷，水汽易凝结成云致雨',
    precipitation: '多雨',
    keywords: ['西风', '由低纬吹向高纬', '越吹越冷', '多雨', '偏温偏湿'],
    pitfallIds: [],
  },
  {
    id: 'westerly-s',
    name: '盛行西风带（南半球）',
    shortLabel: '盛行西风带',
    kind: 'wind',
    hemisphere: 'south',
    pairKey: 'westerly',
    pairName: '盛行西风带',
    centerLat: -45,
    latFrom: -55,
    latTo: -35,
    positionText: '30°–60°（约 35°–55°S）',
    windName: '西北风',
    windFrom: '西北',
    flow: { lon: 1, lat: -1 },
    heat: '偏温',
    moisture: '偏湿',
    thermalMoisture: '温湿',
    mechanism: '由低纬吹向高纬，越吹越冷，水汽易凝结成云致雨',
    precipitation: '多雨',
    keywords: ['西风', '由低纬吹向高纬', '越吹越冷', '多雨', '偏温偏湿'],
    pitfallIds: [],
  },
  {
    id: 'polar-easterly-n',
    name: '极地东风带（北半球）',
    shortLabel: '极地东风带',
    kind: 'wind',
    hemisphere: 'north',
    pairKey: 'polar-easterly',
    pairName: '极地东风带',
    centerLat: 75,
    latFrom: 65,
    latTo: 85,
    positionText: '60°–90°（约 65°–90°N）',
    windName: '东北风',
    windFrom: '东北',
    flow: { lon: -1, lat: -1 },
    heat: '偏冷',
    moisture: '偏干',
    thermalMoisture: '冷干',
    mechanism: '由高纬吹向低纬（冷遇热），水汽不易凝结',
    precipitation: '少雨',
    polarRole: 'easterly',
    keywords: ['东风', '由高纬吹向低纬', '偏冷', '偏干', '少雨'],
    pitfallIds: ['trade-heat'],
  },
  {
    id: 'polar-easterly-s',
    name: '极地东风带（南半球）',
    shortLabel: '极地东风带',
    kind: 'wind',
    hemisphere: 'south',
    pairKey: 'polar-easterly',
    pairName: '极地东风带',
    centerLat: -75,
    latFrom: -85,
    latTo: -65,
    positionText: '60°–90°（约 65°–90°S）',
    windName: '东南风',
    windFrom: '东南',
    flow: { lon: -1, lat: 1 },
    heat: '偏冷',
    moisture: '偏干',
    thermalMoisture: '冷干',
    mechanism: '由高纬吹向低纬（冷遇热），水汽不易凝结',
    precipitation: '少雨',
    polarRole: 'easterly',
    keywords: ['东风', '由高纬吹向低纬', '偏冷', '偏干', '少雨'],
    pitfallIds: ['trade-heat'],
  },
]

/** 节气与太阳直射点纬度 */
export const SEASONS = [
  { id: 'spring', name: '春分', delta: 0, note: '直射赤道，气压带风带在春秋分的基准位置' },
  { id: 'summer', name: '夏至', delta: 23.5, note: '直射北回归线，整组气压带风带北移' },
  { id: 'autumn', name: '秋分', delta: 0, note: '直射赤道，位置回到基准' },
  { id: 'winter', name: '冬至', delta: -23.5, note: '直射南回归线，整组气压带风带南移' },
]

/** 简称规则：只有副热带高气压带可以这样叫 */
export const SHORT_NAME_RULE = '只有**副热带高气压带**可以简称「副高」，其余气压带没有通用简称。'

/** 分布规则：气压带与风带相间分布 */
export const ALTERNATION_RULE =
  '气压带与风带**相间分布**：每个气压带的两侧一定是风带，所以「气压带两侧一定是风带」。'

/** 风向规则：南北半球相反 */
export const WIND_DEFLECTION_RULE =
  '南北半球的环流结构完全一致，只有风向相反：**北半球向右偏，南半球向左偏**（北撇南捺）。'

/** 判据关键词表：带 → 描述这个带时最常出现的说法 */
export const JUDGE_KEYWORDS = Object.fromEntries(
  [...PRESSURE_BELTS, ...WIND_BELTS].map((belt) => [belt.id, belt.keywords ?? []]),
)

/** 常见误区与纠正提示（文案自撰，不照搬讲义） */
export const COMMON_MISTAKES = [
  {
    id: 'order',
    title: '记气压带顺序不分方向',
    text: '从赤道往两极数气压带，顺序不分南北、不分方向：**赤道低压 → 副热带高压 → 副极地低压 → 极地高压**。',
    fix: '记成一条从赤道向两极展开的带子链，就不用再管当前看的是哪个半球。',
  },
  {
    id: 'hemisphere',
    title: '以为南北半球气压带不同',
    text: '气压带、风带在南北半球**完全对称**：位置、天气、气候都一样，**只有风向相反**。',
    fix: '对照南北两半球时，只盯风向这一项；其余字段出现差异就说明记错了。',
  },
  {
    id: 'cause',
    title: '用冷热反推高低压',
    text: '高低压由**成因**决定，不由冷热推出：热力因素（受热上升 / 冷却下沉）与动力因素（堆积下沉 / 相遇抬升）各管一半。',
    fix: '判断高低压先问「为什么」，再问「冷、热、干、湿」；冷热是结果，不是原因。',
  },
  {
    id: 'shortname',
    title: '给气压带乱用简称',
    text: '七个气压带里**只有副热带高气压带可以简称「副高」**，其余不能随手缩写。',
    fix: '看到「副高」就默认指副热带高气压带；其他带一律写全称。',
  },
  {
    id: 'subpolar-climate',
    title: '把副极地低气压带写成「冷湿」',
    text: '副极地低气压带在 60° 附近，上升多雨，气候是**温湿**，不是冷湿。',
    fix: '60° 附近的纬度决定它偏温，上升气流决定它偏湿，两个字合起来是「温湿」。',
  },
  {
    id: 'trade-heat',
    title: '认为信风一定是「冷干」',
    text: '信风在低纬吹，实际是**热干**：干湿看「冷遇热还是热遇冷」（冷遇热 → 干），冷热看所在纬度（低纬 → 热）。',
    fix: '同样是「由高纬吹向低纬」，低纬的信风是热干，高纬的极地东风是冷干。',
  },
  {
    id: 'scale',
    title: '忽略尺度：海陆带来的差异',
    text: '信风「偏干」说的是宏观格局。从海上吹来的信风是**湿润**的，从陆地吹来的信风才**干燥**。',
    fix: '遇到具体地点，要先看它离海多远，再判断干湿。',
  },
]

/**
 * 反向练习：给一段描述，让学生选出对应的带。
 *
 * wrong 里逐个选项写纠正提示（说明判据），wrongDefault 是兜底提示。
 */
export const QUIZ_ITEMS = [
  {
    id: 'hot-rain',
    prompt: '某地终年高温多雨，空气盛行上升。这属于哪一带？',
    options: ['equatorial-low', 'subtropical-high-n', 'subpolar-low-n', 'polar-high-n'],
    answerId: 'equatorial-low',
    explain:
      '终年高温 + 上升气流 ⇒ 受热膨胀上升的**热力因素** ⇒ **赤道低气压带**。它的天气是多阴雨、气候热湿，附近是赤道无风带。',
    wrong: {
      'subtropical-high-n':
        '副热带高气压带是**下沉**气流、晴朗少雨，与「上升多雨」正好相反。判据先看垂直运动。',
      'subpolar-low-n':
        '副极地低气压带也上升多雨，但它的气候是**温湿**（60° 附近），不是终年高温。',
      'polar-high-n':
        '极地高气压带虽然也是热力因素，但气流**下沉**、天气晴、气候冷干。',
    },
    wrongDefault: '先看垂直运动与温度：上升 + 终年高温 ⇒ 赤道低气压带。',
  },
  {
    id: 'subsidence-30',
    prompt: '某地位在 30° 附近，盛行下沉气流，晴朗少雨。这是什么带？',
    options: ['subtropical-high-n', 'equatorial-low', 'subpolar-low-n', 'trade-n'],
    answerId: 'subtropical-high-n',
    explain:
      '30° 附近 + 下沉 ⇒ 高空西风堆积被挤下沉，是**动力因素**形成的**副热带高气压带**。它是唯一可以简称「副高」的气压带，附近少风无风（马纬度）。',
    wrong: {
      'equatorial-low': '赤道低气压带是**上升**气流、多阴雨，与「下沉、晴朗」相反。',
      'subpolar-low-n': '副极地低气压带在 60° 附近，也是**上升**气流，不是 30° 附近的下沉带。',
      'trade-n': '信风带是**风带**（0°–30° 的低纬）；以 30° 为中心的那条是副热带高气压带。',
    },
    wrongDefault: '位置 30° + 下沉气流 ⇒ 副热带高气压带。',
  },
  {
    id: 'wet-westerly',
    prompt: '北半球 30°–60° 之间的风带，越往高纬越冷，水汽凝结成云，降水多。',
    options: ['westerly-n', 'trade-n', 'polar-easterly-n', 'polar-high-n'],
    answerId: 'westerly-n',
    explain:
      '由低纬吹向高纬、越吹越冷 ⇒ **盛行西风带**（北半球吹西南风）。它的热量偏温、干湿偏湿，主导降水多雨。',
    wrong: {
      'trade-n': '信风带是**由高纬吹向低纬**（冷遇热），水汽不易凝结、降水少，与描述相反。',
      'polar-easterly-n':
        '极地东风带在 60°–90°，由高纬吹向低纬、偏冷偏干、少雨；「30°–60°」和「越吹越冷」都不对。',
      'polar-high-n': '极地高气压带是**气压带**，而且在 90° 附近。',
    },
    wrongDefault: '判据：低纬吹向高纬 + 越吹越冷 + 多雨 ⇒ 盛行西风带。',
  },
  {
    id: 'trade-heat',
    prompt: '低纬度的风带，由高纬吹向低纬，越吹越热，降水少。它是哪一带？',
    options: ['trade-n', 'polar-easterly-n', 'westerly-n', 'subpolar-low-n'],
    answerId: 'trade-n',
    explain:
      '由高纬吹向低纬、越吹越热 ⇒ **信风带**。干湿看「冷遇热还是热遇冷」：冷遇热的水汽不易凝结，所以**偏干**；冷热看所在纬度：它在低纬，所以**偏热**。合起来是**热干**，不是冷干。',
    wrong: {
      'polar-easterly-n':
        '极地东风带才是**偏冷偏干**：它同样由高纬吹向低纬，但所在纬度高。信风带在低纬，是**热干**。',
      'westerly-n': '盛行西风带是**偏温偏湿**：由低纬吹向高纬，越吹越冷，水汽易凝结。',
      'subpolar-low-n': '副极地低气压带是**气压带**（60° 附近，上升多雨），不是这条风带。',
    },
    wrongDefault: '干湿看冷遇热/热遇冷，冷热看所在纬度：低纬 + 冷遇热 ⇒ 热干。',
  },
  {
    id: 'polar-down',
    prompt: '90° 附近，空气冷却收缩下沉，天气晴朗。这是什么成因的气压带？',
    options: ['polar-high-n', 'subpolar-low-n', 'equatorial-low', 'polar-easterly-n'],
    answerId: 'polar-high-n',
    explain:
      '极地冷却、空气收缩下沉 ⇒ **热力因素** ⇒ **极地高气压带**（90° 附近）。天气晴、气候冷干、附近少风。',
    wrong: {
      'subpolar-low-n': '副极地低气压带在 60° 附近，是冷暖气流相遇形成的**动力因素**，气流上升、阴雨。',
      'equatorial-low': '赤道低气压带也是**热力因素**，但成因是受热膨胀上升、天气多阴雨；极地是冷却收缩下沉。',
      'polar-easterly-n': '极地东风带是**风带**，出现在 60°–90°，不是 90° 附近的气压带。',
    },
    wrongDefault: '90° 附近 + 冷却收缩下沉 ⇒ 极地高气压带（热力因素）。',
  },
  {
    id: 'subpolar-up',
    prompt: '60° 附近，冷暖气流相遇、暖气流被迫抬升，多阴雨。这里的气候特征是什么？',
    options: ['subpolar-low-n', 'subtropical-high-n', 'polar-high-n', 'equatorial-low'],
    answerId: 'subpolar-low-n',
    explain:
      '60° 附近冷暖气流相遇、暖气流抬升 ⇒ **副极地低气压带**（动力因素）。它的气候是**温湿**，不是冷湿——冷热看所在的中高纬，是温；湿是上升多雨带来的。',
    wrong: {
      'subtropical-high-n': '副热带高气压带在 30° 附近，是下沉气流、气候热干、晴朗少雨。',
      'polar-high-n': '极地高气压带在 90° 附近，热力因素下沉，气候冷干。',
      'equatorial-low': '赤道低气压带在 0° 附近，热力因素上升，气候热湿；60° 附近这个是副极地低气压带。',
    },
    wrongDefault: '60° 附近 + 冷暖气流相遇 ⇒ 副极地低气压带，气候温湿。',
  },
]

/** 把 δ（太阳直射点纬度）换算成整组气压带风带的平移量，正值向北 */
export function seasonalShift(delta) {
  const d = Number(delta)
  if (!Number.isFinite(d)) return 0
  return d * SHIFT_RATIO
}

/**
 * 某个带在太阳直射点位于 δ 时的纬度区间。
 *
 * 中低纬的带整段平移；贴着极点的两个带把极点一侧钉在极点上，只让另一侧平移——
 * 这样带子既不会跑出地球，两段之间也始终相接。
 */
export function beltRangeAt(belt, delta) {
  if (!belt) return null
  const s = seasonalShift(delta)

  if (belt.hemisphere === 'both') {
    return { latFrom: belt.latFrom + s, latTo: belt.latTo + s }
  }

  const north = belt.hemisphere === 'north'
  // 靠赤道的一侧 / 靠极点的一侧
  const eq = north ? belt.latFrom : belt.latTo
  const po = north ? belt.latTo : belt.latFrom
  const limit = north ? 90 - POLAR_CAP_MIN_DEG : -90 + POLAR_CAP_MIN_DEG

  let nextEq = eq + s
  let nextPo = po + s

  if (belt.polarRole === 'cap') {
    // 极地高气压带：极点一侧钉住，另一侧跟着平移（夏半年收窄，冬半年变宽）
    nextPo = north ? 90 : -90
    nextEq = north ? Math.min(nextEq, limit) : Math.max(nextEq, limit)
  } else if (belt.polarRole === 'easterly') {
    // 极地东风带：靠极点一侧停在极地高气压带的边上，两段始终相接
    nextPo = north ? Math.min(po + s, limit) : Math.max(po + s, limit)
    nextEq = eq + s
  }

  return north
    ? { latFrom: nextEq, latTo: nextPo }
    : { latFrom: nextPo, latTo: nextEq }
}

/** 某个带在 δ 时的中心纬度 */
export function beltCenterAt(belt, delta) {
  const range = beltRangeAt(belt, delta)
  if (!range) return 0
  return (range.latFrom + range.latTo) / 2
}

/** 纬度区间转成可读文字，例如「25°–35°N」 */
export function formatLatRange(range) {
  if (!range) return ''
  const north = range.latTo >= 0
  const low = Math.min(Math.abs(range.latFrom), Math.abs(range.latTo))
  const high = Math.max(Math.abs(range.latFrom), Math.abs(range.latTo))
  const unit = north ? 'N' : 'S'
  if (high - low < 0.05) return `${high.toFixed(1)}°${unit}`
  return `${low.toFixed(1)}°–${high.toFixed(1)}°${unit}`
}

/** 按 id 找带 */
export function findBelt(id, belts = [...PRESSURE_BELTS, ...WIND_BELTS]) {
  return belts.find((belt) => belt.id === id) ?? null
}

/** 描述里出现了这个带的哪几个判据关键词 */
export function matchKeywords(text, belt) {
  const source = String(text ?? '')
  if (!source || !belt) return []
  return (belt.keywords ?? []).filter((word) => source.includes(word))
}

/**
 * 南北半球对照：把同一纬度带配成一对。
 *
 * 气压带一对（位置、天气、气候一致），风带一对（位置、热量、干湿一致，风向相反）。
 */
export function hemispherePairs(belts = [...PRESSURE_BELTS, ...WIND_BELTS]) {
  const groups = new Map()
  for (const belt of belts) {
    if (belt.hemisphere === 'both') continue
    const key = belt.pairKey
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(belt)
  }

  return [...groups.values()]
    .map((pair) => {
      const north = pair.find((belt) => belt.hemisphere === 'north') ?? null
      const south = pair.find((belt) => belt.hemisphere === 'south') ?? null
      if (!north || !south) return null
      return { key: north.pairKey, name: north.pairName, kind: north.kind, north, south }
    })
    .filter(Boolean)
}

/** 数据体检：有问题的数据抛异常，组件据此显示错误态 */
export function validateBeltData({ pressureBelts, windBelts, quizItems } = {}) {
  if (!Array.isArray(pressureBelts) || pressureBelts.length !== PRESSURE_BELT_TOTAL) {
    throw new Error(`气压带应为 ${PRESSURE_BELT_TOTAL} 个`)
  }
  if (!Array.isArray(windBelts) || windBelts.length !== WIND_BELT_TOTAL) {
    throw new Error(`风带应为 ${WIND_BELT_TOTAL} 个`)
  }

  const checkCommon = (belt) => {
    if (!belt || typeof belt.id !== 'string' || !belt.id) throw new Error('气压带或风带缺少 id')
    if (!belt.name || !belt.shortLabel) throw new Error(`${belt.id} 缺少名称`)
    if (!Number.isFinite(belt.latFrom) || !Number.isFinite(belt.latTo)) {
      throw new Error(`${belt.id} 缺少纬度区间`)
    }
    if (belt.latFrom >= belt.latTo) throw new Error(`${belt.id} 的纬度区间方向不对`)
    if (!Number.isFinite(belt.centerLat)) throw new Error(`${belt.id} 缺少中心纬度`)
  }

  pressureBelts.forEach(checkCommon)
  windBelts.forEach(checkCommon)

  const ids = new Set()
  for (const belt of [...pressureBelts, ...windBelts]) {
    if (ids.has(belt.id)) throw new Error(`带 id 重复：${belt.id}`)
    ids.add(belt.id)
  }

  for (const belt of windBelts) {
    if (!belt.windName) throw new Error(`${belt.id} 缺少风向`)
    if (!belt.flow || !Number.isFinite(belt.flow.lon) || !Number.isFinite(belt.flow.lat)) {
      throw new Error(`${belt.id} 缺少气流方向`)
    }
  }

  if (quizItems !== undefined) {
    if (!Array.isArray(quizItems) || quizItems.length === 0) throw new Error('反向练习题目不可用')
    for (const item of quizItems) {
      if (!item || !item.id || !item.prompt) throw new Error('反向练习题目缺少题干')
      if (!Array.isArray(item.options) || item.options.length < 2) throw new Error(`${item.id} 缺少选项`)
      if (!item.options.includes(item.answerId)) throw new Error(`${item.id} 的答案不在选项里`)
      if (!item.explain) throw new Error(`${item.id} 缺少判读说明`)
    }
  }

  return true
}
