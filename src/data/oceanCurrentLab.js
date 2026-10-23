/**
 * 洋流判读实验：洋流数据、判读判据与练习题。
 *
 * 这个文件只放事实性结构数据：洋流走线（经纬度）、方向、寒暖属性、成因，
 * 以及自撰的判读要点与易错提示。讲义正文不在这里，也不整句照搬讲义。
 *
 * 「寒暖怎么和方向自洽」写在 heat / water 两个字段上：
 *   heat  —— 这条洋流输送热量的方向
 *     poleward    向高纬输送热量 → 暖流
 *     equatorward 向低纬输送热量 → 寒流
 *     zonal       沿等温线输送（赤道附近的东西向流），寒暖看流经海域的水温
 *     vertical    垂直上升补偿，补到海面的是底层冷水 → 寒流
 *   water —— 这条洋流携带的海水温度特征（high 高 / low 低）
 *
 * nature 字段必须与 heat + water 推出的结论一致，测试逐条核对；
 * 走线的首尾纬度也必须与 heat 相符（暖流向高纬、寒流向低纬）。
 */

/** 画布尺寸：等距圆柱投影，经度 -180→180 映射到 0→W，纬度 90→-90 映射到 0→H（北在上） */
export const MAP_WIDTH = 720
export const MAP_HEIGHT = 360

/** 经纬度 → 画布坐标 */
export function project([lon, lat]) {
  return [((lon + 180) / 360) * MAP_WIDTH, ((90 - lat) / 180) * MAP_HEIGHT]
}

/** 寒暖标签 */
export const NATURE_LABELS = { warm: '暖流', cold: '寒流' }

/** 成因标签 */
export const CAUSE_LABELS = {
  wind: '风海流',
  density: '密度流',
  compensation: '补偿流',
}

/** 热量输送方向标签 */
export const HEAT_LABELS = {
  poleward: '向高纬输送热量',
  equatorward: '向低纬输送热量',
  zonal: '沿等温线输送',
  vertical: '垂直上升补偿',
}

/**
 * 由 heat + water 推出这条洋流的性质。
 * 规则与上面的字段说明一一对应，谁把 heat 写反了测试会先红。
 */
export function deriveNature(current) {
  const heat = current?.heat
  if (heat === 'poleward') return 'warm'
  if (heat === 'equatorward') return 'cold'
  if (heat === 'zonal' || heat === 'vertical') return current?.water === 'high' ? 'warm' : 'cold'
  return ''
}

/** 视图模式：全图 / 北半球「8」字 / 南半球「0」字 */
export const VIEW_MODES = [
  {
    id: 'all',
    label: '全图',
    note:
      '世界洋流总览：箭头指向洋流流向，暖流（橙）向高纬、寒流（蓝）向低纬。点箭头看详情。',
  },
  {
    id: 'north',
    label: '北半球「8」字',
    note:
      '北半球中高纬呈「8」字：北赤道暖流自东向西 → 大陆东岸暖流北上 → 中纬度西风漂流自西向东 → 大陆东岸寒流南下。两个环的中间连接处约在北纬 40° 附近。',
  },
  {
    id: 'south',
    label: '南半球「0」字',
    note:
      '南半球中低纬呈逆时针的「0」字：南赤道暖流自东向西 → 大陆西岸暖流南下 → 西风漂流自西向东绕地球 → 大陆东岸寒流北上。南半球没有副极地环流圈，所以不是「8」字。',
  },
]

/** 各视图显示哪些环流（null = 全部） */
export const GYRE_FILTERS = {
  all: null,
  north: ['north', 'equatorial'],
  south: ['south', 'equatorial'],
}

/** 北印度洋的两个季节 */
export const SEASONS = [
  { id: 'summer', label: '夏季' },
  { id: 'winter', label: '冬季' },
]

/**
 * 洋流表。
 *
 * path 是示意走线（经纬度点），首尾点的方向即洋流流向：
 *   暖流总体向高纬（|纬度| 变大），寒流总体向低纬（|纬度| 变小）；
 *   赤道附近的东西向流与垂直上升补偿流另按 zonal / vertical 规则核对。
 * 走线是示意，不是精确的洋流中心线。
 */
