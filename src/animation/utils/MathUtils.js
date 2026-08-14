/**
 * 数学工具函数
 */

// 线性插值
export const lerp = (start, end, t) => {
  return start + (end - start) * t
}

// 限制值在范围内
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

// 映射值到新范围
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

// 缓动函数 - easeInOut
export const easeInOut = (t) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// 缓动函数 - easeOut
export const easeOut = (t) => {
  return t * (2 - t)
}

// 缓动函数 - easeIn
export const easeIn = (t) => {
  return t * t
}

// 缓动函数 - 弹性效果
export const easeOutElastic = (t) => {
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
}

// 随机数在范围内
export const randomRange = (min, max) => {
  return Math.random() * (max - min) + min
}

// 随机整数在范围内
export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 距离计算
export const distance = (x1, y1, x2, y2) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

// 角度计算
export const angle = (x1, y1, x2, y2) => {
  return Math.atan2(y2 - y1, x2 - x1)
}

// 角度转弧度
export const degToRad = (deg) => {
  return (deg * Math.PI) / 180
}

// 弧度转角度
export const radToDeg = (rad) => {
  return (rad * 180) / Math.PI
}
