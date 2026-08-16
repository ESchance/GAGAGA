/**
 * 动画时间轴控制系统
 * 宇宙大爆发叙事体验 - 最终版
 */

import { easeInOut } from '../utils/MathUtils'

// 动画阶段定义
export const PHASES = {
  DARKNESS: 'darkness',
  BIRTH: 'birth',
  EXPLOSION: 'explosion',
  TRAVERSE: 'traverse',
  BUTTON: 'button',
  FAST_TRAVERSE: 'fast_traverse',
  ENTER: 'enter'
}

export class AnimationTimeline {
  constructor(duration = 36000) {
    this.duration = duration
    this.startTime = 0
    this.currentTime = 0
    this.progress = 0
    this.currentPhase = PHASES.DARKNESS
    this.isPlaying = false
    this.isPaused = false
    this.isWaitingForUser = false

    // 纯星空阶段加长（3s），探索按钮阶段留 11s（穿梭循环，等待用户点击）
    this.phaseTimes = {
      [PHASES.DARKNESS]: { start: 0, end: 3000 },
      [PHASES.BIRTH]: { start: 3000, end: 6000 },
      [PHASES.EXPLOSION]: { start: 6000, end: 11000 },
      [PHASES.TRAVERSE]: { start: 11000, end: 19000 },
      [PHASES.BUTTON]: { start: 19000, end: 30000 },
      [PHASES.FAST_TRAVERSE]: { start: 30000, end: 33000 },
      [PHASES.ENTER]: { start: 33000, end: 36000 }
    }

    this.onPhaseChange = null
    this.onComplete = null
    this.onProgress = null
  }

  start() {
    this.startTime = performance.now()
    this.isPlaying = true
    this.isPaused = false
    this.isWaitingForUser = false
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  continueAfterUserAction() {
    this.isWaitingForUser = false
    this.startTime = performance.now() - this.phaseTimes[PHASES.FAST_TRAVERSE].start
  }

  reset() {
    this.startTime = 0
    this.currentTime = 0
    this.progress = 0
    this.currentPhase = PHASES.DARKNESS
    this.isPlaying = false
    this.isPaused = false
    this.isWaitingForUser = false
  }

  update(timestamp) {
    if (!this.isPlaying || this.isPaused || this.isWaitingForUser) return false

    this.currentTime = timestamp - this.startTime
    this.progress = Math.min(this.currentTime / this.duration, 1)

    const newPhase = this.getCurrentPhase()
    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase
      if (this.onPhaseChange) {
        this.onPhaseChange(newPhase)
      }
    }

    if (this.onProgress) {
      this.onProgress(this.progress)
    }

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

    if (time < this.phaseTimes[PHASES.DARKNESS].end) return PHASES.DARKNESS
    if (time < this.phaseTimes[PHASES.BIRTH].end) return PHASES.BIRTH
    if (time < this.phaseTimes[PHASES.EXPLOSION].end) return PHASES.EXPLOSION
    if (time < this.phaseTimes[PHASES.TRAVERSE].end) return PHASES.TRAVERSE
    if (time < this.phaseTimes[PHASES.BUTTON].end) return PHASES.BUTTON
    if (time < this.phaseTimes[PHASES.FAST_TRAVERSE].end) return PHASES.FAST_TRAVERSE
    return PHASES.ENTER
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

  getEasedProgress(phase, easing = easeInOut) {
    const rawProgress = this.getPhaseProgress(phase)
    return easing(rawProgress)
  }
}
