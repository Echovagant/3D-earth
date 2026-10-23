/**
 * 互动工具的内容来源。
 *
 * 每个工具对应课程讲义里的几节。讲义本身在仓库外（版权链条最短的做法），
 * 站内展示的是自撰的提纲与练习题，完整讲解回原视频。
 *
 * 分P 号与知识点数据里的 video 字段同一套编号：来自讲义的章节划分，
 * 见 public/data/knowledge/index.json 每个章的 range 字段。
 */

/** B 站课程号：站内所有视频链接都指向它 */
export const BVID = 'BV1RN4y1f7Hn'

export const TOOL_SOURCES = {
  contour: {
    sections: '讲义 §2.19–2.25',
    parts: [9, 10, 11],
    textbook: '人教版必修一 第一章第二节「等高线地形图」',
    topics: '等高线的定义与读图、高程与坡度计算、陡崖、封闭曲线「大于大值小于小值」、山体微地貌与通视选址、地形剖面图',
  },
  terminator: {
    sections: '讲义 §3.6、§3.19–3.20、§4.4',
    parts: [14, 17, 21],
    textbook: '人教版必修一 第一章「地球运动的地理意义」',
    topics: '晨昏圈的性质与切点、晨昏线的时间计算、正午太阳高度角及其应用',
  },
  'pressure-belt': {
    sections: '讲义 §7.4–7.10、§7.18',
    parts: [30, 31, 32],
    textbook: '人教版（选择性必修一）第三章第二节「气压带和风带」',
    topics: '三圈环流的因果链、气压带与风带全表、随季节的南北移动与分析方法',
  },
  'ocean-current': {
    sections: '讲义 §11.11–11.14',
    parts: [48],
    textbook: '人教版必修一 第三章「海水的运动」',
    topics: '洋流的概念与分类、寒暖流判读三步法、风海流与密度流补偿流、世界分布模式与北印度洋季风洋流',
  },
  'province-abbrev': {
    sections: '讲义 §15.9',
    parts: [90],
    textbook: '区域地理速览 · 中国地理',
    topics: '34 个省级行政区的省会、简称与记忆法',
  },
  'province-shape': {
    sections: '讲义 §15.8',
    parts: [89],
    textbook: '区域地理速览 · 中国地理',
    topics: '34 个省级行政区的轮廓形象记忆法',
  },
}

/** 分P 的展示形式：p009 */
export function partLabel(p) {
  return `p${String(p).padStart(3, '0')}`
}

/** 分P 的视频链接 */
export function partUrl(p) {
  return `https://www.bilibili.com/video/${BVID}?p=${p}`
}
