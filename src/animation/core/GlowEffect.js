/**
 * 光效系统
 * 负责渲染各种光效
 */

import { lerp } from '../utils/MathUtils'

export class GlowEffect {
  constructor() {
    this.time = 0
  }

  // 绘制中心光点
  drawCenterGlow(ctx, x, y, size, alpha, color = { r: 102, g: 126, b: 234 }) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`)
    gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.6})`)
    gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.3})`)
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  // 绘制核心光源
  drawCoreLight(ctx, x, y, size, alpha) {
    // 外层光晕
    const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
    outerGlow.addColorStop(0, `rgba(102, 126, 234, ${alpha * 0.3})`)
    outerGlow.addColorStop(0.5, `rgba(118, 75, 162, ${alpha * 0.15})`)
    outerGlow.addColorStop(1, 'rgba(118, 75, 162, 0)')

    ctx.beginPath()
    ctx.arc(x, y, size * 2, 0, Math.PI * 2)
    ctx.fillStyle = outerGlow
    ctx.fill()

    // 内层光源
    const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, size)
    innerGlow.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
    innerGlow.addColorStop(0.3, `rgba(102, 126, 234, ${alpha * 0.8})`)
    innerGlow.addColorStop(0.7, `rgba(118, 75, 162, ${alpha * 0.4})`)
    innerGlow.addColorStop(1, 'rgba(118, 75, 162, 0)')

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = innerGlow
    ctx.fill()
  }

  // 绘制光线辐射
  drawRays(ctx, x, y, length, alpha, rayCount = 8) {
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2
      const rayAlpha = alpha * (1 - i / rayCount * 0.5)

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      )
      ctx.strokeStyle = `rgba(255, 255, 255, ${rayAlpha})`
      ctx.lineWidth = 2 - i * 0.15
      ctx.stroke()
    }
  }

  // 绘制镜头光晕
  drawLensFlare(ctx, x, y, size, alpha) {
    // 主光晕
    const flare = ctx.createRadialGradient(x, y, 0, x, y, size)
    flare.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`)
    flare.addColorStop(0.3, `rgba(102, 126, 234, ${alpha * 0.4})`)
    flare.addColorStop(1, 'rgba(102, 126, 234, 0)')

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = flare
    ctx.fill()

    // 添加十字光芒
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.PI / 4)

    // 水平光芒
    ctx.beginPath()
    ctx.moveTo(-size * 1.5, 0)
    ctx.lineTo(size * 1.5, 0)
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
    ctx.lineWidth = 1
    ctx.stroke()

    // 垂直光芒
    ctx.beginPath()
    ctx.moveTo(0, -size * 1.5)
    ctx.lineTo(0, size * 1.5)
    ctx.stroke()

    ctx.restore()
  }

  // 绘制粒子拖尾
  drawTrail(ctx, x, y, length, alpha) {
    const gradient = ctx.createLinearGradient(x, y, x - length, y)
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - length, y)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}
