/**
 * 动画时间轴控制系统
 * 管理动画的各个阶段和进度
 */

import { lerp, easeInOut, easeOut, easeIn } from '../utils/MathUtils'

// 动画阶段定义
export const PHASES = {
  VOID: 'void',           // 虚空觉醒
  STAR_FORM: 'star_form', // 星河形成
  TRAVERSE: 'traverse',   // 穿越星云
  CORE: 'core',           // 抵达核心
  CRACK: 'crack',         // 空间裂开
  COMPLETE: 'complete'    // 完成
}

export class AnimationTimeline {
  constructor(duration = 5000) {
    this.duration = duration
    this.startTime = 0
    this.currentTime = 0
    this.progress = 0
    this.currentPhase = PHASES.VOID
    this.isPlaying = false
    this.isPaused = false

    // 阶段时间点（毫秒）
    this.phaseTimes = {
      [PHASES.VOID]: { start: 0, end: 1000 },
      [PHASES.STAR_FORM]: { start: 1000, end: 2000 },
      [PHASES.TRAVERSE]: { start: 2000, end: 3000 },
      [PHASES.CORE]: { start: 3000, end: 4000 },
      [PHASES.CRACK]: { start: 4000, end: 5000 },
      [PHASES.COMPLETE]: { start: 5000, end: 5000 }
    }

    // 回调函数
    this.onPhaseChange = null
    this.onComplete = null
    this.onProgress = null
  }

  start() {
    this.startTime = performance.now()
    this.isPlaying = true
    this.isPaused = false
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  reset() {
    this.startTime = 0
    this.currentTime = 0
    this.progress = 0
    this.currentPhase = PHASES.VOID
    this.isPlaying = false
    this.isPaused = false
  }

  update(timestamp) {
    if (!this.isPlaying || this.isPaused) return false

    this.currentTime = timestamp - this.startTime
    this.progress = Math.min(this.currentTime / this.duration, 1)

    // 更新当前阶段
    const newPhase = this.getCurrentPhase()
    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase
      if (this.onPhaseChange) {
        this.onPhaseChange(newPhase)
      }
    }

    // 触发进度回调
    if (this.onProgress) {
      this.onProgress(this.progress)
    }

    // 检查是否完成
    if (this.progress >= 1) {
      this.isPlaying = false
      if (this.onComplete) {
        this.onComplete()
      }
      return true
    }

    return false
  }

  getCurrentPhase() {
    const time = this.currentTime

    if (time < this.phaseTimes[PHASES.VOID].end) {
      return PHASES.VOID
    } else if (time < this.phaseTimes[PHASES.STAR_FORM].end) {
      return PHASES.STAR_FORM
    } else if (time < this.phaseTimes[PHASES.TRAVERSE].end) {
      return PHASES.TRAVERSE
    } else if (time < this.phaseTimes[PHASES.CORE].end) {
      return PHASES.CORE
    } else if (time < this.phaseTimes[PHASES.CRACK].end) {
      return PHASES.CRACK
    } else {
      return PHASES.COMPLETE
    }
  }

  getPhaseProgress(phase) {
    const phaseTime = this.phaseTimes[phase]
    if (!phaseTime) return 0

    const phaseDuration = phaseTime.end - phaseTime.start
    const phaseElapsed = this.currentTime - phaseTime.start

    return Math.max(0, Math.min(1, phaseElapsed / phaseDuration))
  }

  getOverallProgress() {
    return this.progress
  }

  // 获取缓动后的进度
  getEasedProgress(phase, easing = easeInOut) {
    const rawProgress = this.getPhaseProgress(phase)
    return easing(rawProgress)
  }
}