export const OCEAN_CURRENTS = [
  /* ---------- 暖流 ---------- */
  {
    id: 'north-equatorial-pacific',
    name: '北赤道暖流（太平洋）',
    alias: '北赤道暖流',
    nature: 'warm',
    heat: 'zonal',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '北太平洋中低纬，自菲律宾以东向西伸到中美洲西岸',
    key:
      '由**北半球的东北信风**自东向西吹送而成。它把低纬的暖水搬到西边，是北太平洋中低纬环流的上一条边。',
    impact:
      '沿途海面温度偏高、降水偏多；珊瑚礁与渔场多分布在它的两侧海区。',
    path: [
      [-85, 13],
      [-125, 14],
      [-165, 15],
    ],
    labelAt: [-128, 18],
  },
  {
    id: 'north-equatorial-atlantic',
    name: '北赤道暖流（大西洋）',
    alias: '北赤道暖流',
    nature: 'warm',
    heat: 'zonal',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '北大西洋中低纬，自加那利群岛一带向西到加勒比海',
    key:
      '同样是**东北信风**吹出来的自东向西洋流。它在大洋的西端分成两支：向北的一支成为湾流，向南的一支成为北赤道暖流与加那利寒流之间的循环。',
    impact: '使加勒比海与墨西哥湾一带海水增温，是加勒比海珊瑚礁带得以形成的水热条件之一。',
    path: [
      [-19, 18],
      [-50, 15],
      [-82, 13],
    ],
    labelAt: [-52, 19],
  },
  {
    id: 'south-equatorial-pacific',
    name: '南赤道暖流（太平洋）',
    alias: '南赤道暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'south',
    region: '南太平洋中低纬，自美拉尼西亚一带向西到南美洲西岸',
    key:
      '由**南半球的东南信风**自东向西吹送而成。撞到南美洲后分成两支：一支北上成为秘鲁寒流，一支南下成为西风漂流的上游。',
    impact: '沿途水温偏高；到达南美洲西岸的一支带来暖水，与岸边的冷水相遇形成上升补偿流区。',
    path: [
      [156, -2],
      [100, -4],
      [40, -6],
      [-20, -8],
      [-78, -10],
    ],
    labelAt: [60, -2],
  },
  {
    id: 'south-equatorial-atlantic',
    name: '南赤道暖流（大西洋）',
    alias: '南赤道暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'south',
    region: '南大西洋中低纬，自几内亚湾一带向西到巴西东北岸',
    key:
      '同样是**东南信风**吹出的自东向西洋流。在巴西东北岸分成南北两支，向南的一支成为**巴西暖流**。',
    impact: '巴西东南岸海域水温偏高、降水丰富，南回归线附近的东南部是重要农耕区。',
    path: [
      [13, -3],
      [-5, -7],
      [-25, -10],
      [-38, -12],
    ],
    labelAt: [-14, -3],
  },
  {
    id: 'equatorial-counter',
    name: '赤道逆流',
    alias: '赤道逆流',
    nature: 'warm',
    heat: 'zonal',
    water: 'high',
    cause: 'wind',
    gyre: 'equatorial',
    region: '赤道以北的低纬海区，大致在北纬 5°—10° 一带自西向东',
    key:
      '赤道上还有一股**自西向东走的反向洋流**，方向与南北赤道暖流相反，因此叫逆流。它把暖水往东搬。',
    impact: '使赤道附近东侧海面水温偏高；其两侧的南北赤道暖流与它一起构成低纬的三条平行洋流。',
    path: [
      [-150, 4],
      [-120, 5],
      [-95, 7],
    ],
    labelAt: [-120, 9],
  },
  {
    id: 'gulf-stream',
    name: '墨西哥湾暖流',
    alias: '湾流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '从加勒比海经尤卡坦海峡进入墨西哥湾，再沿北美东岸北上，约北纬 40° 附近转向东',
    key:
      '世界上规模最大的一支暖流。它**由低纬流向高纬**，流经海域的水温比同纬度其他海区高，所以判为暖流。',
    impact:
      '给沿岸带来增温增湿，北美洲东岸冬季不结冰的范围比同纬度西岸大；也把热量送向欧洲西岸。',
    path: [
      [-82, 24],
      [-79, 30],
      [-72, 35],
      [-55, 39],
      [-40, 41],
    ],
    labelAt: [-73, 32],
  },
  {
    id: 'north-atlantic-drift',
    name: '北大西洋暖流',
    alias: '北大西洋暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '湾流离开北美洲后向东延伸，再折向东北到欧洲西岸',
    key:
      '湾流的延续体。在**中纬西风带**推动下自西向东，再被地转偏向力带向东北，是「8」字形北半环的上半段。',
    impact: '使西欧冬季温和湿润，同纬度的西欧比同纬度的亚洲东岸气温高得多。',
    path: [
      [-45, 42],
      [-25, 48],
      [-10, 54],
      [0, 58],
    ],
    labelAt: [-20, 47],
  },
  {
    id: 'norwegian-current',
    name: '挪威暖流',
    alias: '挪威暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '北欧与北冰洋沿岸，自北纬 60° 附近继续向北',
    key:
      '北大西洋暖流向北的分支，**继续向高纬**输送热量，是北半球中高纬环流里最北的一段暖流。',
    impact: '使挪威沿岸冬季不冻，成为高纬地区少见的天然不冻港；也影响巴伦支海一带的渔业。',
    path: [
      [-5, 58],
      [5, 64],
      [15, 70],
      [25, 71],
    ],
    labelAt: [12, 64],
  },
  {
    id: 'north-pacific-current',
    name: '北太平洋暖流',
    alias: '北太平洋暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '北太平洋中高纬，约北纬 40°—45° 一带自西向东横贯',
    key:
      '由中纬度**西风带**推动，**自西向东**横贯北太平洋；它承接黑潮与阿拉斯加一带的水，是北太平洋「8」字形的下半段。',
    impact: '使北太平洋中纬度海面水温偏高，渔场资源集中在它的南侧。',
    path: [
      [-179, 43],
      [-150, 45],
      [-130, 47],
    ],
    labelAt: [-152, 48],
  },
  {
    id: 'kuroshio',
    name: '黑潮',
    alias: '日本暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '西太平洋，菲律宾以东起，经台湾东岸、日本南岸，接近日本本州转向东',
    key:
      '亚洲东岸最强的暖流，**由低纬流向高纬**，是北半球西太平洋环流的西侧一支。',
    impact: '黑潮沿途增温增湿，日本沿岸冬季较温和；暖流与寒流交汇的日本近海是世界著名渔场。',
    path: [
      [122, 22],
      [130, 28],
      [138, 34],
      [146, 38],
      [155, 40],
    ],
    labelAt: [133, 26],
  },
  {
    id: 'east-australian-current',
    name: '东澳大利亚暖流',
    alias: '东澳大利亚暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'south',
    region: '澳大利亚东岸，自热带海域向西南方向流到塔斯曼海',
    key:
      '南半球中低纬环流的西侧一支：**从低纬流向高纬**（在南半球表现为向南），水来自低纬暖水海域，所以是暖流。',
    impact: '使澳大利亚东岸气温偏高、降水较多；东岸的暖流与西岸的寒流一起造成澳大利亚东西两岸自然带明显不同。',
    path: [
      [152, -14],
      [153, -24],
      [151, -33],
      [150, -40],
    ],
    labelAt: [155, -25],
  },
  {
    id: 'alaskan-current',
    name: '阿拉斯加暖流',
    alias: '阿拉斯加暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'north',
    region: '阿拉斯加沿岸及白令海南部，自南向北流',
    key:
      '北太平洋暖流向北的分支，**继续向高纬**输送热量，冬季阿拉斯加沿岸海面不结冰。',
    impact: '沿岸冬季较温和，海岸带出现针叶林；与寒流交汇处形成渔场。',
    path: [
      [-140, 52],
      [-133, 57],
      [-125, 60],
    ],
    labelAt: [-131, 55],
  },
  {
    id: 'brazil-current',
    name: '巴西暖流',
    alias: '巴西暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'south',
    region: '南大西洋西岸，自巴西东北岸向南到拉普拉塔河口一带',
    key:
      '南赤道暖流撞到南美洲后向南的一支。它在**南半球从低纬流向高纬**，方向是向南——所以「低纬→高纬」要按南北半球分别理解。',
    impact: '巴西东南部沿海增温增湿，东南部是重要农耕区；河口一带渔业发达。',
    path: [
      [-38, -11],
      [-42, -22],
      [-48, -34],
      [-52, -40],
    ],
    labelAt: [-45, -26],
  },
  {
    id: 'mozambique-current',
    name: '莫桑比克暖流',
    alias: '莫桑比克暖流',
    nature: 'warm',
    heat: 'poleward',
    water: 'high',
    cause: 'wind',
    gyre: 'south',
    region: '非洲东南岸的莫桑比克海峡，自北向南流到南非东岸',
    key:
      '南印度洋西侧的一支暖流，把低纬暖水**向南**（南半球的高纬方向）输送，因此判为暖流。',
    impact:
      '使马达加斯加岛东侧处在东南信风的迎风坡，降水多、形成热带雨林；岛西侧背风，形成热带草原。',
    path: [
      [42, -10],
      [39, -18],
      [35, -25],
      [32, -30],
    ],
    labelAt: [34, -18],
  },
  {
    id: 'mediterranean-surface',
    name: '地中海上层密度流',
    alias: '密度流',
    nature: 'warm',
    heat: 'zonal',
    water: 'high',
    cause: 'density',
    gyre: 'other',
    region: '大西洋经直布罗陀海峡进入地中海的上层水流',
    key:
      '两侧海水**密度不一致**造成的流动：地中海蒸发旺盛、盐度高于大西洋，上层密度较小的大西洋水流入地中海。',
    impact: '把大西洋表层的热量与盐度带进地中海，是地中海能维持在副热带而不干涸的重要原因。',
    path: [
      [-6, 36],
      [0, 37],
      [6, 38],
      [12, 38.5],
    ],
    labelAt: [2, 41],
  },

  /* ---------- 寒流 ---------- */
  {
    id: 'california-current',
    name: '加利福尼亚寒流',
    alias: '加利福尼亚寒流',
    nature: 'cold',
    heat: 'equatorward',
    water: 'low',
    cause: 'wind',
    gyre: 'north',
    region: '北太平洋东南部，沿北美西岸从高纬流向低纬',
    key:
      '**由高纬流向低纬**，流经海域的水温比同纬度海区低，所以判为寒流。沿岸盛行离岸风，深层冷水上涌补充。',
    impact: '使沿岸气温偏低、降水稀少；沿岸有上升补偿流，渔业资源集中在近岸海域。',
    path: [
      [-128, 47],
      [-122, 36],
      [-114, 23],
    ],
    labelAt: [-120, 33],
  },
  {
    id: 'peru-current',
    name: '秘鲁寒流',
    alias: '洪堡寒流',
    nature: 'cold',
    heat: 'equatorward',
    water: 'low',
    cause: 'wind',
    gyre: 'south',
    region: '南太平洋东部，沿南美洲西岸从南向北流到赤道附近',
    key:
      '南半球中高纬的寒流，**由高纬流向低纬**（在地图上是向北），所以判为寒流。',
    impact:
      '使南美西岸气温降低、降水稀少，形成沿岸荒漠；寒流带来的营养盐使秘鲁、智利近海成为世界著名渔场。',
    path: [
      [-76, -43],
      [-77, -30],
      [-79, -18],
      [-81, -6],
    ],
    labelAt: [-82, -26],
  },
  {
    id: 'benguela-current',
    name: '本格拉寒流',
    alias: '本格拉寒流',
    nature: 'cold',
    heat: 'equatorward',
    water: 'low',
    cause: 'wind',
    gyre: 'south',
    region: '南大西洋东部，沿非洲西南岸从南向北流到赤道附近',
    key:
      '**由高纬流向低纬**（向北），是南半球「0」字形环流东侧的那条寒流，把冷水送到赤道附近。',
    impact:
      '使非洲西南岸炎热干燥，形成纳米布沙漠；沿岸有上升补偿流，渔业资源丰富。',
    path: [
      [17, -34],
      [13, -24],
      [10, -14],
      [8, -6],
    ],
    labelAt: [7, -18],
  },
  {
    id: 'oyashio-current',
    name: '千岛寒流',
    alias: '千岛寒流',
    nature: 'cold',
    heat: 'equatorward',
    water: 'low',
    cause: 'wind',
    gyre: 'north',
    region: '西北太平洋，沿千岛群岛、日本北海道东侧向西南流',
    key:
      '来自北太平洋高纬的冷水，**由高纬流向低纬**，与黑潮在日本近海相遇。',
    impact:
      '使日本东北部沿海冬季寒冷；与黑潮的暖水交汇形成北海道附近的著名渔场——暖流与寒流相遇处多渔场。',
    path: [
      [165, 55],
      [155, 45],
      [145, 38],
    ],
    labelAt: [152, 42],
  },
  {
    id: 'east-greenland-current',
    name: '厄克勒斯寒流',
    alias: '东格陵兰寒流',
    nature: 'cold',
    heat: 'equatorward',
    water: 'low',
    cause: 'wind',
    gyre: 'north',
    region: '格陵兰岛东岸，沿岸由北向南流',
    key:
      '北半球高纬的冷水**流向低纬**，是「8」字形北半环上部那条冷的一边。',
    impact: '使格陵兰东岸气温低、结冰期长；沿途浮冰较多。',
    path: [
      [-10, 80],
      [-18, 74],
      [-28, 68],
      [-40, 62],
    ],
    labelAt: [-26, 72],
  },
  {
    id: 'canary-current',
    name: '加那利寒流',
    alias: '加那利寒流',
    nature: 'cold',
    heat: 'equatorward',
    water: 'low',
    cause: 'wind',
    gyre: 'north',
    region: '东北大西洋，沿非洲西北岸从高纬流向低纬',
    key:
      '**由高纬流向低纬**（向西南），把海水送到加那利群岛一带，是北赤道暖流的对流。',
    impact: '使非洲西北岸气温偏低、降水偏少，沿岸有沙漠分布；近海渔业资源集中。',
    path: [
      [-10, 33],
      [-16, 26],
      [-22, 19],
      [-27, 14],
    ],
    labelAt: [-24, 22],
  },
  {
    id: 'west-wind-drift',
    name: '西风漂流',
    alias: '西风漂流',
    nature: 'cold',
    heat: 'equatorward',
    water: 'low',
    cause: 'wind',
    gyre: 'south',
    region: '南半球中低纬，自南美洲西岸向东横贯南太平洋、印度洋、大西洋',
    key:
      '南半球中低纬的寒流，由**中纬西风带**的西北风推动，**自西向东**流；因南半球陆地少、地转偏向力向左，可以绕地球一周。',
    impact:
      '把南半球高纬的冷水向低纬输送，南美、非洲、澳大利亚西岸都因此偏冷多雾；沿途寒流上有世界级的磷肥渔场。',
    path: [
      [-75, -44],
      [-20, -42],
      [40, -40],
      [100, -38],
      [175, -36],
    ],
    labelAt: [10, -37],
  },
  {
    id: 'mediterranean-deep',
    name: '地中海南下层密度流',
    alias: '密度流',
    nature: 'cold',
    heat: 'zonal',
    water: 'low',
    cause: 'density',
    gyre: 'other',
    region: '从地中海经直布罗陀海峡向大西洋西流的底层水流',
    key:
      '同样是**密度差**造成的流动。地中海的表层水先流出去，底层的高盐冷水再流出，**方向与表层相反**。',
    impact:
      '在地中海与大西洋之间形成稳定的水量平衡，使地中海不会因蒸发而干涸。',
    path: [
      [-6, 36],
      [-20, 35],
      [-40, 33],
      [-60, 31],
    ],
    labelAt: [-38, 29],
  },
  {
    id: 'peru-upwelling',
    name: '秘鲁沿岸上升补偿流',
    alias: '上升补偿流',
    nature: 'cold',
    heat: 'vertical',
    water: 'low',
    cause: 'compensation',
    gyre: 'south',
    region: '南美洲西岸近海，表层海水被风推离后底层冷水上涌',
    key:
      '沿岸盛行**离岸风**把表层海水带走，邻近的**底层冷水上涌补充**，属于补偿流。上涌的是冷水，所以判为**寒流**。',
    impact:
      '把深层的营养盐带到表层，形成世界著名的秘鲁渔场；冷水使沿岸气候干燥。',
    path: [
      [-80, -34],
      [-83, -22],
      [-86, -10],
    ],
    labelAt: [-88, -22],
  },
]

