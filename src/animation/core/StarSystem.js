/**
 * 恒星系统 - 借鉴参考代码的Star类
 * 实现闪烁、光晕、衍射星芒效果
 */

import { randomRange } from '../utils/MathUtils'

const STAR_COLORS = [
  '#ffffff', '#e0ffff', '#00ced1', '#00bfff',
  '#4169e1', '#9370db', '#ff6347', '#ff4500'
]

class Star {
  constructor(width, height) {
    this.x = randomRange(0, width)
    this.y = randomRange(0, height)
    this.z = randomRange(0, 1000)

    // 大小差异
    const sizeRand = Math.random()
    if (sizeRand > 0.99) {
      this.size = randomRange(2.5, 5)      // 大星星 (1%)
    } else if (sizeRand > 0.95) {
      this.size = randomRange(1.5, 2.5)    // 中大星星 (4%)
    } else if (sizeRand > 0.8) {
      this.size = randomRange(0.8, 1.5)    // 中小星星 (15%)
    } else {
      this.size = randomRange(0.2, 0.8)    // 小星星 (80%)
    }

    this.brightness = randomRange(0.2, 1)
    this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]

    // 闪烁效果
    this.twinkleSpeed = randomRange(0.005, 0.03)
    this.twinklePhase = randomRange(0, Math.PI * 2)
    this.baseOpacity = this.brightness
    this.opacity = this.brightness

    // 衍射星芒
    this.hasSpikes = this.size > 1.8
    this.spikeLength = this.size * 4
    this.glowSize = this.size * 3
  }

  update(time) {
    // 闪烁
    this.twinklePhase += this.twinkleSpeed
    this.opacity = this.baseOpacity * (0.6 + 0.4 * Math.sin(this.twinklePhase))
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

    const size = this.size * scale
    const opacity = this.opacity * scale

    ctx.save()
    ctx.globalAlpha = opacity

    // 光晕
    const glowGradient = ctx.createRadialGradient(
      screenX, screenY, 0,
      screenX, screenY, this.glowSize * scale
    )
    glowGradient.addColorStop(0, this.color)
    glowGradient.addColorStop(0.3, this.color + '80')
    glowGradient.addColorStop(1, this.color + '00')

    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.glowSize * scale, 0, Math.PI * 2)
    ctx.fill()

    // 星核
    ctx.fillStyle = '#ffffff'
    ctx.shadowBlur = size * 3
    ctx.shadowColor = this.color
    ctx.beginPath()
    ctx.arc(screenX, screenY, Math.max(size, 0.3), 0, Math.PI * 2)
    ctx.fill()

    // 衍射星芒
    if (this.hasSpikes && size > 1) {
      ctx.strokeStyle = this.color
      ctx.lineWidth = 0.4
      ctx.globalAlpha = opacity * 0.5
      ctx.shadowBlur = 4

      ctx.beginPath()
      ctx.moveTo(screenX - this.spikeLength * scale, screenY)
      ctx.lineTo(screenX + this.spikeLength * scale, screenY)
      ctx.moveTo(screenX, screenY - this.spikeLength * scale)
      ctx.lineTo(screenX, screenY + this.spikeLength * scale)
      ctx.stroke()
    }

    ctx.restore()
  }
}

export class StarSystem {
  constructor(width, height, options = {}) {
    this.stars = []
    this.width = width
    this.height = height
    this.starCount = options.starCount || 300

    this.init()
  }

  init() {
    this.stars = []
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push(new Star(this.width, this.height))
    }
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.init()
  }

  update(time) {
    this.stars.forEach(star => star.update(time))
  }

  draw(ctx, time, cameraX = 0, cameraY = 0, cameraZ = 0) {
    // 深度排序
    this.stars.sort((a, b) => b.z - a.z)

    // 绘制所有星星
    this.stars.forEach(star => star.draw(ctx, cameraX, cameraY, cameraZ))
  }
}
