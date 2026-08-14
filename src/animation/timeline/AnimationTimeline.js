/**
 * 动画时间轴控制系统
 * 宇宙大爆发叙事体验
 */

import { lerp, easeInOut, easeOut, easeIn } from '../utils/MathUtils'

// 动画阶段定义
export const PHASES = {
  DARKNESS: 'darkness',           // 阶段1：黑暗
  BIRTH: 'birth',                 // 阶段2：亮点诞生
  EXPLOSION: 'explosion',         // 阶段3：宇宙大爆炸
  TRAVERSE: 'traverse',           // 阶段4：穿越停留
  BUTTON: 'button',               // 阶段5：按钮出现
  RACE_SELECTION: 'race_selection', // 阶段6：种族选择（用户操作）
  TRAVERSE_2: 'traverse_2',       // 阶段7：再次穿越
  ENTER: 'enter'                  // 阶段8：进入首页
}

export class AnimationTimeline {
  constructor(duration = 26000) { // 26秒（不含种族选择时间）
    this.duration = duration
    this.startTime = 0
    this.currentTime = 0
    this.progress = 0
    this.currentPhase = PHASES.DARKNESS
    this.isPlaying = false
    this.isPaused = false
    this.isWaitingForUser = false // 等待用户点击"开始探索"

    // 阶段时间点（毫秒）
    this.phaseTimes = {
      [PHASES.DARKNESS]: { start: 0, end: 3000 },           // 3秒：黑暗
      [PHASES.BIRTH]: { start: 3000, end: 6000 },           // 3秒：亮点诞生
      [PHASES.EXPLOSION]: { start: 6000, end: 10000 },      // 4秒：宇宙大爆炸
      [PHASES.TRAVERSE]: { start: 10000, end: 14000 },      // 4秒：穿越停留
      [PHASES.BUTTON]: { start: 14000, end: 16000 },        // 2秒：按钮出现
      [PHASES.RACE_SELECTION]: { start: 16000, end: 16000 }, // 用户操作
      [PHASES.TRAVERSE_2]: { start: 16000, end: 22000 },    // 6秒：再次穿越
      [PHASES.ENTER]: { start: 22000, end: 26000 }          // 4秒：进入首页
    }

    // 回调函数
    this.onPhaseChange = null
    this.onComplete = null
    this.onProgress = null
    this.onWaitForUser = null // 等待用户点击
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

  // 用户点击"开始探索"后继续
  continueAfterUserAction() {
    this.isWaitingForUser = false
    this.startTime = performance.now() - this.phaseTimes[PHASES.TRAVERSE_2].start
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

    if (time < this.phaseTimes[PHASES.DARKNESS].end) {
      return PHASES.DARKNESS
    } else if (time < this.phaseTimes[PHASES.BIRTH].end) {
      return PHASES.BIRTH
    } else if (time < this.phaseTimes[PHASES.EXPLOSION].end) {
      return PHASES.EXPLOSION
    } else if (time < this.phaseTimes[PHASES.TRAVERSE].end) {
      return PHASES.TRAVERSE
    } else if (time < this.phaseTimes[PHASES.BUTTON].end) {
      return PHASES.BUTTON
    } else if (time < this.phaseTimes[PHASES.TRAVERSE_2].start) {
      return PHASES.RACE_SELECTION
    } else if (time < this.phaseTimes[PHASES.ENTER].start) {
      return PHASES.TRAVERSE_2
    } else {
      return PHASES.ENTER
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

  getEasedProgress(phase, easing = easeInOut) {
    const rawProgress = this.getPhaseProgress(phase)
    return easing(rawProgress)
  }

  // 获取穿越阶段的速度
  getTraverseVelocity() {
    const progress = this.getPhaseProgress(PHASES.TRAVERSE)

    // 速度曲线：慢-快-慢
    if (progress < 0.3) {
      return easeIn(progress / 0.3) * 0.8
    } else if (progress < 0.7) {
      return 0.8 + Math.sin((progress - 0.3) / 0.4 * Math.PI) * 0.4
    } else {
      return easeOut((1 - progress) / 0.3) * 0.8
    }
  }

  // 获取第二次穿越的速度（更快）
  getTraverse2Velocity() {
    const progress = this.getPhaseProgress(PHASES.TRAVERSE_2)

    // 更快的速度曲线
    if (progress < 0.2) {
      return easeIn(progress / 0.2) * 1.5
    } else if (progress < 0.8) {
      return 1.5
    } else {
      return easeOut((1 - progress) / 0.2) * 1.5
    }
  }
}