/**
 * 北印度洋季风洋流：单独处理，不属于「8—0」模式。
 *
 * 夏季盛行离岸的西南季风 → 索马里沿岸表层水离开 → 底层冷水上涌 → 寒流；
 * 冬季盛行向岸的东北季风 → 表层暖水被推上沿岸 → 向南流 → 暖流。
 * 即「夏顺冬逆」。
 */
export const MONSOON_CURRENT = {
  id: 'north-indian-monsoon',
  name: '北印度洋季风洋流',
  gyre: 'monsoon',
  region: '北印度洋（索马里半岛、阿拉伯海、孟加拉湾一带）',
  key:
    '受**季风环流**控制，「**夏顺冬逆**」，寒暖随季节反转。它是考试中要单独处理的一类，不属于「8—0」模式。',
  impact:
    '夏季沿岸上升补偿流带来营养盐，形成季节性渔场；季风洋流的季节反转也影响印度次大陆的降水季节。',
  seasons: {
    summer: {
      id: 'summer',
      label: '夏季',
      nature: 'cold',
      heat: 'vertical',
      water: 'low',
      cause: 'compensation',
      direction: '沿索马里半岛沿岸向北（离岸风 → 上升补偿流）',
      detail:
        '夏季北印度洋盛行**西南季风**，索马里半岛沿岸是**离岸风**，表层海水被吹离岸边，底层冷水上涌补充，形成**寒流**，并带来季节性渔场。',
      path: [
        [48, 2],
        [51, 5],
        [55, 8],
        [58, 10],
      ],
    },
    winter: {
      id: 'winter',
      label: '冬季',
      nature: 'warm',
      heat: 'zonal',
      water: 'high',
      cause: 'wind',
      direction: '沿索马里半岛沿岸向南（向岸风 → 表层暖水）',
      detail:
        '冬季北印度洋盛行**东北季风**，沿岸是**向岸风**，表层暖水被推上海岸并沿海南下，形成**暖流**。向岸风把海水堆到岸边，海水并不缺少，所以**没有上升补偿流**。',
      path: [
        [58, 11],
        [54, 9],
        [50, 7],
        [45, 5],
      ],
    },
  },
}

