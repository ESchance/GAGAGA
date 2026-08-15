/**
 * 设备能力检测与渲染画质档位
 * 档位：'high'（PC + WebGL2 + 强 GPU，含 Bloom 后处理）
 *      'medium'（PC + WebGL2 + 弱 GPU，无后处理、粒子减半）
 *      '2d'（移动端或无 WebGL2，使用 Canvas 2D 渲染，不加载 three）
 */

// 移动端判定：与现有 AnimationCanvas 的 640px 阈值保持一致
export const isMobile = () => {
  return typeof window !== 'undefined' && window.innerWidth < 640
}

// 检测 WebGL2 支持（three r163+ 仅支持 WebGL2）
export const hasWebGL2 = () => {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

// 弱 GPU 检测：内存 ≤4GB 或 CPU 核数 ≤4 时降为中配
const isWeakDevice = () => {
  const memory = navigator.deviceMemory || 8
  const cores = navigator.hardwareConcurrency || 8
  return memory <= 4 || cores <= 4
}

// 获取渲染画质档位
export const getQualityProfile = () => {
  if (isMobile()) return '2d'
  if (!hasWebGL2()) return '2d'
  return isWeakDevice() ? 'medium' : 'high'
}
