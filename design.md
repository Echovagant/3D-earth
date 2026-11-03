# 3D-earth 设计系统

> 面向贡献者的实现规范。改样式之前先读这一页。

## 一、主题边界（最重要的一条）

全站只有两个主题，按路由硬切，**一页一主题，不混用**：

| 主题 | 页面 | 背景 | Token |
| --- | --- | --- | --- |
| 星空（暗） | `/`（地球）、`/world`（世界） | `--bg-void` + 星野装饰 | `tokens.css` 的场景 token（`--bg-*`、`--line`、`--accent`） |
| 学习（亮） | 其余全部页面：详情页、课程、知识点、搜索、工具、许可 | `--learn-bg` | `learning.css` 挂在 `:root` 的产品 token（`--learn-*`） |

- 球面页是入口与「 场景 」；学习与查阅内容全部在亮色体系里。
- **禁止**在亮色页面里局部插暗色区块，也**禁止**把 `--learn-*` 重映射成暗色值（历史做法，已清除）。
- 星野装饰（网格、扫描线、辉光、发光阴影）只允许出现在球面页。

## 二、Token

产品 token 在 `src/styles/learning.css` 的 `:root`：

- 色板：`--learn-bg #f4f7fb`、`--learn-panel #fff`、`--learn-ink #16202e`、
  `--learn-ink-soft`、`--learn-ink-faint`、`--learn-line`、
  **单强调色** `--learn-accent #0b6fb8`、`--learn-accent-soft`、`--learn-warn`、`--learn-on-tint`
- 字号档：`--learn-fs-label 12px`、`--learn-fs-body 15px`、`--learn-fs-value 16px`、`--learn-fs-title 22px`
- 间距与圆角沿用 `tokens.css` 的 `--sp-1..6`、`--radius-sm/--radius/--radius-lg`

规则：组件不写死色值；一个页面一个强调色；文字层级靠**字重 + 颜色**，
不靠放大字号；数据数字用 `font-variant-numeric: tabular-nums` 或 mono。

## 三、页面骨架

- 球面页：全屏 canvas + 悬浮 HUD 面板。**≤640px 时面板改底部抽屉**
  （图例/国家列表：`top: auto; bottom: 96px; left/right 16px; max-height 38–48vh`），
  图例窄屏默认收起，鼠标提示行隐藏（触屏无滚轮悬停）。
- 详情页（省/景区/国家/许可/标准地图）：`.detail-page` 共享骨架，
  顶栏 sticky + 主内容 `max-width: 860px` 居中；
  区块 = 小节标题（`detail-page__section-title` / `intro-label`）+ 正文；
  底部 sticky 脚注。
- 学习页：`.learn-page` + `.learn-panel` 区块流。

## 四、组件规范

| 组件 | 规范 |
| --- | --- |
| 数据卡（`.facts__cell`） | 白底 + `--learn-line` 边框，dt 小字 faint、dd 大字 tabular-nums |
| 标签 chip（`.detail-page__tag`） | accent-soft 底、无边框、ink-soft 文字 |
| 景区卡片（`.scenic-card`） | 白底卡片、整卡可点、无图时省色渐变 + 首字占位 |
| 图廊/灯箱（`.scenic-gallery`） | 灯箱全屏 Teleport 到 body；暗场 + 交叉淡入；prefers-reduced-motion 全静止 |
| 学习路径（`.course-path`） | 竖向序列，每章一行掌握分布；「接着学」为强调色描边卡 |
| 进度 | 数字优先（「已掌握 n · 待复习 n · 共 m」）；进度条只用于总量语义 |
| 空态/错误态/加载态 | 每个数据区块三态齐备，错误带重试按钮 |

## 五、标注约定

章节小标（如「简介 / BRIEF」）是全站双语标注约定，样式为**安静的小节标题**
（正常字重、无字距、无全大写），不做 eyebrow 式强调。

## 六、验收清单（改样式后逐条过）

1. 每页单一主题；`--learn-*` 无暗色重映射残留
2. 详情页无 `.hud-panel` 残留（图例在球面页除外）
3. 390/360 两档：面板无重叠、静态按钮无遮挡、无横向溢出
   （`audit-mobile.mjs` / `verify-mobile-panels.mjs`，D 盘 `.tmp`）
4. `npm run check` 全绿
5. 对比度：正文对背景 ≥ 4.5:1
