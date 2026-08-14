/**
 * 星河系统
 * 负责渲染背景星空效果
 */

import { randomRange } from '../utils/MathUtils'

class Star {
  constructor(width, height) {
    this.x = randomRange(0, width)
    this.y = randomRange(0, height)
    this.z = randomRange(0, 1000)
    this.size = randomRange(0.5, 2)
    this.alpha = randomRange(0.3, 1)
    this.twinkleSpeed = randomRange(0.02, 0.08)
    this.twinkleOffset = randomRange(0, Math.PI * 2)
  }

  draw(ctx, time, cameraX, cameraY, cameraZ) {
    // 计算视差
    const scale = 1000 / (this.z - cameraZ + 1000)
    const screenX = (this.x - cameraX) * scale + ctx.canvas.width / 2
    const screenY = (this.y - cameraY) * scale + ctx.canvas.height / 2

    // 检查是否在屏幕内
    if (screenX < -10 || screenX > ctx.canvas.width + 10 ||
        screenY < -10 || screenY > ctx.canvas.height + 10) {
      return
    }

    // 闪烁效果
    const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.3 + 0.7
    const alpha = this.alpha * twinkle * scale

    // 绘制星星
    const size = this.size * scale
    ctx.beginPath()
    ctx.arc(screenX, screenY, Math.max(size, 0.3), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fill()

    // 添加光晕效果
    if (size > 1) {
      const glowSize = size * 3
      const gradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, glowSize
      )
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`)
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.beginPath()
      ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    }
  }
}

export class StarField {
  constructor(width, height, options = {}) {
    this.stars = []
    this.starCount = options.starCount || 300
    this.width = width
    this.height = height

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

  draw(ctx, time, cameraX = 0, cameraY = 0, cameraZ = 0) {
    // 深度排序
    this.stars.sort((a, b) => b.z - a.z)

    // 绘制所有星星
    this.stars.forEach(star => star.draw(ctx, time, cameraX, cameraY, cameraZ))
  }
}
