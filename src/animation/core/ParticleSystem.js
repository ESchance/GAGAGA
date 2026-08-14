/**
 * 粒子系统 - 最终版
 * 支持固定粒子、拖影效果
 */

import { randomRange } from '../utils/MathUtils'

// 宇宙色彩配置
const COSMIC_COLORS = [
  '#ffffff', '#e0ffff', '#00ced1', '#00bfff',
  '#4169e1', '#9370db', '#ff6347', '#ff4500'
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

    // 速度差异
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

    // 尺寸差异
    const sizeRange = Math.random()
    if (sizeRange > 0.98) {
      this.size = randomRange(4, 9)
    } else if (sizeRange > 0.88) {
      this.size = randomRange(2.5, 5)
    } else if (sizeRange > 0.60) {
      this.size = randomRange(1, 2.5)
    } else if (sizeRange > 0.25) {
      this.size = randomRange(0.4, 1.2)
    } else {
      this.size = randomRange(0.1, 0.5)
    }

    this.originalSize = this.size

    // 生命周期
    this.life = 1
    const lifeRange = Math.random()
    if (lifeRange > 0.85) {
      this.decay = randomRange(0.002, 0.005)
    } else if (lifeRange > 0.50) {
      this.decay = randomRange(0.006, 0.014)
    } else if (lifeRange > 0.15) {
      this.decay = randomRange(0.012, 0.027)
    } else {
      this.decay = randomRange(0.020, 0.045)
    }

    // 宇宙色彩
    const colorRange = Math.random()
    if (colorRange > 0.90) this.color = COSMIC_COLORS[0]
    else if (colorRange > 0.75) this.color = COSMIC_COLORS[1]
    else if (colorRange > 0.60) this.color = COSMIC_COLORS[2]
    else if (colorRange > 0.45) this.color = COSMIC_COLORS[3]
    else if (colorRange > 0.30) this.color = COSMIC_COLORS[4]
    else if (colorRange > 0.18) this.color = COSMIC_COLORS[5]
    else if (colorRange > 0.08) this.color = COSMIC_COLORS[6]
    else this.color = COSMIC_COLORS[7]

    this.glowSize = this.size * 4

    // 深度模拟
    this.depth = Math.random()
    this.opacity = 0.3 + this.depth * 0.7

    // 速度衰减
    this.drag = 0.92 + Math.random() * 0.06

    // 是否被吸引到星云
    this.attractedToNebula = false
    this.targetNebula = null
    this.attractSpeed = 0.02 + Math.random() * 0.03

    // 是否已到达星云
    this.arrivedAtNebula = false
  }

  update(dt) {
    if (!this.active) return

    const dtFactor = dt / 16

    if (this.attractedToNebula && this.targetNebula) {
      // 被吸引到星云位置
      const dx = this.targetNebula.x - this.x
      const dy = this.targetNebula.y - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 10) {
        // 到达星云
        this.arrivedAtNebula = true
        this.vx = 0
        this.vy = 0
      } else {
        // 向星云移动
        this.vx = (dx / distance) * distance * this.attractSpeed
        this.vy = (dy / distance) * distance * this.attractSpeed
        this.x += this.vx * dtFactor
        this.y += this.vy * dtFactor
      }
    } else {
      // 正常飞散
      this.x += this.vx * dtFactor
      this.y += this.vy * dtFactor

      this.vx *= Math.pow(this.drag, dtFactor)
      this.vy *= Math.pow(this.drag, dtFactor)
    }

    this.life -= this.decay * dtFactor
    this.size = this.originalSize * (0.2 + this.life * 0.8)
  }

  activate() {
    this.active = true
  }

  // 设置吸引到星云
  setAttractToNebula(nebula) {
    this.attractedToNebula = true
    this.targetNebula = nebula
    this.decay = randomRange(0.001, 0.003) // 吸引粒子衰减更慢
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

// 穿梭粒子（Z轴方向）
export class TraverseParticle {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.reset()
  }

  reset() {
    // 初始位置：随机分布在屏幕上
    this.x = randomRange(0, this.width)
    this.y = randomRange(0, this.height)
    this.z = randomRange(500, 1000) // 从远处开始

    // 大小随机
    this.size = randomRange(0.5, 3)

    // 颜色随机
    const colors = ['#00ffff', '#00bfff', '#e0ffff', '#9370db', '#ffffff']
    this.color = colors[Math.floor(Math.random() * colors.length)]

    // 生命周期
    this.life = 1
    this.decay = randomRange(0.002, 0.008)

    // 速度（Z轴方向）
    this.vz = randomRange(2, 8)
  }

  update(dt) {
    const dtFactor = dt / 16

    // Z轴移动（从远到近）
    this.z -= this.vz * dtFactor

    // 如果到达屏幕，重置
    if (this.z <= 0) {
      this.reset()
    }

    this.life -= this.decay * dtFactor
    if (this.life <= 0) {
      this.reset()
    }
  }

  draw(ctx) {
    if (this.life <= 0) return

    // 计算屏幕位置（透视投影）
    const scale = 500 / (this.z + 1)
    const screenX = (this.x - this.width / 2) * scale + this.width / 2
    const screenY = (this.y - this.height / 2) * scale + this.height / 2
    const screenSize = this.size * scale

    // 检查是否在屏幕内
    if (screenX < -50 || screenX > this.width + 50 ||
        screenY < -50 || screenY > this.height + 50) {
      return
    }

    ctx.save()
    ctx.globalAlpha = this.life * Math.min(1, scale)

    // 绘制粒子
    const gradient = ctx.createRadialGradient(
      screenX, screenY, 0,
      screenX, screenY, screenSize * 2
    )
    gradient.addColorStop(0, this.color)
    gradient.addColorStop(1, this.color + '00')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, screenSize * 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

// 快速穿梭粒子（带拖影，倾斜视差）
export class FastTraverseParticle {
  constructor(width, height, isMobile = false) {
    this.width = width
    this.height = height
    this.isMobile = isMobile
    this.reset()
  }

  reset() {
    // 屏幕上的随机位置
    this.x = randomRange(0, this.width)
    this.y = randomRange(0, this.height)
    this.z = randomRange(500, 1000)

    // 倾斜方向（从屏幕中心向外发散）
    const centerX = this.width / 2
    const centerY = this.height / 2
    const angle = Math.atan2(this.y - centerY, this.x - centerX)

    // 发散速度（移动端稍慢）
    const spreadSpeed = this.isMobile ? randomRange(2, 5) : randomRange(3, 8)
    this.vx = Math.cos(angle) * spreadSpeed
    this.vy = Math.sin(angle) * spreadSpeed

    this.size = randomRange(0.5, 2.5)
    this.color = '#00ffff'

    this.life = 1
    this.decay = this.isMobile ? randomRange(0.008, 0.02) : randomRange(0.01, 0.025)

    // Z轴速度（移动端稍慢，更稳定）
    this.vz = this.isMobile ? randomRange(25, 50) : randomRange(40, 80)

    // 拖影
    this.trail = []
    this.maxTrail = this.isMobile ? 5 : 8
  }

  update(dt) {
    const dtFactor = dt / 16

    // 保存拖影
    this.trail.push({ x: this.x, y: this.y, z: this.z })
    if (this.trail.length > this.maxTrail) {
      this.trail.shift()
    }

    // Z轴移动 + 倾斜发散
    this.z -= this.vz * dtFactor
    this.x += this.vx * dtFactor
    this.y += this.vy * dtFactor

    if (this.z <= 0) {
      this.reset()
    }

    this.life -= this.decay * dtFactor
    if (this.life <= 0) {
      this.reset()
    }
  }

  draw(ctx) {
    if (this.life <= 0) return

    // 绘制拖影
    this.trail.forEach((pos, index) => {
      const scale = 500 / (pos.z + 1)
      const screenX = (pos.x - this.width / 2) * scale + this.width / 2
      const screenY = (pos.y - this.height / 2) * scale + this.height / 2
      const screenSize = this.size * scale

      const alpha = (index / this.trail.length) * 0.4 * this.life

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(screenX, screenY, Math.max(screenSize, 0.5), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 绘制当前粒子（带光晕）
    const scale = 500 / (this.z + 1)
    const screenX = (this.x - this.width / 2) * scale + this.width / 2
    const screenY = (this.y - this.height / 2) * scale + this.height / 2
    const screenSize = this.size * scale

    // 检查是否在屏幕内
    if (screenX < -50 || screenX > this.width + 50 ||
        screenY < -50 || screenY > this.height + 50) {
      return
    }

    ctx.save()
    ctx.globalAlpha = this.life * Math.min(1, scale)

    // 光晕
    const gradient = ctx.createRadialGradient(
      screenX, screenY, 0,
      screenX, screenY, screenSize * 2
    )
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.3, this.color)
    gradient.addColorStop(1, this.color + '00')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, screenSize * 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

// 粒子系统
export class ParticleSystem {
  constructor(options = {}) {
    this.particles = []
    this.maxParticles = options.maxParticles || 2000
  }

  // 触发爆炸
  emitExplosion(x, y, count = 1500) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break

      let delay
      const delayRand = Math.random()
      if (delayRand > 0.90) {
        delay = Math.random() * 500 + 200
      } else if (delayRand > 0.70) {
        delay = Math.random() * 200 + 100
      } else if (delayRand > 0.40) {
        delay = Math.random() * 100 + 50
      } else {
        delay = 0
      }

      this.particles.push(new ExplosionParticle(x, y, delay))
    }
  }

  // 固定部分粒子
  fixParticles(percentage = 0.3) {
    const activeParticles = this.particles.filter(p => p.active && p.life > 0.5)
    const count = Math.floor(activeParticles.length * percentage)

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * activeParticles.length)
      activeParticles[randomIndex].makeFixed()
    }
  }

  update(dt) {
    this.particles.forEach(p => {
      if (!p.active && p.isReady()) {
        p.activate()
      }
    })

    this.particles.forEach(p => p.update(dt))
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
