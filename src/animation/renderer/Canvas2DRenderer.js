// Canvas 2D 兜底渲染器（移动端 / 无 WebGL2 / 降级）
// 同一粒子系统，简单透视投影 + additive 混合；记录前帧屏幕位置实现运动拖尾

import { ParticleSystem } from '../particles/ParticleSystem'
import { tierLimit } from '../device'

export class Canvas2DRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    const { count } = tierLimit('2d')
    this.ps = new ParticleSystem(count)
    this.ps.ensureSizes()
    this.count = count

    this.w = 0
    this.h = 0
    this.camZ = 0
    this.time = 0
    this.disposed = false

    // 前帧屏幕坐标（拖尾用）
    this.prevX = new Float32Array(count)
    this.prevY = new Float32Array(count)
    this.hasPrev = false
  }

  async init() {}

  resize(w, h) {
    this.w = w
    this.h = h
    this.canvas.width = w
    this.canvas.height = h
  }

  update(snapshot) {
    if (this.disposed) return

    this.ps.update(snapshot)
    this.time += snapshot.dt

    const ctx = this.ctx
    const { w, h } = this

    // 深邃星空背景（渐变，保持暗色以凸显亮粒子）
    ctx.globalCompositeOperation = 'source-over'
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    bg.addColorStop(0, '#0d1330')
    bg.addColorStop(1, '#05070f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    // 相机前进（与 Three 一致）
    if (snapshot.stage === 'travel' || snapshot.stage === 'burst') {
      const speed =
        snapshot.stage === 'burst' ? 80 * snapshot.speedMultiplier : 40
      this.camZ += speed * snapshot.dt
    }

    const cx = w / 2
    const cy = h / 2
    const fov = 500
    const isBurst = snapshot.stage === 'burst'

    ctx.globalCompositeOperation = 'lighter'

    for (let i = 0; i < this.count; i++) {
      const p = this.ps.particles[i]
      const dist = Math.max(fov - p.z + this.camZ, 1)
      const scale = fov / dist
      const sx = cx + p.x * scale
      const sy = cy + p.y * scale
      const size = (p.size || p.baseSize) * scale * 1.2

      if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) continue

      const alpha = 0.75 + 0.25 * (0.5 + 0.5 * Math.sin(this.time * 2 + p.phase))
      const r = Math.round(p.r * 255)
      const g = Math.round(p.g * 255)
      const b = Math.round(p.b * 255)

      // 运动拖尾：连接前帧位置
      if (this.hasPrev) {
        ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`
        ctx.lineWidth = Math.max(size * 0.4, 0.5)
        ctx.beginPath()
        ctx.moveTo(this.prevX[i], this.prevY[i])
        ctx.lineTo(sx, sy)
        ctx.stroke()
      }

      // 发光圆点
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size)
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.7})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(sx, sy, size, 0, Math.PI * 2)
      ctx.fill()

      this.prevX[i] = sx
      this.prevY[i] = sy
    }

    this.hasPrev = true
    if (isBurst) {
      // 光亮布满：白雾覆盖（进度决定不透明度）
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = `rgba(255,255,255,${snapshot.burstProgress})`
      ctx.fillRect(0, 0, w, h)
    }
  }

  dispose() {
    this.disposed = true
    this.ctx = null
  }
}
