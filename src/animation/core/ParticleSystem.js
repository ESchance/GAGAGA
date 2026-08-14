/**
 * 粒子系统 - 借鉴参考代码的ExplosionParticle
 * 实现速度、大小、颜色、生命周期的差异
 */

import { randomRange, lerp, easeOut } from '../utils/MathUtils'

// 宇宙色彩配置
const COSMIC_COLORS = [
  '#ffffff', // 白色 - 恒星核心
  '#e0ffff', // 浅青白 - 高温恒星
  '#00ced1', // 青色 - 等离子体
  '#00bfff', // 深天蓝 - 年轻恒星
  '#4169e1', // 皇家蓝 - 蓝巨星
  '#9370db', // 中紫色 - 星云
  '#ff6347', // 珊瑚红 - 红巨星
  '#ff4500'  // 橙红色 - 超新星残骸
]

export class ExplosionParticle {
  constructor(x, y, delay = 0) {
    this.x = x
    this.y = y
    this.delay = delay
    this.startTime = performance.now()
    this.active = false

    // 随机角度
    const angle = Math.random() * Math.PI * 2

    // 速度差异：有快有慢
    const speedRange = Math.random()
    let speed
    if (speedRange > 0.95) {
      speed = Math.random() * 15 + 20  // 极快粒子 (5%)
    } else if (speedRange > 0.75) {
      speed = Math.random() * 10 + 10  // 快速粒子 (20%)
    } else if (speedRange > 0.45) {
      speed = Math.random() * 6 + 4    // 中速粒子 (30%)
    } else if (speedRange > 0.15) {
      speed = Math.random() * 3 + 1    // 慢速粒子 (30%)
    } else {
      speed = Math.random() * 1 + 0.2  // 极慢粒子 (15%)
    }

    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed

    // 尺寸差异：有的大有的小
    const sizeRange = Math.random()
    let size
    if (sizeRange > 0.98) {
      size = Math.random() * 4 + 5      // 大粒子 (2%)
    } else if (sizeRange > 0.88) {
      size = Math.random() * 2.5 + 2.5  // 中大粒子 (10%)
    } else if (sizeRange > 0.60) {
      size = Math.random() * 1.5 + 1    // 中小粒子 (28%)
    } else if (sizeRange > 0.25) {
      size = Math.random() * 0.8 + 0.4  // 小粒子 (35%)
    } else {
      size = Math.random() * 0.3 + 0.1  // 微小粒子 (25%)
    }

    this.size = size
    this.originalSize = size

    // 生命周期差异
    this.life = 1
    const lifeRange = Math.random()
    if (lifeRange > 0.85) {
      this.decay = Math.random() * 0.003 + 0.002 // 长寿命 (15%)
    } else if (lifeRange > 0.50) {
      this.decay = Math.random() * 0.008 + 0.006  // 中寿命 (35%)
    } else if (lifeRange > 0.15) {
      this.decay = Math.random() * 0.015 + 0.012  // 短寿命 (35%)
    } else {
      this.decay = Math.random() * 0.025 + 0.020  // 极短寿命 (15%)
    }

    // 宇宙色彩
    const colorRange = Math.random()
    if (colorRange > 0.90) {
      this.color = COSMIC_COLORS[0]      // 白色 (10%)
    } else if (colorRange > 0.75) {
      this.color = COSMIC_COLORS[1]      // 浅青白 (15%)
    } else if (colorRange > 0.60) {
      this.color = COSMIC_COLORS[2]      // 青色 (15%)
    } else if (colorRange > 0.45) {
      this.color = COSMIC_COLORS[3]      // 深天蓝 (15%)
    } else if (colorRange > 0.30) {
      this.color = COSMIC_COLORS[4]      // 皇家蓝 (15%)
    } else if (colorRange > 0.18) {
      this.color = COSMIC_COLORS[5]      // 中紫色 (12%)
    } else if (colorRange > 0.08) {
      this.color = COSMIC_COLORS[6]      // 珊瑚红 (10%)
    } else {
      this.color = COSMIC_COLORS[7]      // 橙红色 (8%)
    }

    this.glowSize = this.size * 4

    // 深度模拟：有的近有的远
    this.depth = Math.random()
    this.opacity = 0.3 + this.depth * 0.7

    // 速度衰减差异
    this.drag = 0.92 + Math.random() * 0.06
  }

  update(dt) {
    if (!this.active) return

    this.x += this.vx
    this.y += this.vy

    // 速度衰减
    this.vx *= this.drag
    this.vy *= this.drag

    this.life -= this.decay

    // 尺寸随生命变化
    this.size = this.originalSize * (0.2 + this.life * 0.8)
  }

  activate() {
    this.active = true
  }

  draw(ctx) {
    if (!this.active || this.life <= 0) return

    ctx.save()
    ctx.globalAlpha = this.opacity * this.life

    // 光晕
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.glowSize
    )
    glowGradient.addColorStop(0, this.color)
    glowGradient.addColorStop(0.3, this.color + '80')
    glowGradient.addColorStop(1, this.color + '00')

    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2)
    ctx.fill()

    // 核心
    ctx.fillStyle = '#ffffff'
    ctx.shadowBlur = 10
    ctx.shadowColor = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  isDead() {
    return this.active && this.life <= 0
  }

  isReady() {
    return performance.now() - this.startTime >= this.delay
  }
}

export class ParticleSystem {
  constructor(options = {}) {
    this.particles = []
    this.maxParticles = options.maxParticles || 2000
  }

  // 触发爆炸
  emitExplosion(x, y, count = 2000) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      // 延迟时间分布
      let delay
      const delayRand = Math.random()
      if (delayRand > 0.95) {
        delay = Math.random() * 800 + 400
      } else if (delayRand > 0.80) {
        delay = Math.random() * 300 + 200
      } else if (delayRand > 0.50) {
        delay = Math.random() * 150 + 50
      } else if (delayRand > 0.20) {
        delay = Math.random() * 50
      } else {
        delay = 0
      }

      this.particles.push(new ExplosionParticle(x, y, delay))
    }
  }

  // 从中心发射
  emitFromCenter(x, y, count = 50) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      const particle = new ExplosionParticle(x, y, 0)
      particle.activate()
      this.particles.push(particle)
    }
  }

  update(dt) {
    // 激活延迟的粒子
    this.particles.forEach(p => {
      if (!p.active && p.isReady()) {
        p.activate()
      }
    })

    // 更新所有粒子
    this.particles.forEach(p => p.update(dt))

    // 移除死亡的粒子
    this.particles = this.particles.filter(p => !p.isDead())
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx))
  }

  clear() {
    this.particles = []
  }

  get count() {
    return this.particles.length
  }
}
