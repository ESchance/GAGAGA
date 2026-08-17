// 帧率监控：rAF 采样 EMA，连续 N 个周期低于阈值则触发 onSlow（用于自动降级）
// 规范：动画循环用 rAF，禁止 setInterval；本类即基于 rAF 采样

export class FpsMonitor {
  /**
   * @param {object} opts
   * @param {(fps:number)=>void} [opts.onSlow] 连续低帧时回调
   * @param {(fps:number)=>void} [opts.onFrame] 每帧回调当前 EMA fps（供调试浮层）
   * @param {number} [opts.threshold=50]
   * @param {number} [opts.consecutive=3]
   */
  constructor({ onSlow, onFrame, threshold = 50, consecutive = 3 } = {}) {
    this.onSlow = onSlow
    this.onFrame = onFrame
    this.threshold = threshold
    this.consecutive = consecutive

    this.running = false
    this.rafId = 0
    this.lastTime = 0
    this.ema = 60
    this.slowCount = 0
    this._tick = this._tick.bind(this)
  }

  start() {
    this.running = true
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this._tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.rafId)
  }

  _tick(now) {
    if (!this.running) return
    const dt = now - this.lastTime
    this.lastTime = now

    if (dt > 0) {
      const fps = 1000 / dt
      // 指数移动平均，1-EMA 平滑；封顶 120 防波动
      this.ema = this.ema + (Math.min(fps, 120) - this.ema) * 0.1

      if (this.ema < this.threshold) {
        this.slowCount++
        if (this.slowCount >= this.consecutive) {
          this.slowCount = 0
          this.onSlow?.(this.ema)
        }
      } else {
        this.slowCount = 0
      }

      this.onFrame?.(this.ema)
    }

    this.rafId = requestAnimationFrame(this._tick)
  }
}
