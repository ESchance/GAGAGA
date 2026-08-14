/**
 * 尘埃系统
 * 替代传统粒子系统，更真实的"太空尘埃"效果
 */

import { randomRange, lerp, easeOut } from '../utils/MathUtils'

class DustParticle {
  constructor(x, y, options = {}) {
    this.x = x
    this.y = y
    this.z = options.z || randomRange(0, 1000)

    // 运动属性
    this.vx = options.vx || randomRange(-0.3, 0.3)
    this.vy = options.vy || randomRange(-0.3, 0.3)
    this.vz = options.vz || randomRange(0.1, 0.5)

    // 外观属性
    this.size = options.size || randomRange(0.5, 2)
    this.alpha = options.alpha || randomRange(0.2, 0.8)
    this.blur = options.blur || randomRange(0, 1)

    // 颜色（基于深度）
    const depthFactor = this.z / 1000
    this.color = {
      r: Math.floor(lerp(180, 220, depthFactor)),
      g: Math.floor(lerp(180, 220, depthFactor)),
      b: Math.floor(lerp(200, 240, depthFactor))
    }

    // 生命周期
    this.life = 1
    this.decay = options.decay || 0.001

    // 随机偏移（用于微动效果）
    this.offsetX = randomRange(0, Math.PI * 2)
    this.offsetY = randomRange(0, Math.PI * 2)
    this.driftSpeed = randomRange(0.001, 0.005)
  }

  update(dt) {
    // 微动效果（漂浮感）
    this.x += this.vx * dt + Math.sin(this.offsetX) * 0.1
    this.y += this.vy * dt + Math.cos(this.offsetY) * 0.1
    this.z += this.vz * dt

    // 更新偏移
    this.offsetX += this.driftSpeed * dt
    this.offsetY += this.driftSpeed * dt * 0.7

    // 更新生命周期
    this.life -= this.decay * dt
  }

  draw(ctx, cameraX, cameraY, cameraZ) {
    // 计算视差
    const scale = 1000 / (this.z - cameraZ + 1000)
    const screenX = (this.x - cameraX) * scale + ctx.canvas.width / 2
    const screenY = (this.y - cameraY) * scale + ctx.canvas.height / 2

    // 检查是否在屏幕内
    if (screenX < -50 || screenX > ctx.canvas.width + 50 ||
        screenY < -50 || screenY > ctx.canvas.height + 50) {
      return
    }

    // 计算最终大小和透明度
    const size = this.size * scale
    const alpha = this.alpha * scale * this.life

    if (alpha < 0.01) return

    // 绘制尘埃（带模糊效果）
    ctx.save()
    ctx.globalAlpha = alpha

    // 如果有模糊效果，使用渐变
    if (this.blur > 0.5 && size > 1) {
      const gradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, size * 2
      )
      gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`)
      gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.3)`)
      gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`)

      ctx.beginPath()
      ctx.arc(screenX, screenY, size * 2, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    } else {
      // 普通尘埃
      ctx.beginPath()
      ctx.arc(screenX, screenY, Math.max(size, 0.3), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`
      ctx.fill()
    }

    ctx.restore()
  }

  isDead() {
    return this.life <= 0
  }
}

export class DustSystem {
  constructor(options = {}) {
    this.particles = []
    this.maxParticles = options.maxParticles || 200
    this.width = options.width || 1920
    this.height = options.height || 1080
  }

  // 从边缘生成尘埃
  emitFromEdges(count = 50) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      const edge = Math.floor(Math.random() * 4)
      let x, y

      switch (edge) {
        case 0: // 上边
          x = randomRange(0, this.width)
          y = -20
          break
        case 1: // 右边
          x = this.width + 20
          y = randomRange(0, this.height)
          break
        case 2: // 下边
          x = randomRange(0, this.width)
          y = this.height + 20
          break
        case 3: // 左边
          x = -20
          y = randomRange(0, this.height)
          break
      }

      this.particles.push(new DustParticle(x, y, {
        vx: randomRange(-0.2, 0.2),
        vy: randomRange(-0.2, 0.2),
        vz: randomRange(0.2, 0.8)
      }))
    }
  }

  // 从中心爆发
  emitBurst(x, y, count = 100) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      const angle = randomRange(0, Math.PI * 2)
      const speed = randomRange(0.5, 2)

      this.particles.push(new DustParticle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: randomRange(0.3, 1),
        size: randomRange(1, 3),
        alpha: randomRange(0.5, 1),
        decay: 0.005
      }))
    }
  }

  // 生成星云尘埃
  emitNebula(x, y, radius, count = 80) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      const angle = randomRange(0, Math.PI * 2)
      const r = randomRange(0, radius)
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r

      this.particles.push(new DustParticle(px, py, {
        vx: randomRange(-0.1, 0.1),
        vy: randomRange(-0.1, 0.1),
        vz: randomRange(0.1, 0.3),
        size: randomRange(0.5, 2),
        alpha: randomRange(0.3, 0.7),
        blur: randomRange(0.5, 1)
      }))
    }
  }

  update(dt) {
    // 更新所有尘埃
    this.particles.forEach(p => p.update(dt))

    // 移除死亡的尘埃
    this.particles = this.particles.filter(p => !p.isDead())
  }

  draw(ctx, cameraX = 0, cameraY = 0, cameraZ = 0) {
    // 深度排序（远处的先画）
    this.particles.sort((a, b) => b.z - a.z)

    // 绘制所有尘埃
    this.particles.forEach(p => p.draw(ctx, cameraX, cameraY, cameraZ))
  }

  clear() {
    this.particles = []
  }

  get count() {
    return this.particles.length
  }
}
