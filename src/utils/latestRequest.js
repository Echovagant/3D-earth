/**
 * 请求竞态防护。
 *
 * 路由只换参数时 vue-router 会复用同一个组件实例，watch 会紧接着发起下一次请求。
 * 慢的旧请求后到时会把新数据覆盖成上一条（页面停在上一条内容），
 * 所以每次请求领一个自增序号：响应回来时只有序号仍是最新序号的才允许写状态，
 * 过时的响应直接丢掉，不碰页面上的任何数据。
 *
 * 组件卸载后（dispose）序号一并作废：迟到的响应不能写已卸载组件的状态。
 *
 * 一条数据流用一个守卫实例：同一条数据自己比新旧，互不相干的数据流不互相作废。
 */
export function createRequestGuard() {
  let latest = 0
  let disposed = false

  return {
    /** 请求开始时领一个序号 */
    begin() {
      latest += 1
      return latest
    },

    /** 这个序号是不是当前最新的（且组件还没卸载） */
    isCurrent(token) {
      return !disposed && token === latest
    },

    /** 组件卸载：之后的响应一律作废 */
    dispose() {
      disposed = true
      latest += 1
    },
  }
}
