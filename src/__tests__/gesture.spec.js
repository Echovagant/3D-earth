// @vitest-environment node
import { describe, it, expect } from 'vitest'

import {
  isClickGesture,
  CLICK_MOVE_TOLERANCE,
  CLICK_DURATION_LIMIT,
} from '../utils/gesture'

describe('isClickGesture', () => {
  it('静止的短点击算有效点击', () => {
    expect(isClickGesture(50, 0)).toBe(true)
  })

  it('1 像素的手抖仍然算点击——位移容差要真的用得上', () => {
    // 旧实现里有个 isDragging 布尔量：按下期间只要发生过一次 mousemove 就置位，
    // 于是「位移小于 5px」这条容差永远轮不到起作用，1px 手抖就点不中。
    expect(isClickGesture(60, 1)).toBe(true)
    expect(isClickGesture(60, CLICK_MOVE_TOLERANCE - 1)).toBe(true)
  })

  it('超过位移容差算拖拽', () => {
    expect(isClickGesture(60, CLICK_MOVE_TOLERANCE)).toBe(false)
    expect(isClickGesture(60, 40)).toBe(false)
  })

  it('按得太久不算点击', () => {
    expect(isClickGesture(CLICK_DURATION_LIMIT, 0)).toBe(false)
    expect(isClickGesture(2000, 0)).toBe(false)
  })

  it('非有限值不算点击', () => {
    expect(isClickGesture(NaN, 0)).toBe(false)
    expect(isClickGesture(50, NaN)).toBe(false)
    expect(isClickGesture(undefined, undefined)).toBe(false)
  })

  it('阈值本身是明确的常量', () => {
    expect(CLICK_MOVE_TOLERANCE).toBe(5)
    expect(CLICK_DURATION_LIMIT).toBe(200)
  })
})
