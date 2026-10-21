/**
 * 点击手势判定。
 *
 * 判定只看两件事：按下到抬起的**位移**和**时长**。
 *
 * 早期实现里还有一个 `isDragging` 布尔量——鼠标按下期间只要发生过一次 mousemove
 * 就置位，于是「位移小于 5px」这条容差永远轮不到起作用：手抖 1px 就点不中。
 * 位移阈值本身已经涵盖了拖拽，不需要额外的布尔量。
 */

/** 位移容差（像素） */
export const CLICK_MOVE_TOLERANCE = 5
/** 时长上限（毫秒） */
export const CLICK_DURATION_LIMIT = 200

/**
 * 是否算一次有效点击。
 *
 * @param {number} duration 按下到抬起的时长（毫秒）
 * @param {number} moveDistance 按下点到抬起点的位移（像素）
 */
export function isClickGesture(duration, moveDistance) {
  if (!Number.isFinite(duration) || !Number.isFinite(moveDistance)) return false
  return duration < CLICK_DURATION_LIMIT && moveDistance < CLICK_MOVE_TOLERANCE
}
