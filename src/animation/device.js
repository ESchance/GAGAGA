// 设备能力检测与画质档位判定
// tier: 'high' | 'medium' | '2d' | 'skip'

export function isReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

// 小屏触摸设备（移动端）归入 2D，省电且兼容
export function isSmallTouch() {
  if (typeof navigator === 'undefined') return false
  return (navigator.maxTouchPoints || 0) > 0 && window.innerWidth < 768
}

export function detectTier(forced) {
  if (forced) return forced
  if (isReducedMotion()) return 'skip'

  const webgl2 = hasWebGL2()
  const mem = navigator.deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency ?? 4

  if (!webgl2 || mem < 2) return '2d'
  if (mem >= 8 && cores >= 8 && !isSmallTouch()) return 'high'
  return 'medium'
}

// 各档位的 DPR 上限与粒子数量
export function tierLimit(tier) {
  if (tier === 'high') return { dpr: 2, count: 9000 }
  if (tier === 'medium') return { dpr: 1.5, count: 4500 }
  return { dpr: 1, count: 1500 }
}