/** 「8—0」模式与季节反转在图上的标注点 */
export const GYRE_ANCHORS = [
  {
    id: 'equatorial-counter',
    label: '赤道逆流',
    lon: -122,
    lat: 6,
    modes: ['all', 'north', 'south'],
  },
  {
    id: 'west-wind-drift',
    label: '西风漂流',
    lon: -30,
    lat: -40,
    modes: ['all', 'south'],
  },
  {
    id: 'gyre-eight-junction',
    label: '北纬 40° 附近：「8」字连接处',
    lon: -45,
    lat: 41,
    modes: ['all', 'north'],
  },
]

/** 寒暖流判读三步法 */
export const READING_STEPS = [
  {
    no: 1,
    title: '判半球',
    text: '看等温线数值：**北半球向北递减，南半球向南递减**。图上没有指北针时，按上北下南、左西右东读。',
  },
  {
    no: 2,
    title: '判流向',
    text: '**洋流流向与等温线凸出的方向一致**。这一步只定方向，还不定性质。',
  },
  {
    no: 3,
    title: '判性质',
    text: '看水从哪来：**从水温高处流向水温低处的是暖流**，反过来是寒流。',
  },
]

/** 易错提示 */
export const PITFALLS = [
  {
    id: 'relative',
    title: '寒暖是相对概念',
    text: '寒流暖流说的是**流经海域**的相对冷热，不是这条水本身温度的绝对高低。同一条流在不同海域可以表现出不同的性质。',
  },
  {
    id: 'three-steps',
    title: '三步法不能跳步',
    text: '判半球 → 判流向（与等温线凸出一致）→ 判性质（从高水温处流向低水温处）。第二步与第三步最容易搞混。',
  },
  {
    id: 'no-shortcut',
    title: '不能只背「低纬→高纬 = 暖流」',
    text: '跨赤道或受寒流影响的海域会出错，**以流向与等温线凸出方向一致为准**，再落到水温关系上。',
  },
  {
    id: 'upwelling',
    title: '上升补偿流一般是寒流',
    text: '上涌的是底层冷水。**向岸风**把海水堆到岸边，海水并不缺少，所以**没有上升补偿流**。',
  },
  {
    id: 'monsoon',
    title: '北印度洋单独处理',
    text: '季风洋流「**夏顺冬逆**」，索马里半岛沿岸是判别突破口：冬季暖流、夏季寒流。别把它套进「8—0」模式。',
  },
  {
    id: 'south-zero',
    title: '南半球没有副极地环流圈',
    text: '所以南半球中低纬是逆时针的「0」字，北半球中高纬才是「8」字。',
  },
  {
    id: 'season',
    title: '南北半球季节相反',
    text: '6—10 月是北半球的夏季，却是南半球的**冬季**。做题先确认题干说的是哪个半球。',
  },
  {
    id: 'madagascar',
    title: '洋流连着自然带',
    text: '莫桑比克暖流流经马达加斯加岛**东侧**，东侧是东南信风的**迎风坡**，形成热带雨林；西侧背风，是热带草原。',
  },
]

