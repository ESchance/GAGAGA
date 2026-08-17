// 时间轴状态机：7 阶段入场动画的纯逻辑控制器（不依赖 DOM/Three，可单测）
// 渲染器只消费 update() 返回的帧快照，保证"播到哪"与"怎么画"解耦
//
// 状态流转：
//   idle --start()--> scripted --到达travel--> waiting --startAcceleration()--> accelerating --到点--> done
//                                                    \---- skip() ---------------> done（任意时刻）

import { clamp, easeInOutCubic } from './easing'

// 阶段常量表（ms）。travel 无 end（等待用户点击）；burst 由 startAcceleration 点亮
export const STAGES = [
  { key: 'nebula', start: 0, end: 2600, duration: 2600 },
  { key: 'title', start: 2600, end: 5200, duration: 2600 },
  { key: 'collapse', start: 5200, end: 7600, duration: 2400 },
  { key: 'singularity', start: 7600, end: 10200, duration: 2600 },
  { key: 'bigbang', start: 10200, end: 15000, duration: 4800 },
  { key: 'travel', start: 15000, end: null, duration: null },
  { key: 'burst', start: null, end: null, duration: 2200 },
]

const TRAVEL_INDEX = 5
const BURST_DURATION = 2200 // 点击后到完成的总时长
const SPEED_RAMP_MS = 600 // 穿梭速度 1→2 的爬升时长

export class AnimationTimeline {
  /**
   * @param {object} [opts]
   * @param {object} [opts.debug] { startAtStage?: 'nebula'|'title'|...|'travel', pause?: boolean }
   */
  constructor(opts = {}) {
    this.debug = opts.debug || {}

    this.state = 'idle'
    this.startTime = 0
    this.accelStartTime = 0
    this.elapsed = 0
    this.dt = 0
    this.lastNow = 0

    this.stageIndex = -1
    this.stage = null

    this.speedMultiplier = 1
    this.burstProgress = 0

    this._stageCbs = []
    this._completeCbs = []
  }

  start(nowMs) {
    const debugIdx = this.debug.startAtStage
      ? STAGES.findIndex((s) => s.key === this.debug.startAtStage)
      : -1

    if (debugIdx >= 0) {
      // 快进到指定阶段起点（调试用）
      this.startTime = nowMs - STAGES[debugIdx].start
    } else {
      this.startTime = nowMs
    }

    this.lastNow = nowMs
    this.state = 'scripted'
    this.elapsed = 0
    this.speedMultiplier = 1
    this.burstProgress = 0
    this._enterStage(Math.min(Math.max(debugIdx, 0), TRAVEL_INDEX))
  }

  update(nowMs) {
    if (this.state === 'done' || this.state === 'idle') return this._snapshot()

    this.dt = this.lastNow ? (nowMs - this.lastNow) / 1000 : 0
    this.lastNow = nowMs

    if (this.state === 'scripted') {
      this.elapsed = nowMs - this.startTime

      // 到达 travel 起点即进入等待（不推进阶段进度，但 dt 照常供相机漂移）
      if (this.elapsed >= STAGES[TRAVEL_INDEX].start) {
        this.elapsed = STAGES[TRAVEL_INDEX].start
        if (this.stageIndex !== TRAVEL_INDEX) this._enterStage(TRAVEL_INDEX)
        this.state = 'waiting'
        this._snapshot()
      } else {
        const idx = this._stageIndexAt(this.elapsed)
        if (idx !== this.stageIndex) this._enterStage(idx)
      }
    } else if (this.state === 'waiting') {
      this.elapsed = STAGES[TRAVEL_INDEX].start
    } else if (this.state === 'accelerating') {
      const accelElapsed = nowMs - this.accelStartTime
      this.elapsed = STAGES[TRAVEL_INDEX].start + accelElapsed

      // 速度 1→2，600ms 内 easeInOutCubic 爬升
      this.speedMultiplier =
        accelElapsed < SPEED_RAMP_MS
          ? 1 + easeInOutCubic(accelElapsed / SPEED_RAMP_MS)
          : 2

      this.burstProgress = clamp(accelElapsed / BURST_DURATION, 0, 1)

      if (accelElapsed >= BURST_DURATION) {
        this.state = 'done'
        this._emitComplete()
      }
    }

    return this._snapshot()
  }

  // 用户点击"开始探索"：waiting → accelerating
  startAcceleration(nowMs) {
    if (this.state !== 'waiting') return
    this.state = 'accelerating'
    this.accelStartTime = nowMs
    this.speedMultiplier = 1
    this.burstProgress = 0
  }

  // 立即完成（跳过/降级/卸载）
  skip() {
    if (this.state === 'done') return
    this.state = 'done'
    this._emitComplete()
  }

  onStageChange(cb) {
    this._stageCbs.push(cb)
  }

  onComplete(cb) {
    this._completeCbs.push(cb)
  }

  get isWaitingForUser() {
    return this.state === 'waiting'
  }

  get stageKey() {
    return this.stage?.key || 'nebula'
  }

  _stageIndexAt(elapsed) {
    for (let i = 0; i < STAGES.length; i++) {
      const s = STAGES[i]
      if (s.end !== null && elapsed < s.end) return i
    }
    return TRAVEL_INDEX
  }

  _enterStage(idx) {
    this.stageIndex = idx
    this.stage = STAGES[idx]
    for (const cb of this._stageCbs) cb(this.stage.key)
  }

  _emitComplete() {
    for (const cb of this._completeCbs) cb()
    this._completeCbs = []
  }

  _snapshot() {
    let stage = this.stage?.key || 'nebula'
    let localProgress = 0

    if (this.state === 'scripted' && this.stage?.duration) {
      localProgress = clamp(
        (this.elapsed - this.stage.start) / this.stage.duration,
        0,
        1
      )
    } else if (this.state === 'accelerating') {
      stage = 'burst'
      localProgress = this.burstProgress
    } else if (this.state === 'waiting') {
      stage = 'travel'
      localProgress = 0
    }

    return {
      stage,
      state: this.state,
      localProgress,
      elapsed: this.elapsed,
      dt: this.dt,
      speedMultiplier: this.speedMultiplier,
      burstProgress: this.burstProgress,
    }
  }
}
