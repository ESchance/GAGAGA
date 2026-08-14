/**
 * 数字星球效果
 * 代表网站核心理念的"数字星球"
 */

import { lerp, randomRange } from '../utils/MathUtils'

export class PlanetEffect {
  constructor() {
    this.time = 0
    this.rotation = 0
  }

  // 绘制数字星球
  draw(ctx, x, y, radius, progress, visibility = 1) {
    if (visibility <= 0) return

    const time = this.time

    ctx.save()
    ctx.globalAlpha = visibility

    // 绘制星球主体
    this.drawPlanetBody(ctx, x, y, radius, time)

    // 绘制星球纹理
    this.drawPlanetTexture(ctx, x, y, radius, time)

    // 绘制光环
    this.drawPlanetRing(ctx, x, y, radius, time)

    // 绘制光晕
    this.drawPlanetGlow(ctx, x, y, radius)

    ctx.restore()
  }

  drawPlanetBody(ctx, x, y, radius, time) {
    // 球体渐变（模拟3D效果）
    const gradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    )

    // 高光
    gradient.addColorStop(0, 'rgba(120, 140, 200, 1)')

    // 中间色
    gradient.addColorStop(0.4, 'rgba(80, 100, 160, 1)')
    gradient.addColorStop(0.6, 'rgba(60, 80, 140, 1)')

    // 阴影
    gradient.addColorStop(0.9, 'rgba(30, 40, 80, 1)')
    gradient.addColorStop(1, 'rgba(20, 25, 50, 1)')

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  drawPlanetTexture(ctx, x, y, radius, time) {
    // 绘制表面纹理（使用噪声）
    const resolution = 8
    const noiseScale = 0.05

    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.clip()

    for (let px = -radius; px < radius; px += resolution) {
      for (let py = -radius; py < radius; py += resolution) {
        const dist = Math.sqrt(px * px + py * py)
        if (dist > radius) continue

        // 简单的噪声计算
        const nx = (px + x) * noiseScale
        const ny = (py + y) * noiseScale
        const noise = Math.sin(nx * 2 + time * 0.5) * Math.cos(ny * 2 + time * 0.3) * 0.5 + 0.5

        // 只绘制部分纹理（稀疏）
        if (noise > 0.6) {
          const alpha = (noise - 0.6) * 0.3
          ctx.fillStyle = `rgba(100, 120, 180, ${alpha})`
          ctx.fillRect(x + px, y + py, resolution, resolution)
        }
      }
    }

    ctx.restore()
  }

  drawPlanetRing(ctx, x, y, radius, time) {
    // 绘制光环
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(0.3) // 倾斜角度

    // 外环
    ctx.beginPath()
    ctx.ellipse(0, 0, radius * 1.4, radius * 0.3, 0, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(150, 170, 220, 0.3)'
    ctx.lineWidth = 3
    ctx.stroke()

    // 内环
    ctx.beginPath()
    ctx.ellipse(0, 0, radius * 1.2, radius * 0.2, 0, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(180, 200, 240, 0.2)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }

  drawPlanetGlow(ctx, x, y, radius) {
    // 外层光晕
    const glowGradient = ctx.createRadialGradient(
      x, y, radius,
      x, y, radius * 1.5
    )
    glowGradient.addColorStop(0, 'rgba(100, 120, 200, 0.2)')
    glowGradient.addColorStop(0.5, 'rgba(80, 100, 180, 0.1)')
    glowGradient.addColorStop(1, 'rgba(60, 80, 160, 0)')

    ctx.beginPath()
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2)
    ctx.fillStyle = glowGradient
    ctx.fill()
  }

  // 更新时间
  update(dt) {
    this.time += dt * 0.001
    this.rotation += dt * 0.0005
  }
}
