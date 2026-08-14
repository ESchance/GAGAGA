/**
 * 动画时间轴控制系统
 * 电影级叙事体验 - 30秒完整旅程
 */

import { lerp, easeInOut, easeOut, easeIn } from '../utils/MathUtils'

// 动画阶段定义（7个阶段）
export const PHASES = {
  VOID_BIRTH: 'void_birth',       // 阶段1：虚空诞生 (0-4s)
  NEBULA_FORM: 'nebula_form',     // 阶段2：星云凝聚 (4-8s)
  TRAVERSE: 'traverse',           // 阶段3：穿越星云 (8-14s)
  DISCOVERY: 'discovery',         // 阶段4：发现星球 (14-20s)
  APPROACH: 'approach',           // 阶段5：接近星球 (20-26s)
  TRANSITION: 'transition',       // 阶段6：进入世界 (26-30s)
  COMPLETE: 'complete'            // 阶段7：完成 (30s)
}

export class AnimationTimeline {
  constructor(duration = 30000) { // 30秒
    this.duration = duration
    this.startTime = 0
    this.currentTime = 0
    this.progress = 0
    this.currentPhase = PHASES.VOID_BIRTH
    this.isPlaying = false
    this.isPaused = false

    // 阶段时间点（毫秒）- 电影级节奏
    this.phaseTimes = {
      [PHASES.VOID_BIRTH]: { start: 0, end: 4000 },      // 4秒：虚空诞生
      [PHASES.NEBULA_FORM]: { start: 4000, end: 8000 },   // 4秒：星云凝聚
      [PHASES.TRAVERSE]: { start: 8000, end: 14000 },     // 6秒：穿越星云
      [PHASES.DISCOVERY]: { start: 14000, end: 20000 },   // 6秒：发现星球
      [PHASES.APPROACH]: { start: 20000, end: 26000 },    // 6秒：接近星球
      [PHASES.TRANSITION]: { start: 26000, end: 30000 },  // 4秒：进入世界
      [PHASES.COMPLETE]: { start: 30000, end: 30000 }     // 完成
    }

    // 速度曲线（用于穿越阶段）
    this.velocityCurve = [
      { time: 0, velocity: 0 },
      { time: 0.1, velocity: 0.2 },
      { time: 0.3, velocity: 0.8 },
      { time: 0.5, velocity: 1.5 },  // 峰值
      { time: 0.7, velocity: 1.0 },
      { time: 0.9, velocity: 0.5 },
      { time: 1.0, velocity: 0 }
    ]

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
    this.currentPhase = PHASES.VOID_BIRTH
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

    if (time < this.phaseTimes[PHASES.VOID_BIRTH].end) {
      return PHASES.VOID_BIRTH
    } else if (time < this.phaseTimes[PHASES.NEBULA_FORM].end) {
      return PHASES.NEBULA_FORM
    } else if (time < this.phaseTimes[PHASES.TRAVERSE].end) {
      return PHASES.TRAVERSE
    } else if (time < this.phaseTimes[PHASES.DISCOVERY].end) {
      return PHASES.DISCOVERY
    } else if (time < this.phaseTimes[PHASES.APPROACH].end) {
      return PHASES.APPROACH
    } else if (time < this.phaseTimes[PHASES.TRANSITION].end) {
      return PHASES.TRANSITION
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

  // 获取穿越阶段的速度（基于速度曲线）
  getTraverseVelocity() {
    const progress = this.getPhaseProgress(PHASES.TRAVERSE)

    // 找到对应的速度值
    for (let i = 0; i < this.velocityCurve.length - 1; i++) {
      const current = this.velocityCurve[i]
      const next = this.velocityCurve[i + 1]

      if (progress >= current.time && progress <= next.time) {
        const localProgress = (progress - current.time) / (next.time - current.time)
        return lerp(current.velocity, next.velocity, easeInOut(localProgress))
      }
    }

    return 0
  }
}
