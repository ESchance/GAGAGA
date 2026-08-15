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
  constructor(duration = 28000) {
    this.duration = duration
    this.startTime = 0
    this.currentTime = 0
    this.progress = 0
    this.currentPhase = PHASES.DARKNESS
    this.isPlaying = false
    this.isPaused = false
    this.isWaitingForUser = false

    this.phaseTimes = {
      [PHASES.DARKNESS]: { start: 0, end: 2000 },
      [PHASES.BIRTH]: { start: 2000, end: 5000 },
      [PHASES.EXPLOSION]: { start: 5000, end: 10000 },
      [PHASES.TRAVERSE]: { start: 10000, end: 16000 },
      [PHASES.BUTTON]: { start: 16000, end: 22000 },
      [PHASES.FAST_TRAVERSE]: { start: 22000, end: 25000 },
      [PHASES.ENTER]: { start: 25000, end: 28000 }
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
