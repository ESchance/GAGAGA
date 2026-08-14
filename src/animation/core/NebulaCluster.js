/**
 * 星云集群 - 由粒子连线组成的星云
 * 爆炸后随机显示在屏幕各区域，固定不动，忽明忽暗
 */

import { randomRange } from '../utils/MathUtils'

// 星云名称列表
const NEBULA_NAMES = [
  '猎户座星云',
  '仙女座星系',
  '蟹状星云',
  '鹰状星云',
  '马头星云',
  '玫瑰星云',
  '礁湖星云',
  '螺旋星云',
  '三叶星云',
  '猫眼星云',
  '环状星云',
  '北美洲星云'
]

// 星云颜色
const NEBULA_COLORS = [
  '#4169e1', // 皇家蓝
  '#9370db', // 中紫色
  '#00ced1', // 青色
  '#00bfff', // 深天蓝
  '#6a5acd', // 石板蓝
  '#483d8b', // 暗灰蓝
  '#008b8b', // 暗青色
  '#20b2aa', // 浅海蓝
]

class NebulaParticle {
  constructor(centerX, centerY, radius) {
    // 在星云中心周围随机分布
    const angle = randomRange(0, Math.PI * 2)
    const r = randomRange(0, radius)
    this.x = centerX + Math.cos(angle) * r
    this.y = centerY + Math.sin(angle) * r
    this.size = randomRange(1, 3)
    this.opacity = randomRange(0.3, 0.8)

    // 呼吸效果的随机偏移
    this.breatheOffset = randomRange(0, Math.PI * 2)
    this.breatheSpeed = randomRange(0.01, 0.03)
  }

  draw(ctx, time, isHovered, baseAlpha) {
    // 呼吸效果
    const breathe = Math.sin(time * this.breatheSpeed + this.breatheOffset) * 0.3 + 0.7
    const alpha = isHovered ? this.opacity : this.opacity * breathe * baseAlpha

    ctx.save()
    ctx.globalAlpha = alpha

    // 光晕
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 3
    )
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.5, '#e0ffff')
    gradient.addColorStop(1, 'rgba(224, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

export class NebulaCluster {
  constructor(x, y, radius, color, name) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.name = name || NEBULA_NAMES[Math.floor(Math.random() * NEBULA_NAMES.length)]

    // 生成粒子
    this.particles = []
    const particleCount = Math.floor(randomRange(8, 15))
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new NebulaParticle(x, y, radius))
    }

    // 连线阈值（粒子间距离小于此值时连线）
    this.connectionDistance = radius * 0.8

    // 呼吸效果
    this.breatheOffset = randomRange(0, Math.PI * 2)
    this.breatheSpeed = randomRange(0.008, 0.02)

    // 悬停状态
    this.isHovered = false

    // 是否可见
    this.visible = false
  }

  // 检测鼠标是否在星云范围内
  checkHover(mouseX, mouseY) {
    const dx = mouseX - this.x
    const dy = mouseY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    this.isHovered = distance <= this.radius * 1.5
    return this.isHovered
  }

  draw(ctx, time) {
    if (!this.visible) return

    // 呼吸效果
    const breathe = Math.sin(time * this.breatheSpeed + this.breatheOffset) * 0.3 + 0.7
    const baseAlpha = this.isHovered ? 1.0 : breathe

    ctx.save()

    // 绘制连线
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x
        const dy = this.particles[i].y - this.particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < this.connectionDistance) {
          const lineAlpha = (1 - distance / this.connectionDistance) * 0.3 * baseAlpha
          ctx.beginPath()
          ctx.moveTo(this.particles[i].x, this.particles[i].y)
          ctx.lineTo(this.particles[j].x, this.particles[j].y)
          ctx.strokeStyle = `rgba(100, 200, 255, ${lineAlpha})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    // 绘制粒子
    this.particles.forEach(p => p.draw(ctx, time, this.isHovered, baseAlpha))

    // 绘制星云名称（悬停时显示）
    if (this.isHovered) {
      ctx.globalAlpha = 1
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillStyle = '#00ffff'
      ctx.textAlign = 'center'
      ctx.fillText(this.name, this.x, this.y + this.radius + 20)
    }

    ctx.restore()
  }
}

// 创建多个星云集群
export function createNebulaClusters(width, height, count = 6) {
  const clusters = []
  const margin = 100

  for (let i = 0; i < count; i++) {
    // 随机位置（避免重叠）
    let x, y
    let attempts = 0
    do {
      x = randomRange(margin, width - margin)
      y = randomRange(margin, height - margin)
      attempts++
    } while (
      attempts < 50 &&
      clusters.some(c => {
        const dx = c.x - x
        const dy = c.y - y
        return Math.sqrt(dx * dx + dy * dy) < 150
      })
    )

    const radius = randomRange(30, 60)
    const color = NEBULA_COLORS[i % NEBULA_COLORS.length]
    const name = NEBULA_NAMES[i % NEBULA_NAMES.length]

    clusters.push(new NebulaCluster(x, y, radius, color, name))
  }

  return clusters
}