/**
 * 判读练习题。
 *
 * 每题给一段描述或情景，学生判断寒暖 / 成因 / 所属洋流。
 * explain 是判读依据，wrong 是逐个选项的纠正性提示。
 */
export const OCEAN_CURRENT_QUESTIONS = [
  {
    id: 'isotherm-bulge',
    kind: 'nature',
    tag: '判寒暖',
    prompt:
      '北半球一片海域，等温线在沿岸向北（高纬）方向凸出，图中洋流箭头与等温线凸出的方向一致。按三步法，这支洋流是？',
    hint: '第一步判半球：北半球等温线向北递减；第二步判流向：流向与等温线凸出一致；第三步判性质：看水是从水温高处流向水温低处，还是相反。',
    options: [
      { id: 'warm', label: '暖流' },
      { id: 'cold', label: '寒流' },
    ],
    answerId: 'warm',
    explain:
      '等温线向北凸出 → 洋流向北流；北半球等温线数值向北递减 → 向北流就是**从水温高处流向水温低处** → **暖流**。性质要落到水温关系这一步，不能停在「低纬→高纬」。',
    wrong: {
      cold: '再看流向：等温线向北凸出，洋流也向北。北半球等温线向北递减，北上的水是**从高水温处流向低水温处**，所以是**暖流**；只有北上的水来自低水温海域才是寒流。',
    },
    wrongDefault: '按三步法走完：流向与等温线凸出一致，再看是从水温高处流向低处还是相反。',
    highlight: ['gulf-stream', 'kuroshio'],
  },
  {
    id: 'density-strait',
    kind: 'cause',
    tag: '判成因',
    prompt:
      '直布罗陀海峡两侧海水密度不一致，底层的水流方向与表层相反。这属于哪一类成因的洋流？',
    hint: '看动力的来源：是风推的，还是两侧海水本身的差别。',
    options: [
      { id: 'wind', label: '风海流' },
      { id: 'density', label: '密度流' },
      { id: 'compensation', label: '补偿流' },
    ],
    answerId: 'density',
    explain:
      '两侧海水**密度不一致**造成的流动就是**密度流**。地中海蒸发旺盛、盐度高于大西洋：表层大西洋水流入地中海，底层高盐冷水流出，**方向与表层相反**。',
    wrong: {
      wind: '风海流是**盛行风**吹拂海面形成的，规模大，是世界洋流的主体。这条流的动力是两侧海水的**密度差**，不是风。',
      compensation:
        '补偿流是某处海水流失、邻近海水补过来，判据是「**补海水**」。这里的判据是「**密度差**」，所以是密度流。',
    },
    wrongDefault: '看动力来自哪里：风吹的是风海流，两侧密度差造成的是密度流。',
    highlight: ['mediterranean-surface', 'mediterranean-deep'],
  },
  {
    id: 'upwelling-cold',
    kind: 'nature',
    tag: '判寒暖',
    prompt:
      '某段海岸盛行离岸风，海水被风推离岸边，底层海水上涌补充到表层。这支上升补偿流是寒流还是暖流？',
    hint: '关键是补上来的那层海水是热的还是冷的。',
    options: [
      { id: 'cold', label: '寒流' },
      { id: 'warm', label: '暖流' },
    ],
    answerId: 'cold',
    explain:
      '上涌的是**底层的冷水**，所以是**寒流**。判断依据是补上来的海水的温度，不是流向的高低纬。',
    wrong: {
      warm: '上升补偿流补上来的是**底层冷水**，因此判为**寒流**；要出现暖的上升补偿流，得是暖水上升，但常见的沿岸上升流都是冷水上涌。',
    },
    wrongDefault: '上升的是底层冷水，判为寒流。',
    highlight: ['peru-upwelling'],
  },
  {
    id: 'monsoon-summer',
    kind: 'nature',
    tag: '判寒暖',
    prompt: '北印度洋夏季，索马里半岛沿岸出现上升补偿流。此时该处洋流的性质是？',
    hint: '夏季这个半岛沿岸是离岸风还是向岸风？',
    options: [
      { id: 'cold', label: '寒流' },
      { id: 'warm', label: '暖流' },
    ],
    answerId: 'cold',
    explain:
      '夏季北印度洋盛行**西南季风**，索马里半岛沿岸是**离岸风**，表层水被带走、底层冷水上涌，形成**寒流**，并带来季节性渔场。',
    wrong: {
      warm: '夏季这里是**离岸风**，表层水离开、底层冷水上涌，所以是**寒流**；冬季的向岸风才是暖流。',
    },
    wrongDefault: '夏季索马里沿岸离岸风 → 上升补偿流 → 寒流。',
    highlight: ['north-indian-monsoon'],
  },
  {
    id: 'monsoon-winter',
    kind: 'nature',
    tag: '判寒暖',
    prompt:
      '北印度洋冬季，索马里半岛沿岸盛行东北季风，水流方向与夏季相反。此时沿岸洋流的性质是？',
    hint: '向岸风会把表层海水堆到岸边，还会引起上升补偿流吗？',
    options: [
      { id: 'warm', label: '暖流' },
      { id: 'cold', label: '寒流' },
    ],
    answerId: 'warm',
    explain:
      '冬季盛行**向岸的东北季风**，表层暖水被推上沿岸并向南流，是**暖流**。向岸风把海水堆到岸边，海水并不缺少，所以**没有上升补偿流**。北印度洋季风洋流「**夏顺冬逆**」，夏寒冬暖。',
    wrong: {
      cold: '冬季是**向岸风**，表层暖水被推上海岸，不会形成上升补偿流，所以是**暖流**；夏季的离岸风才对应寒流。',
    },
    wrongDefault: '季风洋流「夏顺冬逆」：夏季寒流，冬季暖流。',
    highlight: ['north-indian-monsoon'],
  },
  {
    id: 'gyre-junction',
    kind: 'identify',
    tag: '判读模式',
    prompt: '北半球中低纬的洋流环流呈「8」字形，两个环的中间连接处大致在哪条纬线上？',
    hint: '连接处对应的是中纬度西风漂流所在的位置。',
    options: [
      { id: 'forty', label: '北纬 40° 附近' },
      { id: 'equator', label: '赤道附近' },
      { id: 'polar', label: '北极圈附近' },
    ],
    answerId: 'forty',
    explain:
      '北半球「8」字形的中间连接处约在**北纬 40° 附近**。那里是盛行西风带，洋流自西向东走，与大陆东岸北上、南下的一支相接。',
    wrong: {
      equator: '赤道附近是**赤道逆流**所在的位置。「8」字的中间连接处对应中纬度西风漂流，约在**北纬 40° 附近**。',
      polar: '极圈附近是极地东风带的范围。中间连接处对应的是**西风漂流**，约在**北纬 40° 附近**。',
    },
    wrongDefault: '「8」字的中间连接处约在北纬 40° 附近。',
    highlight: ['north-atlantic-drift', 'gulf-stream'],
  },
  {
    id: 'gyre-south',
    kind: 'identify',
    tag: '判读模式',
    prompt: '南半球中低纬的洋流环流，形状与北半球不同。它的形状与根本原因是？',
    hint: '先想南半球有没有副极地环流圈，再想海水被推向哪一边。',
    options: [
      { id: 'zero-counterclockwise', label: '逆时针的「0」字；陆地少且地转偏向力向左' },
      { id: 'zero-clockwise', label: '顺时针的「0」字；陆地少且地转偏向力向左' },
      { id: 'eight', label: '「8」字形；陆地多且地转偏向力向右' },
    ],
    answerId: 'zero-counterclockwise',
    explain:
      '南半球中低纬是**逆时针的「0」字**：南赤道暖流自东向西 → 大陆西岸的暖流南下 → 西风漂流自西向东绕地球 → 大陆东岸的寒流北上回到赤道。南半球**没有副极地环流圈**，所以不是「8」字；又因**陆地少、地转偏向力向左**，西风漂流才能一路绕地球。',
    wrong: {
      'zero-clockwise':
        '方向说反了：南半球中低纬是**逆时针**的「0」字，北半球才是「8」字形（两个环）。',
      eight: '「8」字是**北半球**中高纬的形状；南半球中低纬是逆时针的「0」字，原因是**陆地少、地转偏向力向左**。',
    },
    wrongDefault: '南半球中低纬：逆时针的「0」字，陆地少且地转偏向力向左。',
    highlight: ['west-wind-drift', 'south-equatorial-atlantic', 'brazil-current', 'benguela-current'],
  },
  {
    id: 'identify-kuroshio',
    kind: 'identify',
    tag: '认洋流',
    prompt:
      '西太平洋、亚洲东岸有一股强劲的暖流，沿台湾东岸和日本南岸北上，接近日本本州时转向东。它是？',
    hint: '注意两个线索：亚洲东岸、北上且是暖流。',
    options: [
      { id: 'kuroshio', label: '黑潮（日本暖流）' },
      { id: 'north-pacific', label: '北太平洋暖流' },
      { id: 'oyashio', label: '千岛寒流' },
    ],
    answerId: 'kuroshio',
    explain:
      '这是**黑潮（日本暖流）**，亚洲东岸最强的暖流，在日本本州附近转向东，接续成黑潮延伸体。',
    wrong: {
      'north-pacific':
        '北太平洋暖流在**中纬度（约北纬 40° 附近）自西向东**流，位置比黑潮偏北。题干说的「沿台湾、日本南岸北上」是**黑潮**。',
      oyashio: '千岛寒流是**寒流**，从北太平洋高纬向西南流、沿千岛群岛南下。题干里的「暖流、北上」都不是它。',
    },
    wrongDefault: '亚洲东岸北上的强暖流是黑潮。',
    highlight: ['kuroshio'],
  },
  {
    id: 'monsoon-not-gyre',
    kind: 'identify',
    tag: '辨易错',
    prompt: '判断：北印度洋的季风洋流也可以套进「8—0」的分布模式。',
    hint: '想想北印度洋的洋流方向由什么控制。',
    options: [
      { id: 'wrong-statement', label: '错误' },
      { id: 'right-statement', label: '正确' },
    ],
    answerId: 'wrong-statement',
    explain:
      '北印度洋受**季风**控制，是「**夏顺冬逆**」的季风洋流，不服从由信风与西风带构成的「8—0」模式。考试中要**单独处理**。',
    wrong: {
      'right-statement':
        '北印度洋的洋流由**季风**驱动，方向随季节反转，属于「夏顺冬逆」的季风洋流，不属于「8—0」模式。',
    },
    wrongDefault: '北印度洋是季风洋流，不属于「8—0」模式。',
    highlight: ['north-indian-monsoon'],
  },
  {
    id: 'madagascar',
    kind: 'identify',
    tag: '联系实际',
    prompt: '莫桑比克暖流流经马达加斯加岛东侧。该岛东侧的自然带是？',
    hint: '看东侧处在东南信风的迎风坡还是背风坡。',
    options: [
      { id: 'rainforest', label: '热带雨林' },
      { id: 'savanna', label: '热带草原' },
    ],
    answerId: 'rainforest',
    explain:
      '马达加斯加岛东侧是**东南信风的迎风坡**，暖湿气流抬升、降水多，形成**热带雨林**；西侧是背风坡，降水少，形成热带草原。',
    wrong: {
      savanna: '东侧是**迎风坡**（东南信风带来的暖湿气流抬升），形成**热带雨林**；**西侧**背风坡才是热带草原。',
    },
    wrongDefault: '迎风坡一侧是热带雨林，背风坡一侧是热带草原。',
    highlight: ['mozambique-current'],
  },
  {
    id: 'season-trap',
    kind: 'identify',
    tag: '辨易错',
    prompt: '判断：6—10 月是北半球的夏季，同时也是南半球的夏季。',
    hint: '太阳直射点向南移动的时候，哪个半球是夏季？',
    options: [
      { id: 'wrong-statement', label: '错误' },
      { id: 'right-statement', label: '正确' },
    ],
    answerId: 'wrong-statement',
    explain:
      '南北半球的季节是**相反**的：6—10 月太阳直射点在南半球，此时北半球是夏季、**南半球是冬季**。做题时先确认题干说的是哪个半球。',
    wrong: {
      'right-statement': '6—10 月北半球是夏季，南半球是**冬季**，两者的季节正好相反。',
    },
    wrongDefault: '南北半球季节相反：6—10 月南半球是冬季。',
    highlight: [],
  },
]

