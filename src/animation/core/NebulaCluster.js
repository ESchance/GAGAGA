/**
 * 星云集群 - 增强版
 * 多彩颜色、明显连线、呼吸效果、视差感、网格布局
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

// 星云颜色方案（每个星云不同颜色）
const NEBULA_COLOR_SCHEMES = [
  { main: '#4169e1', light: '#6495ed', dark: '#2850a8' },  // 皇家蓝
  { main: '#9370db', light: '#b08ce8', dark: '#6a4c93' },  // 中紫色
  { main: '#00ced1', light: '#48d1cc', dark: '#008b8b' },  // 青色
  { main: '#00bfff', light: '#5bc0de', dark: '#0086b3' },  // 深天蓝
  { main: '#6a5acd', light: '#8b7fcc', dark: '#483d8b' },  // 石板蓝
  { main: '#ff6b6b', light: '#ff8e8e', dark: '#cc4444' },  // 珊瑚红
  { main: '#4ecdc4', light: '#7eddd6', dark: '#2ea89f' },  // 薄荷绿
  { main: '#ffd93d', light: '#ffe566', dark: '#ccad00' },  // 金黄色
]

class NebulaParticle {
  constructor(centerX, centerY, radius, depth) {
    // 在星云中心周围随机分布
    const angle = randomRange(0, Math.PI * 2)
    const r = randomRange(0, radius)
    this.x = centerX + Math.cos(angle) * r
    this.y = centerY + Math.sin(angle) * r
    this.depth = depth || randomRange(0.5, 1.5) // 深度
    this.size = randomRange(1, 3) * this.depth
    this.opacity = randomRange(0.4, 0.9)

    // 呼吸效果的随机偏移
    this.breatheOffset = randomRange(0, Math.PI * 2)
    this.breatheSpeed = randomRange(0.03, 0.08)
  }

  draw(ctx, time, isHovered, baseAlpha, colorScheme) {
    // 呼吸效果（更明显）
    const breathe = Math.sin(time * this.breatheSpeed + this.breatheOffset) * 0.5 + 0.5
    const alpha = isHovered ? this.opacity : this.opacity * breathe

    ctx.save()
    ctx.globalAlpha = alpha

    // 光晕（使用星云颜色）
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 4
    )
    gradient.addColorStop(0, colorScheme.light)
    gradient.addColorStop(0.5, colorScheme.main + '80')
    gradient.addColorStop(1, colorScheme.main + '00')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2)
    ctx.fill()

    // 核心
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

export class NebulaCluster {
  constructor(x, y, radius, colorScheme, name) {
    this.x = x
    this.y = y
    this.radius = radius
    this.colorScheme = colorScheme
    this.name = name || NEBULA_NAMES[Math.floor(Math.random() * NEBULA_NAMES.length)]

    // 生成粒子（不同深度）
    this.particles = []
    const particleCount = Math.floor(randomRange(10, 18))
    for (let i = 0; i < particleCount; i++) {
      const depth = randomRange(0.5, 1.5)
      this.particles.push(new NebulaParticle(x, y, radius, depth))
    }

    // 连线阈值
    this.connectionDistance = radius * 1.2

    // 呼吸效果
    this.breatheOffset = randomRange(0, Math.PI * 2)
    this.breatheSpeed = randomRange(0.01, 0.025)

    // 悬停状态
    this.isHovered = false

    // 是否可见
    this.visible = false

    // 渐入效果
    this.fadeIn = 0 // 0 到 1
    this.fadeInSpeed = randomRange(0.005, 0.01)

    // 光晕效果（有视差，有大有小，更大的光晕）
    this.glows = []
    for (let i = 0; i < 5; i++) {
      this.glows.push({
        x: this.x + randomRange(-radius * 1.5, radius * 1.5),
        y: this.y + randomRange(-radius * 1.5, radius * 1.5),
        size: randomRange(40, 100), // 更大的光晕
        opacity: randomRange(0.1, 0.3),
        breatheOffset: randomRange(0, Math.PI * 2),
        breatheSpeed: randomRange(0.02, 0.05),
        depth: randomRange(0.5, 1.5)
      })
    }
  }

  // 检测鼠标是否在星云范围内
  checkHover(mouseX, mouseY) {
    const dx = mouseX - this.x
    const dy = mouseY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    this.isHovered = distance <= this.radius * 2
    return this.isHovered
  }

  update() {
    // 渐入效果
    if (this.visible && this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + this.fadeInSpeed)
    }
  }

  draw(ctx, time) {
    if (!this.visible) return

    // 计算渐入透明度
    const fadeAlpha = this.fadeIn

    // 呼吸效果
    const breathe = Math.sin(time * this.breatheSpeed + this.breatheOffset) * 0.5 + 0.5
    const baseAlpha = (this.isHovered ? 1.0 : breathe) * fadeAlpha

    ctx.save()

    // 绘制连线（更明显）
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x
        const dy = this.particles[i].y - this.particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < this.connectionDistance) {
          const lineAlpha = (1 - distance / this.connectionDistance) * 0.5 * baseAlpha
          ctx.beginPath()
          ctx.moveTo(this.particles[i].x, this.particles[i].y)
          ctx.lineTo(this.particles[j].x, this.particles[j].y)
          ctx.strokeStyle = this.colorScheme.main + Math.floor(lineAlpha * 255).toString(16).padStart(2, '0')
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    // 绘制粒子
    this.particles.forEach(p => p.draw(ctx, time, this.isHovered, baseAlpha, this.colorScheme))

    // 绘制光晕（有视差，有大有小）
    this.glows.forEach(glow => {
      const glowBreathe = Math.sin(time * glow.breatheSpeed + glow.breatheOffset) * 0.5 + 0.5
      const glowAlpha = glow.opacity * glowBreathe * fadeAlpha

      const gradient = ctx.createRadialGradient(
        glow.x, glow.y, 0,
        glow.x, glow.y, glow.size * glow.depth
      )
      gradient.addColorStop(0, this.colorScheme.main + Math.floor(glowAlpha * 255).toString(16).padStart(2, '0'))
      gradient.addColorStop(0.5, this.colorScheme.main + Math.floor(glowAlpha * 128).toString(16).padStart(2, '0'))
      gradient.addColorStop(1, this.colorScheme.main + '00')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(glow.x, glow.y, glow.size * glow.depth, 0, Math.PI * 2)
      ctx.fill()
    })

    // 绘制星云名称（悬停时显示）
    if (this.isHovered) {
      ctx.globalAlpha = 1
      ctx.font = '14px "JetBrains Mono", monospace'
      ctx.fillStyle = this.colorScheme.light
      ctx.textAlign = 'center'
      ctx.shadowColor = this.colorScheme.main
      ctx.shadowBlur = 10
      ctx.fillText(this.name, this.x, this.y + this.radius + 25)
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }
}

// 创建多个星云集群（区分PC端和移动端）
export function createNebulaClusters(width, height, count = 6, isMobile = false) {
  const clusters = []

  if (isMobile) {
    // 移动端：纵向布局，更分散
    const margin = 60
    const verticalSpacing = (height - margin * 2) / (count + 1)

    for (let i = 0; i < count; i++) {
      // 纵向均匀分布
      const x = randomRange(margin, width - margin)
      const y = margin + (i + 1) * verticalSpacing
      const radius = randomRange(20, 35)
      const colorScheme = NEBULA_COLOR_SCHEMES[i % NEBULA_COLOR_SCHEMES.length]
      const name = NEBULA_NAMES[i % NEBULA_NAMES.length]

      clusters.push(new NebulaCluster(x, y, radius, colorScheme, name))
    }
  } else {
    // PC端：网格布局
    const margin = 80
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    const cellWidth = (width - margin * 2) / cols
    const cellHeight = (height - margin * 2) / rows

    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)

      const x = margin + col * cellWidth + randomRange(cellWidth * 0.2, cellWidth * 0.8)
      const y = margin + row * cellHeight + randomRange(cellHeight * 0.2, cellHeight * 0.8)
      const radius = randomRange(30, 50)
      const colorScheme = NEBULA_COLOR_SCHEMES[i % NEBULA_COLOR_SCHEMES.length]
      const name = NEBULA_NAMES[i % NEBULA_NAMES.length]

      clusters.push(new NebulaCluster(x, y, radius, colorScheme, name))
    }
  }

  return clusters
}
