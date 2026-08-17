// 时间轴状态机：7 阶段入场动画的纯逻辑控制器（不依赖 DOM/Three，可单测）
// 渲染器只消费 update() 返回的帧快照，保证"播到哪"与"怎么画"解耦
//
// 关键设计：elapsed / 加速进度全部用【相对增量 dt 累加】，
// 不依赖绝对时间基准——避免 rAF 回调的 timestamp 与 performance.now() 在不同环境基准不一致，
// 导致阶段永远无法推进。唯一要求：rAF 回调的 now 单调递增。
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
const TRAVEL_START = STAGES[TRAVEL_INDEX].start
const BURST_DURATION = 2200 // 点击后到完成的总时长
const SPEED_RAMP_MS = 600 // 穿梭速度 1→2 的爬升时长

export class AnimationTimeline {
  /**
   * @param {object} [opts]
   * @param {object} [opts.debug] { startAtStage?: 'nebula'|'title'|..., pause?: boolean }
   */
  constructor(opts = {}) {
    this.debug = opts.debug || {}

    this.state = 'idle'
    this.lastNow = null // 上一帧时间（用于 dt）
    this.elapsed = 0
    this.dt = 0
    this.accelElapsed = 0

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
    const startIdx = Math.min(Math.max(debugIdx, 0), TRAVEL_INDEX)

    this.lastNow = nowMs
    this.elapsed = debugIdx >= 0 ? STAGES[debugIdx].start : 0
    this.state = 'scripted'
    this.accelElapsed = 0
    this.speedMultiplier = 1
    this.burstProgress = 0
    this._enterStage(startIdx)
  }

  update(nowMs) {
    if (this.state === 'done' || this.state === 'idle') return this._snapshot()

    // 相对增量累加：只依赖本时间源的递增
    const rawDt = this.lastNow !== null ? (nowMs - this.lastNow) / 1000 : 0
    this.lastNow = nowMs
    this.dt = rawDt

    if (this.state === 'scripted') {
      this.elapsed += rawDt * 1000

      if (this.elapsed >= TRAVEL_START) {
        this.elapsed = TRAVEL_START
        if (this.stageIndex !== TRAVEL_INDEX) this._enterStage(TRAVEL_INDEX)
        this.state = 'waiting'
      } else {
        const idx = this._stageIndexAt(this.elapsed)
        if (idx !== this.stageIndex) this._enterStage(idx)
      }
    } else if (this.state === 'waiting') {
      this.elapsed = TRAVEL_START
    } else if (this.state === 'accelerating') {
      this.accelElapsed += rawDt * 1000
      this.elapsed = TRAVEL_START + this.accelElapsed
      this.speedMultiplier =
        this.accelElapsed < SPEED_RAMP_MS
          ? 1 + easeInOutCubic(this.accelElapsed / SPEED_RAMP_MS)
          : 2
      this.burstProgress = clamp(this.accelElapsed / BURST_DURATION, 0, 1)

      if (this.accelElapsed >= BURST_DURATION) {
        this.state = 'done'
        this._emitComplete()
      }
    }

    return this._snapshot()
  }

  // 用户点击"开始探索"：waiting → accelerating（时间用内部累加，无需外部传参）
  startAcceleration() {
    if (this.state !== 'waiting') return
    this.state = 'accelerating'
    this.accelElapsed = 0
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
