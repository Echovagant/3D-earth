/**
 * 演示动画的注册表。
 *
 * 演示是一段嵌在知识点页里的动态图解——补上「老师用文字描述一个场景、
 * 学生只能靠想象补上画面」的那一截。互动实验解决的是「你会不会做」，
 * 演示解决的是「你看，这样动一下你就懂了」，两者不重复。
 *
 * 每个演示一个组件，放在 src/components/demos/ 下，文件名去掉 Demo 后缀
 * 再转成短横线就是演示 id（TerminatorCircleDemo → terminator-circle）。
 * 人工表里写的是 id，构建脚本带进知识点数据，知识点页按 id 取组件。
 *
 * 演示与它的解说文案必须放在一起：改了动画就要改文案，拆到两个文件
 * 迟早会对不上。所以文案不进知识数据，由组件自己带着。
 */
const files = import.meta.glob('../components/demos/*.vue')

/** TerminatorCircleDemo → terminator-circle */
const toDemoId = (fileName) =>
  fileName
    .replace(/Demo$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()

export const DEMO_LOADERS = Object.fromEntries(
  Object.entries(files).map(([path, loader]) => [
    toDemoId(path.split('/').pop().replace('.vue', '')),
    loader,
  ]),
)

/** 全部演示 id——测试用它核对「人工表里写的 id 都真实存在」 */
export const DEMO_IDS = Object.keys(DEMO_LOADERS)
