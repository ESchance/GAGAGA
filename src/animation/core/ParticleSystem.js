/**
 * 粒子系统
 * 负责管理和渲染所有粒子
 */

import { randomRange, lerp, easeOut } from '../utils/MathUtils'

export class Particle {
  constructor(x, y, options = {}) {
    this.x = x
    this.y = y
    this.z = options.z || randomRange(0, 1000)

    // 速度
    this.vx = options.vx || randomRange(-1, 1)
    this.vy = options.vy || randomRange(-1, 1)
    this.vz = options.vz || randomRange(0.5, 2)

    // 大小和颜色
    this.size = options.size || randomRange(1, 3)
    this.alpha = options.alpha || 1
    this.color = options.color || { r: 255, g: 255, b: 255 }

    // 生命周期
    this.life = 1
    this.decay = options.decay || 0.005

    // 角度（用于螺旋运动）
    this.angle = options.angle || randomRange(0, Math.PI * 2)
    this.angleSpeed = options.angleSpeed || randomRange(0.01, 0.05)
    this.radius = options.radius || randomRange(50, 200)
  }

  update(dt) {
    // 更新位置
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.z += this.vz * dt

    // 更新角度（螺旋运动）
    this.angle += this.angleSpeed * dt

    // 更新生命周期
    this.life -= this.decay * dt

    // 更新透明度
    this.alpha = this.life
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

    // 绘制粒子
    const size = this.size * scale
    const alpha = this.alpha * scale

    ctx.beginPath()
    ctx.arc(screenX, screenY, Math.max(size, 0.5), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`
    ctx.fill()
  }

  isDead() {
    return this.life <= 0
  }
}

export class ParticleSystem {
  constructor(options = {}) {
    this.particles = []
    this.maxParticles = options.maxParticles || 500
    this.emitRate = options.emitRate || 10
    this.emitTimer = 0
  }

  emit(x, y, count = 1, options = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length < this.maxParticles) {
        this.particles.push(new Particle(x, y, options))
      }
    }
  }

  emitSpiral(centerX, centerY, count = 100) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = randomRange(20, 80)
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      this.particles.push(new Particle(x, y, {
        angle: angle,
        angleSpeed: randomRange(0.02, 0.08),
        radius: radius,
        vx: Math.cos(angle) * 0.5,
        vy: Math.sin(angle) * 0.5,
        size: randomRange(1, 2.5),
        decay: 0.003
      }))
    }
  }

  emitBurst(x, y, count = 200) {
    for (let i = 0; i < count; i++) {
      const angle = randomRange(0, Math.PI * 2)
      const speed = randomRange(1, 5)

      this.particles.push(new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randomRange(1, 3),
        decay: 0.01
      }))
    }
  }

  update(dt) {
    // 更新所有粒子
    this.particles.forEach(p => p.update(dt))

    // 移除死亡的粒子
    this.particles = this.particles.filter(p => !p.isDead())
  }

  draw(ctx, cameraX = 0, cameraY = 0, cameraZ = 0) {
    // 深度排序
    this.particles.sort((a, b) => b.z - a.z)

    // 绘制所有粒子
    this.particles.forEach(p => p.draw(ctx, cameraX, cameraY, cameraZ))
  }

  clear() {
    this.particles = []
  }

  get count() {
    return this.particles.length
  }
}
