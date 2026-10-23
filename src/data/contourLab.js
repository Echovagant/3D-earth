/**
 * 等高线判读实验：合成案例数据 + 判读算法。
 *
 * 仓库里没有真实 DEM，这些案例是按等高线读图的几条基本判据
 * 画出来的示意图：坐标是 0–100 的虚拟平面，单位随案例标注，
 * 高程值（米）写在每条等高线的 elevation 上，组件按比例画成 SVG path。
 *
 * 判读算法和案例放在同一个文件里，是为了让「规则」和「数据」待在一起：
 * 组件只负责画图和收答案，答案由算法从几何里算出来，
 * 谁把规则写反了，测试会先红。
 */

/** 虚拟平面边长（坐标单位） */
export const PLANE_SIZE = 100

/** 判为平缓地形（平原 / 缓坡）的坡度上限，tan 值，约 3° */
export const PLAIN_GRADIENT = 0.05

/** 地形类型名 */
export const TERRAIN_LABELS = {
  summit: '山顶',
  basin: '盆地',
  ridge: '山脊',
  valley: '山谷',
  cliff: '陡崖',
  plain: '平原（缓坡）',
}

/**
 * 案例表。
 *
 * task 决定这一题用什么算法判：
 *   closed 闭合曲线（山顶 / 盆地）—— 比内圈与外圈的数值
 *   bend   弯曲方向（山脊 / 山谷）—— 看弯曲尖端相对高值的方向
 *   cliff  陡崖—— 数重合的等高线条数，再套相对高度公式
 *   slope  坡度—— 比相邻等高线的疏密
 *   relief 平缓程度—— 用坡度上限判断
 *
 * mode 决定怎么作答：option 点选项，section 点图里的坡段标记。
 */
