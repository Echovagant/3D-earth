/**
 * 深链回退。
 *
 * GitHub Pages 没有服务端重写：直接访问 /lesson/2.19 会落到 404.html，
 * 由那个文件把真实路径存进 sessionStorage，再回到入口页。
 * 入口页在这里把地址栏改回去，首次导航就会直接落到那条深链上。
 *
 * ⚠️ 调用时机必须在 createWebHistory() 之前：
 * vue-router 创建 history 时就把当前地址读进快照
 * （useHistoryStateNavigation 里 `const currentLocation = { value: createCurrentLocation(base, location) }`），
 * 之后再改地址栏它不会知道，首次导航还是会去首页，
 * 而且它随后自己的 replaceState 会把地址改回首页。
 */

const REDIRECT_KEY = '3d-earth:redirect'

/**
 * 把 404.html 记下的真实路径写回地址栏。
 *
 * 返回还原后的路径；没有深链或环境不允许时返回 null。
 */
export function restoreDeepLink() {
  let stored = null
  try {
    stored = sessionStorage.getItem(REDIRECT_KEY)
    if (stored) sessionStorage.removeItem(REDIRECT_KEY)
  } catch {
    // 隐私模式下 sessionStorage 可能不可用：没有深链也能正常打开首页
    return null
  }
  if (!stored) return null
  try {
    window.history.replaceState(null, '', stored)
  } catch {
    return null
  }
  return stored
}
