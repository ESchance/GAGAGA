/**
 * 星云系统 - 借鉴参考代码的NebulaCloud类
 * 实现多层渐变、旋转、漂浮效果
 */

import { randomRange } from '../utils/MathUtils'

const NEBULA_COLORS = [
  '#4169e1', '#9370db', '#00ced1', '#00bfff',
  '#191970', '#483d8b', '#008b8b', '#6a5acd'
]

class NebulaCloud {
  constructor(x, y, radius, color, opacity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.opacity = opacity
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 0.0003
    this.vx = (Math.random() - 0.5) * 0.05
    this.vy = (Math.random() - 0.5) * 0.05

    // 多层效果
    this.layers = []
    for (let i = 0; i < 3; i++) {
      this.layers.push({
        offsetX: (Math.random() - 0.5) * radius * 0.3,
        offsetY: (Math.random() - 0.5) * radius * 0.3,
        radius: radius * (0.7 + Math.random() * 0.3),
        opacity: opacity * (0.5 + Math.random() * 0.5)
      })
    }
  }

  update(dt, canvasWidth, canvasHeight) {
    this.x += this.vx
    this.y += this.vy
    this.rotation += this.rotationSpeed

    // 边界检查
    if (this.x < -this.radius * 2) this.x = canvasWidth + this.radius
    if (this.x > canvasWidth + this.radius * 2) this.x = -this.radius
    if (this.y < -this.radius * 2) this.y = canvasHeight + this.radius
    if (this.y > canvasHeight + this.radius * 2) this.y = -this.radius
  }

  draw(ctx) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)

    this.layers.forEach(layer => {
      const gradient = ctx.createRadialGradient(
        layer.offsetX, layer.offsetY, 0,
        layer.offsetX, layer.offsetY, layer.radius
      )

      const hexOpacity = Math.floor(layer.opacity * 255).toString(16).padStart(2, '0')
      gradient.addColorStop(0, this.color + hexOpacity)
      gradient.addColorStop(0.4, this.color + Math.floor(layer.opacity * 128).toString(16).padStart(2, '0'))
      gradient.addColorStop(1, this.color + '00')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(layer.offsetX, layer.offsetY, layer.radius, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.restore()
  }
}

export class NebulaSystem {
  constructor(width, height, options = {}) {
    this.nebulae = []
    this.width = width
    this.height = height
    this.nebulaCount = options.nebulaCount || 8

    this.init()
  }

  init() {
    this.nebulae = []
    for (let i = 0; i < this.nebulaCount; i++) {
      const x = randomRange(0, this.width)
      const y = randomRange(0, this.height)
      const radius = randomRange(200, 350)
      const color = NEBULA_COLORS[i % NEBULA_COLORS.length]
      const opacity = randomRange(0.08, 0.28)

      this.nebulae.push(new NebulaCloud(x, y, radius, color, opacity))
    }
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.init()
  }

  update(dt) {
    this.nebulae.forEach(nebula => nebula.update(dt, this.width, this.height))
  }

  draw(ctx) {
    this.nebulae.forEach(nebula => nebula.draw(ctx))
  }
}