export const CONTOUR_CASES = [
  {
    id: 'summit',
    title: '闭合等高线：一圈套一圈',
    terrain: 'summit',
    task: 'closed',
    mode: 'option',
    interval: 100,
    metersPerUnit: 100,
    question: '图中等高线一圈套一圈，闭合区域中间的地势比四周高还是低？这片闭合区域是什么地形？',
    hint: '先找出最外圈和最内圈两条等高线，比较它们的数值大小。',
    answerId: 'summit',
    options: [
      { id: 'summit', value: 'summit', label: '山顶' },
      { id: 'basin', value: 'basin', label: '盆地（洼地）' },
      { id: 'cliff', value: 'cliff', label: '陡崖' },
      { id: 'saddle', value: 'saddle', label: '鞍部' },
    ],
    explain:
      '最内圈闭合等高线 500 m，高于最外圈的 100 m，说明闭合区域中心比四周高，判为**山顶**。闭合曲线只比内圈与外圈的数值：内圈更大是山顶，内圈更小是盆地。',
    wrong: {
      basin:
        '再看数值：内圈 500 m、外圈 100 m，内圈更大，所以是山顶。闭合曲线里**内大于外为山顶、内小于外为盆地**。',
      cliff: '陡崖的标志是**多条等高线重合**在一点，这里各条线彼此分开，是一圈套一圈的闭合曲线。',
      saddle: '鞍部是**两条山脊之间的低洼处**，形状像马鞍，和这种一圈套一圈的闭合曲线不是一回事。',
    },
    wrongDefault: '闭合曲线要比较内圈与外圈的数值：内圈更大是山顶，更小是盆地。',
    contours: [
      {
        id: 's1',
        elevation: 100,
        closed: true,
        labelAt: [50, 6.5],
        points: [
          [90, 50],
          [84.64, 70],
          [70, 84.64],
          [50, 90],
          [30, 84.64],
          [15.36, 70],
          [10, 50],
          [15.36, 30],
          [30, 15.36],
          [50, 10],
          [70, 15.36],
          [84.64, 30],
        ],
      },
      {
        id: 's2',
        elevation: 200,
        closed: true,
        labelAt: [52, 83.5],
        points: [
          [83, 48],
          [78.85, 63],
          [67.5, 73.98],
          [52, 78],
          [36.5, 73.98],
          [25.15, 63],
          [21, 48],
          [25.15, 33],
          [36.5, 22.02],
          [52, 18],
          [67.5, 22.02],
          [78.85, 33],
        ],
      },
      {
        id: 's3',
        elevation: 300,
        closed: true,
        labelAt: [47, 28.5],
        points: [
          [70, 53],
          [66.92, 63.5],
          [58.5, 71.19],
          [47, 74],
          [35.5, 71.19],
          [27.08, 63.5],
          [24, 53],
          [27.08, 42.5],
          [35.5, 34.81],
          [47, 32],
          [58.5, 34.81],
          [66.92, 42.5],
        ],
      },
      {
        id: 's4',
        elevation: 400,
        closed: true,
        labelAt: [30, 48],
        points: [
          [67, 48],
          [64.99, 54.5],
          [59.5, 59.26],
          [52, 61],
          [44.5, 59.26],
          [39.01, 54.5],
          [37, 48],
          [39.01, 41.5],
          [44.5, 36.74],
          [52, 35],
          [59.5, 36.74],
          [64.99, 41.5],
        ],
      },
      {
        id: 's5',
        elevation: 500,
        closed: true,
        labelAt: [49, 41],
        points: [
          [57, 51],
          [55.93, 54.5],
          [53, 57.06],
          [49, 58],
          [45, 57.06],
          [42.07, 54.5],
          [41, 51],
          [42.07, 47.5],
          [45, 44.94],
          [49, 44],
          [53, 44.94],
          [55.93, 47.5],
        ],
      },
    ],
  },
  {
    id: 'basin',
    title: '闭合等高线：中心反而更低',
    terrain: 'basin',
    task: 'closed',
    mode: 'option',
    interval: 100,
    metersPerUnit: 100,
    question: '同样是闭合的等高线，这一片闭合区域是什么地形？',
    hint: '和上一题一样，先比最内圈与最外圈的数值。',
    answerId: 'basin',
    options: [
      { id: 'basin', value: 'basin', label: '盆地（洼地）' },
      { id: 'summit', value: 'summit', label: '山顶' },
      { id: 'cliff', value: 'cliff', label: '陡崖' },
      { id: 'ridge', value: 'ridge', label: '山脊' },
    ],
    explain:
      '最内圈闭合等高线 100 m，低于最外圈的 500 m，说明闭合区域中心比四周低，判为**盆地**。同样是闭合曲线，靠内圈与外圈的数值关系就能分开山顶和盆地。',
    wrong: {
      summit:
        '注意数值方向：内圈 100 m 小于外圈 500 m，中心更低，应该是**盆地**；只有内圈更大才是山顶。',
      cliff: '陡崖要看**多条等高线重合**，这里没有重合。',
      ridge: '山脊靠等高线的**弯曲方向**判断，是开放曲线，不是闭合曲线。',
    },
    wrongDefault: '闭合曲线比内圈与外圈的数值：内圈更小是盆地，更大才是山顶。',
    contours: [
      {
        id: 'b1',
        elevation: 500,
        closed: true,
        labelAt: [50, 8.5],
        points: [
          [90, 50],
          [84.64, 69],
          [70, 82.91],
          [50, 88],
          [30, 82.91],
          [15.36, 69],
          [10, 50],
          [15.36, 31],
          [30, 17.09],
          [50, 12],
          [70, 17.09],
          [84.64, 31],
        ],
      },
      {
        id: 'b2',
        elevation: 400,
        closed: true,
        labelAt: [83.5, 53],
        points: [
          [78, 53],
          [73.85, 67.5],
          [62.5, 78.11],
          [47, 82],
          [31.5, 78.11],
          [20.15, 67.5],
          [16, 53],
          [20.15, 38.5],
          [31.5, 27.89],
          [47, 24],
          [62.5, 27.89],
          [73.85, 38.5],
        ],
      },
      {
        id: 'b3',
        elevation: 300,
        closed: true,
        labelAt: [52, 72.5],
        points: [
          [75, 48],
          [71.92, 58.5],
          [63.5, 66.19],
          [52, 69],
          [40.5, 66.19],
          [32.08, 58.5],
          [29, 48],
          [32.08, 37.5],
          [40.5, 29.81],
          [52, 27],
          [63.5, 29.81],
          [71.92, 37.5],
        ],
      },
      {
        id: 'b4',
        elevation: 200,
        closed: true,
        labelAt: [48, 35],
        points: [
          [63, 51],
          [60.99, 57.5],
          [55.5, 62.26],
          [48, 64],
          [40.5, 62.26],
          [35.01, 57.5],
          [33, 51],
          [35.01, 44.5],
          [40.5, 39.74],
          [48, 38],
          [55.5, 39.74],
          [60.99, 44.5],
        ],
      },
      {
        id: 'b5',
        elevation: 100,
        closed: true,
        labelAt: [50, 41],
        points: [
          [57, 50],
          [56.06, 53],
          [53.5, 55.2],
          [50, 56],
          [46.5, 55.2],
          [43.94, 53],
          [43, 50],
          [43.94, 47],
          [46.5, 44.8],
          [50, 44],
          [53.5, 44.8],
          [56.06, 47],
        ],
      },
    ],
  },
  {
    id: 'ridge',
    title: '等高线弯曲：山脊还是山谷',
    terrain: 'ridge',
    task: 'bend',
    mode: 'option',
    interval: 100,
    metersPerUnit: 100,
    question:
      '这组等高线在中间都弯了一下。弯曲的尖端朝着高的一侧还是低的一侧？这条弯曲的地形单元是山脊还是山谷？',
    hint: '看弯曲尖端指向哪边，再看那一边的等高线数值是高还是低，两件事要合起来看。',
    answerId: 'ridge',
    options: [
      { id: 'ridge', value: 'ridge', label: '山脊' },
      { id: 'valley', value: 'valley', label: '山谷' },
      { id: 'summit', value: 'summit', label: '山顶' },
      { id: 'cliff', value: 'cliff', label: '陡崖' },
    ],
    explain:
      '弯曲尖端朝北，而北侧等高线是 200 m、属于**低值**一侧（南侧升到 500 m），弯曲处凸向低处，判为**山脊**。山脊是分水线，凸低为脊。',
    wrong: {
      valley:
        '再看弯曲尖端指向哪一侧：尖端朝北，北边是 200 m 的**低值**，所以是**凸低为脊**；只有尖端朝高值才是山谷。',
      summit: '山顶要靠闭合曲线判断，这里是开放的弯曲曲线。',
      cliff: '陡崖是等高线**重合**，这里各条线分开，没有重合。',
    },
    wrongDefault: '山脊与山谷只看一件事：弯曲尖端相对高值的方向。',
    contours: [
      {
        id: 'r1',
        elevation: 200,
        labelAt: [5, 21],
        points: [
          [0, 24],
          [18, 24],
          [50, 12],
          [82, 24],
          [100, 24],
        ],
      },
      {
        id: 'r2',
        elevation: 300,
        labelAt: [5, 35],
        points: [
          [0, 38],
          [18, 38],
          [50, 26],
          [82, 38],
          [100, 38],
        ],
      },
      {
        id: 'r3',
        elevation: 400,
        labelAt: [5, 49],
        points: [
          [0, 52],
          [18, 52],
          [50, 40],
          [82, 52],
          [100, 52],
        ],
      },
      {
        id: 'r4',
        elevation: 500,
        labelAt: [5, 63],
        points: [
          [0, 66],
          [18, 66],
          [50, 54],
          [82, 66],
          [100, 66],
        ],
      },
    ],
  },
  {
    id: 'valley',
    title: '等高线弯曲：换一个方向看',
    terrain: 'valley',
    task: 'bend',
    mode: 'option',
    interval: 100,
    metersPerUnit: 100,
    question:
      '这组等高线的样子和上一题很像，但数值分布不同。按弯曲尖端与数值的关系，它是山脊还是山谷？',
    hint: '先确认哪一侧数值更高，再看弯曲尖端是不是朝着那一侧。',
    answerId: 'valley',
    options: [
      { id: 'valley', value: 'valley', label: '山谷' },
      { id: 'ridge', value: 'ridge', label: '山脊' },
      { id: 'summit', value: 'summit', label: '山顶' },
      { id: 'basin', value: 'basin', label: '盆地（洼地）' },
    ],
    explain:
      '弯曲尖端朝北，而北侧等高线升到 400 m，属于**高值**一侧，弯曲处凸向高处，判为**山谷**。山谷是集水线，凸高为谷。',
    wrong: {
      ridge:
        '尖端虽然朝北，但北边是 400 m 的**高值**，弯曲处是凸高，所以是**谷**不是脊；凸低才是脊。',
      summit: '山顶要靠闭合曲线判断，这里是开放的弯曲曲线。',
      basin: '盆地看的是闭合曲线的内外圈数值，这里是开放曲线。',
    },
    wrongDefault: '山脊与山谷只看一件事：弯曲尖端相对高值的方向。',
    contours: [
      {
        id: 'v1',
        elevation: 100,
        labelAt: [5, 64],
        points: [
          [0, 68],
          [28, 68],
          [50, 58],
          [72, 68],
          [100, 68],
        ],
      },
      {
        id: 'v2',
        elevation: 200,
        labelAt: [5, 48],
        points: [
          [0, 52],
          [28, 52],
          [50, 42],
          [72, 52],
          [100, 52],
        ],
      },
      {
        id: 'v3',
        elevation: 300,
        labelAt: [5, 32],
        points: [
          [0, 36],
          [28, 36],
          [50, 26],
          [72, 36],
          [100, 36],
        ],
      },
      {
        id: 'v4',
        elevation: 400,
        labelAt: [5, 16],
        points: [
          [0, 20],
          [28, 20],
          [50, 10],
          [72, 20],
          [100, 20],
        ],
      },
    ],
  },
  {
    id: 'slope',
    title: '同一座山坡上的三段坡',
    terrain: 'slope',
    task: 'slope',
    mode: 'section',
    interval: 100,
    metersPerUnit: 100,
    question: '这是同一座山坡，甲、乙、丙三段的坡度不一样。哪一段最陡？',
    hint: '点击图上标出的坡段作答。等高线越密，同样的高差摊在越短的水平距离上，坡就越陡。',
    answerId: 'A',
    sections: [
      { id: 'A', label: '甲', at: [42, 50], between: ['s4', 's3'] },
      { id: 'B', label: '乙', at: [79, 50], between: ['s6', 's5'] },
      { id: 'C', label: '丙', at: [31, 50], between: ['s3', 's2'] },
    ],
    explain:
      '甲段两条等高线（300 m 与 400 m）只隔 8 格，丙段隔 14 格，乙段隔 22 格。相邻等高线**越密，坡越陡**，所以最陡的是甲段。',
    wrong: {
      B: '甲段两条等高线（300 m 与 400 m）只隔 8 格，丙段隔 14 格，乙段隔 22 格。间隔最小的甲段才是陡坡。',
      C: '甲段两条等高线（300 m 与 400 m）只隔 8 格，丙段隔 14 格，乙段隔 22 格。间隔最小的甲段才是陡坡。',
    },
    wrongDefault: '比较各段相邻等高线的疏密：间隔最小的一段最陡。',
    contours: [
      {
        id: 's1',
        elevation: 600,
        labelAt: [6, 11],
        points: [
          [6, 15],
          [6, 85],
        ],
      },
      {
        id: 's2',
        elevation: 500,
        labelAt: [24, 11],
        points: [
          [24, 15],
          [24, 85],
        ],
      },
      {
        id: 's3',
        elevation: 400,
        labelAt: [38, 11],
        points: [
          [38, 15],
          [38, 85],
        ],
      },
      {
        id: 's4',
        elevation: 300,
        labelAt: [46, 11],
        points: [
          [46, 15],
          [46, 85],
        ],
      },
      {
        id: 's5',
        elevation: 200,
        labelAt: [68, 11],
        points: [
          [68, 15],
          [68, 85],
        ],
      },
      {
        id: 's6',
        elevation: 100,
        labelAt: [90, 11],
        points: [
          [90, 15],
          [90, 85],
        ],
      },
    ],
  },
  {
    id: 'cliff',
    title: '等高线重合：陡崖与相对高度',
    terrain: 'cliff',
    task: 'cliff',
    mode: 'option',
    interval: 100,
    metersPerUnit: 100,
    question:
      '图中 A 处多条等高线挤到了一起，这里是陡崖。请算出它的相对高度范围（本图等高距 100 m）。',
    hint: '先数清 A 处重合的等高线有几条，再套相对高度的取值公式。',
    answerId: 'h200-400',
    options: [
      { id: 'h0-100', value: '0-100', label: '0～100 m' },
      { id: 'h100-300', value: '100-300', label: '100～300 m' },
      { id: 'h200-400', value: '200-400', label: '200～400 m' },
      { id: 'h300-500', value: '300-500', label: '300～500 m' },
    ],
    explain:
      'A 处有 3 条等高线（100 m、200 m、300 m）重合，是**陡崖**。重合条数 n = 3、等高距 d = 100 m，相对高度按 (n−1)d ≤ ΔH < (n+1)d 取值，得到 **200 m ≤ ΔH < 400 m**。',
    wrong: {
      'h0-100':
        '先数重合的条数：n = 3，再套 (n−1)d ≤ ΔH < (n+1)d，d = 100 m，得到 200 m ≤ ΔH < 400 m。',
      'h100-300':
        '先数重合的条数：n = 3，再套 (n−1)d ≤ ΔH < (n+1)d，d = 100 m，得到 200 m ≤ ΔH < 400 m。',
      'h300-500':
        '先数重合的条数：n = 3，再套 (n−1)d ≤ ΔH < (n+1)d，d = 100 m，得到 200 m ≤ ΔH < 400 m。',
    },
    wrongDefault: '重合 n 条等高线时，相对高度按 (n−1)d ≤ ΔH < (n+1)d 取值。',
    markers: [{ id: 'A', label: 'A', at: [72, 42] }],
    contours: [
      {
        // 与陡崖无关的一条等高线：用来练习「只数挤到一处的那些」
        id: 'k4',
        elevation: 400,
        labelAt: [12, 3.8],
        points: [
          [6, 7],
          [22, 9],
          [42, 14],
          [58, 22],
        ],
      },
      {
        id: 'k3',
        elevation: 300,
        labelAt: [4, 8],
        points: [
          [8, 10],
          [40, 16],
          [70, 30],
          [72, 42],
          [70, 54],
          [40, 64],
          [8, 70],
        ],
      },
      {
        id: 'k2',
        elevation: 200,
        labelAt: [4, 18],
        points: [
          [8, 20],
          [40, 24],
          [70, 30],
          [72, 42],
          [70, 54],
          [40, 56],
          [8, 60],
        ],
      },
      {
        id: 'k1',
        elevation: 100,
        labelAt: [4, 30],
        points: [
          [8, 32],
          [40, 34],
          [70, 30],
          [72, 42],
          [70, 54],
          [40, 46],
          [8, 48],
        ],
      },
    ],
  },
  {
    id: 'plain',
    title: '稀疏的等高线：平缓地形',
    terrain: 'plain',
    task: 'relief',
    mode: 'option',
    interval: 10,
    metersPerUnit: 100,
    question: '这组等高线数值变化很小、线条又稀疏，它对应的是哪种地形？',
    hint: '相邻等高线之间隔得远，说明同样的高差摊在了很长的水平距离上。',
    answerId: 'plain',
    options: [
      { id: 'plain', value: 'plain', label: '平原（地势平缓）' },
      { id: 'steep', value: 'steep', label: '陡坡（起伏大）' },
      { id: 'cliff', value: 'cliff', label: '陡崖' },
      { id: 'basin', value: 'basin', label: '盆地（洼地）' },
    ],
    explain:
      '相邻等高线相隔 26 格，高差却只有 10 m（等高距 10 m），坡度只有 0.2° 左右，说明地面起伏很和缓，属于**平原（缓坡）**。等高线稀疏加上高差小，是平原的典型样子。',
    wrong: {
      steep:
        '等高线稀疏说明同样的高差摊在很长的水平距离上，坡度只有 0.2° 左右，是平缓地形，不是陡坡。',
      cliff: '陡崖的标志是**多条等高线重合**在一点，这里各条线分得很开。',
      basin: '盆地要看闭合曲线的内外圈数值，这里是开放曲线。',
    },
    wrongDefault: '等高线稀疏、相邻高差小，说明地面和缓，属于平原。',
    contours: [
      {
        id: 'p1',
        elevation: 40,
        labelAt: [8, 14],
        points: [
          [8, 18],
          [8, 82],
        ],
      },
      {
        id: 'p2',
        elevation: 30,
        labelAt: [34, 14],
        points: [
          [34, 18],
          [34, 82],
        ],
      },
      {
        id: 'p3',
        elevation: 20,
        labelAt: [60, 14],
        points: [
          [60, 18],
          [60, 82],
        ],
      },
      {
        id: 'p4',
        elevation: 10,
        labelAt: [86, 14],
        points: [
          [86, 18],
          [86, 82],
        ],
      },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * 几何工具
 * ------------------------------------------------------------------ */

/** 折线各顶点的平均位置（近似重心） */
export function contourCentroid(points) {
  const list = points ?? []
  if (!list.length) return { x: 0, y: 0 }
  let x = 0
  let y = 0
  for (const p of list) {
    x += p[0]
    y += p[1]
  }
  return { x: x / list.length, y: y / list.length }
}

/** 点到线段的距离 */
export function pointSegmentDistance(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/**
 * 弯曲方向：等高线首尾连线作弦，离弦最远的那个点就是弯曲的尖端。
 * 返回「弦中点 → 尖端」的方向向量。
 */
export function contourBendDirection(points) {
  const list = points ?? []
  if (list.length < 3) return { x: 0, y: 0 }
  const first = list[0]
  const last = list[list.length - 1]
  const mid = { x: (first[0] + last[0]) / 2, y: (first[1] + last[1]) / 2 }
  let best = null
  let bestDist = -1
  for (const p of list) {
    const d = pointSegmentDistance(p, first, last)
    if (d > bestDist) {
      bestDist = d
      best = p
    }
  }
  if (!best) return { x: 0, y: 0 }
  return { x: best[0] - mid.x, y: best[1] - mid.y }
}

/**
 * 上坡方向：把别的等高线按高程差加权，指向更高的一侧。
 * 高程差为正、且位置更远的那条线，把方向往它那边拉。
 */
export function uphillDirection(contours, contour) {
  const list = contours ?? []
  const from = contourCentroid(contour?.points)
  let x = 0
  let y = 0
  for (const other of list) {
    if (other === contour) continue
    const delta = other.elevation - contour.elevation
    if (!delta) continue
    const to = contourCentroid(other.points)
    x += delta * (to.x - from.x)
    y += delta * (to.y - from.y)
  }
  return { x, y }
}

/**
 * 山脊 / 山谷判别。
 *
 * 判据：看弯曲尖端相对高值的方向——
 *   尖端凸向高值（凸高）→ 山谷，山谷是集水线；
 *   尖端凸向低值（凸低）→ 山脊，山脊是分水线。
 *
 * @returns {'valley'|'ridge'|null}
 */
export function classifyBend(contours) {
  const list = contours ?? []
  let pick = null
  for (const c of list) {
    const dir = contourBendDirection(c.points)
    const mag = Math.hypot(dir.x, dir.y)
    if (!pick || mag > pick.mag) pick = { contour: c, dir, mag }
  }
  if (!pick || pick.mag === 0) return null
  const up = uphillDirection(list, pick.contour)
  const dot = pick.dir.x * up.x + pick.dir.y * up.y
  return dot >= 0 ? 'valley' : 'ridge'
}

/** 多边形面积（鞋带公式，闭合等高线用） */
export function polygonArea(points) {
  const list = points ?? []
  let sum = 0
  for (let i = 0; i < list.length; i++) {
    const a = list[i]
    const b = list[(i + 1) % list.length]
    sum += a[0] * b[1] - b[0] * a[1]
  }
  return sum / 2
}

/**
 * 闭合曲线判别：比最内圈与最外圈的数值。
 * 内圈更大 → 山顶；内圈更小 → 盆地。
 *
 * @returns {'summit'|'basin'|null}
 */
export function classifyClosedContour(contours) {
  const list = contours ?? []
  if (list.length < 2) return null
  const rings = list.map((c) => ({
    id: c.id,
    elevation: c.elevation,
    area: Math.abs(polygonArea(c.points)),
  }))
  rings.sort((a, b) => a.area - b.area)
  const inner = rings[0]
  const outer = rings[rings.length - 1]
  return inner.elevation > outer.elevation ? 'summit' : 'basin'
}

/**
 * 找出挤到同一处的等高线（重合处）。
 *
 * 做法：把每条线的坐标点按位置分组，落在同一位置的线最多的一组就是重合处。
 *
 * @returns {{count: number, ids: string[]}}
 */
export function cliffOverlap(contours) {
  const buckets = new Map()
  for (const c of contours ?? []) {
    for (const p of c.points ?? []) {
      const key = `${Number(p[0]).toFixed(3)},${Number(p[1]).toFixed(3)}`
      if (!buckets.has(key)) buckets.set(key, new Set())
      buckets.get(key).add(c.id)
    }
  }
  let best = { count: 0, ids: [] }
  for (const ids of buckets.values()) {
    if (ids.size > best.count) best = { count: ids.size, ids: [...ids] }
  }
  return best
}

/**
 * 陡崖的相对高度范围。
 *
 * n 条等高线重合时：(n−1)d ≤ ΔH < (n+1)d，左闭右开。
 */
export function cliffRelativeHeightRange(contours, interval) {
  const { count } = cliffOverlap(contours)
  const n = Math.max(count, 1)
  const d = Number(interval) || 0
  return { count, min: (n - 1) * d, max: (n + 1) * d }
}

/**
 * 相邻等高线之间的坡段：水平间隔（坐标单位）。
 * 按高程从低到高排，相邻两条算一段。
 */
export function slopeSegments(contours) {
  const list = [...(contours ?? [])].sort((a, b) => a.elevation - b.elevation)
  const segments = []
  for (let i = 0; i < list.length - 1; i++) {
    const lower = list[i]
    const upper = list[i + 1]
    const a = contourCentroid(lower.points)
    const b = contourCentroid(upper.points)
    segments.push({
      lowerId: lower.id,
      upperId: upper.id,
      lowerElevation: lower.elevation,
      upperElevation: upper.elevation,
      spacing: Math.hypot(b.x - a.x, b.y - a.y),
    })
  }
  return segments
}

/** 最陡的一段（等高线间隔最小的那段） */
export function steepestSegment(contours) {
  const segments = slopeSegments(contours)
  if (!segments.length) return null
  return segments.reduce((best, seg) => (seg.spacing < best.spacing ? seg : best))
}

/**
 * 平缓还是陡：以最陡一段的坡度（tan 值）对比上限。
 * 坡度 = 高差 ÷ 水平距离，水平距离按 metersPerUnit 换算成米。
 *
 * @returns {'plain'|'steep'|null}
 */
export function classifyRelief(contours, interval, metersPerUnit) {
  const seg = steepestSegment(contours)
  if (!seg) return null
  const scale = Number(metersPerUnit) || 1
  const gradient = (Number(interval) || 0) / (seg.spacing * scale)
  return gradient < PLAIN_GRADIENT ? 'plain' : 'steep'
}

/**
 * 某一题的正确答案（由算法从几何算出来，不从数据里抄）。
 *
 * @returns {string|null} 选项的 value，或坡段的 id
 */
export function expectedValue(item) {
  switch (item?.task) {
    case 'closed':
      return classifyClosedContour(item.contours)
    case 'bend':
      return classifyBend(item.contours)
    case 'cliff': {
      const range = cliffRelativeHeightRange(item.contours, item.interval)
      return `${range.min}-${range.max}`
    }
    case 'slope': {
      const seg = steepestSegment(item.contours)
      const section = (item.sections ?? []).find(
        (s) => s.between?.[0] === seg?.lowerId && s.between?.[1] === seg?.upperId,
      )
      return section?.id ?? null
    }
    case 'relief':
      return classifyRelief(item.contours, item.interval, item.metersPerUnit)
    default:
      throw new Error(`未知的判读任务：${item?.task}`)
  }
}

/** 答对后要高亮的等高线 */
export function highlightContourIds(item) {
  switch (item?.task) {
    case 'closed': {
      const rings = item.contours.map((c) => ({
        id: c.id,
        area: Math.abs(polygonArea(c.points)),
      }))
      rings.sort((a, b) => a.area - b.area)
      return [rings[0].id, rings[rings.length - 1].id]
    }
    case 'bend': {
      let pick = null
      for (const c of item.contours) {
        const dir = contourBendDirection(c.points)
        const mag = Math.hypot(dir.x, dir.y)
        if (!pick || mag > pick.mag) pick = { id: c.id, mag }
      }
      return pick ? [pick.id] : []
    }
    case 'cliff':
      return cliffOverlap(item.contours).ids
    case 'slope':
    case 'relief': {
      const seg = steepestSegment(item.contours)
      return seg ? [seg.lowerId, seg.upperId] : []
    }
    default:
      return []
  }
}

/** 案例数据自检：数据有问题时给出明确原因，不让页面画出一张空图 */
export function validateCases(list) {
  if (!Array.isArray(list)) throw new Error('案例数据不是数组')
  for (const item of list) {
    if (!item || typeof item.id !== 'string' || !item.id) throw new Error('案例缺少 id')
    if (typeof item.title !== 'string' || !item.title) {
      throw new Error(`案例 ${item.id} 缺少标题`)
    }
    if (typeof item.question !== 'string' || !item.question) {
      throw new Error(`案例 ${item.id} 缺少题目`)
    }
    if (!Array.isArray(item.contours) || item.contours.length === 0) {
      throw new Error(`案例 ${item.id} 没有等高线`)
    }
    for (const line of item.contours) {
      if (typeof line?.elevation !== 'number') {
        throw new Error(`案例 ${item.id} 的等高线缺少高程值`)
      }
      if (!Array.isArray(line.points) || line.points.length < 2) {
        throw new Error(`案例 ${item.id} 的等高线缺少坐标`)
      }
    }
    if (item.mode === 'option' && (!Array.isArray(item.options) || !item.options.length)) {
      throw new Error(`案例 ${item.id} 没有选项`)
    }
    if (item.mode === 'section' && (!Array.isArray(item.sections) || !item.sections.length)) {
      throw new Error(`案例 ${item.id} 没有坡段标记`)
    }
  }
  return list
}