/**
 * 把 GeoJSON 的国界几何转成 SVG path 的 d 字符串（等距圆柱投影）。
 *
 * 只画轮廓不填色：底图压在洋流下面会把箭头盖住。
 * 相邻太近的点先丢掉，避免路径过长（原始数据约 1.2 万个点）。
 */
export function buildCoastPaths(geojson) {
  const features = Array.isArray(geojson?.features) ? geojson.features : []
  const paths = []
  features.forEach((feature, index) => {
    const geometry = feature?.geometry
    const polygons =
      geometry?.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry?.type === 'MultiPolygon'
          ? geometry.coordinates
          : []
    const parts = []
    for (const polygon of polygons) {
      for (const ring of polygon ?? []) {
        const d = ringToPath(ring)
        if (d) parts.push(d)
      }
    }
    if (!parts.length) return
    paths.push({
      id: feature?.properties?.iso3 ?? `feature-${index}`,
      name: feature?.properties?.name ?? '',
      d: parts.join(' '),
    })
  })
  return paths
}

/** 一个环 → 一段 path 的 d；丢掉投影后离得太近的点 */
function ringToPath(ring) {
  if (!Array.isArray(ring) || ring.length < 2) return ''
  const valid = []
  for (const coord of ring) {
    const lon = Number(coord?.[0])
    const lat = Number(coord?.[1])
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    valid.push([lon, lat])
  }
  if (valid.length < 2) return ''
  const kept = []
  for (const [lon, lat] of valid) {
    const last = kept[kept.length - 1]
    if (last && Math.abs(lon - last[0]) < 0.4 && Math.abs(lat - last[1]) < 0.4) continue
    kept.push([lon, lat])
  }
  // 简化过头会把整座岛抹掉：不到 0.4° 的小岛（梵蒂冈、佛得角、新加坡这类）
  // 的所有点都挨得太近，简化后只剩一个点，整个要素就凭空消失了。
  // 这种环退回未简化的点——宁可多几个点，也不能让一个国家从底图上不见。
  const points = kept.length >= 3 ? kept : valid
  let d = ''
  points.forEach((point, index) => {
    const [x, y] = project(point)
    d += `${index === 0 ? 'M' : ' L'}${x.toFixed(1)} ${y.toFixed(1)}`
  })
  return `${d} Z`
}

/** 洋流名称标签的位置：优先用 labelAt，否则取走线中点 */
export function currentLabelAt(current) {
  if (Array.isArray(current?.labelAt)) return project(current.labelAt)
  const points = current?.path ?? []
  if (!points.length) return [0, 0]
  const mid = points[Math.floor((points.length - 1) / 2)]
  return project(mid)
}
