// 缓动函数库：动画专用，全部为 0..1 输入/输出

export const linear = (t) => t

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const lerp = (a, b, t) => a + (b - a) * t

// 指数缓出（入场）：快速起、慢速收
export const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

// 指数缓入（坍缩/吸入）：慢起、骤快收
export const expoIn = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * (t - 1)))

// 三次缓入缓出（银河就位）
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// 弹性缓出（标题冒出）：略微过冲回弹
export const backOut = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// 正弦漂移：0..1 周期循环（闪烁/脉冲）
export const sinDrift = (t) => (Math.sin(t * Math.PI * 2) + 1) / 2
