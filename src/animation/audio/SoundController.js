import { soundManager } from './SoundManager'
import { PHASES } from '../timeline/AnimationTimeline'

// 音效控制器：按动画阶段播放对应程序化音效
// 浏览器自动播放限制：需用户首次手势后调用 arm() 初始化 AudioContext
export class SoundController {
  constructor() {
    this.armed = false
  }

  // 首次用户手势后武装音频（幂等）
  arm() {
    if (this.armed) return
    soundManager.init()
    this.armed = true
  }

  // 阶段 → 音效映射
  onPhase(phase) {
    if (!this.armed) return

    switch (phase) {
      case PHASES.DARKNESS:
        soundManager.playDrone(2, 0, 0.15)
        break
      case PHASES.BIRTH:
        soundManager.playGlow(3)
        break
      case PHASES.EXPLOSION:
        soundManager.playBurst(0.6)
        break
      case PHASES.TRAVERSE:
        soundManager.playWhoosh(0.8)
        break
      case PHASES.BUTTON:
        soundManager.playAmbient(8)
        break
      case PHASES.FAST_TRAVERSE:
        soundManager.playWhoosh(1.2)
        setTimeout(() => soundManager.playWhoosh(0.8), 300)
        break
      case PHASES.ENTER:
        soundManager.playComplete()
        break
    }
  }
}
