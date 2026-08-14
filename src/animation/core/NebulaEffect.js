/**
 * 星云效果
 * 使用噪声算法生成真实的星云纹理
 */

import { lerp, randomRange } from '../utils/MathUtils'

// 简化的 Perlin 噪声
class SimplexNoise {
  constructor(seed = 0) {
    this.seed = seed
  }

  noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453
    return n - Math.floor(n)
  }

  // 分形噪声
  fractal(x, y, octaves = 4) {
    let value = 0
    let amplitude = 1
    let frequency = 1

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    return value
  }
}

export class NebulaEffect {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.noise = new SimplexNoise(42)
    this.time = 0
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  // 绘制星云层
  draw(ctx, centerX, centerY, radius, progress, colorScheme = 'blue') {
    const time = this.time

    // 颜色方案
    const colors = {
      blue: { r: 30, g: 60, b: 120 },
      purple: { r: 60, g: 30, b: 120 },
      teal: { r: 30, g: 100, b: 120 }
    }

    const baseColor = colors[colorScheme] || colors.blue

    // 绘制多层星云
    for (let layer = 0; layer < 3; layer++) {
      const layerProgress = Math.min(1, progress * (1 + layer * 0.3))
      const layerRadius = radius * (1 + layer * 0.5)
      const layerAlpha = 0.15 * (1 - layer * 0.3)

      this.drawNebulaLayer(ctx, centerX, centerY, layerRadius, layerAlpha, baseColor, layer, time)
    }
  }

  drawNebulaLayer(ctx, centerX, centerY, radius, alpha, baseColor, layerIndex, time) {
    const resolution = 50 // 采样分辨率

    for (let x = -radius; x < radius; x += resolution) {
      for (let y = -radius; y < radius; y += resolution) {
        const dist = Math.sqrt(x * x + y * y)
        if (dist > radius) continue

        // 计算噪声值
        const nx = (x + centerX) / 200
        const ny = (y + centerY) / 200
        const noiseValue = this.noise.fractal(nx + time * 0.01, ny + time * 0.01, 3)

        // 根据噪声值和距离计算透明度
        const distFactor = 1 - (dist / radius)
        const alpha = noiseValue * distFactor * 0.3

        if (alpha < 0.01) continue

        // 计算颜色（带随机变化）
        const colorVariation = this.noise.noise2D(nx * 10, ny * 10) * 30
        const r = Math.min(255, baseColor.r + colorVariation)
        const g = Math.min(255, baseColor.g + colorVariation)
        const b = Math.min(255, baseColor.b + colorVariation)

        // 绘制星云块
        ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha})`
        ctx.fillRect(
          centerX + x - resolution / 2,
          centerY + y - resolution / 2,
          resolution,
          resolution
        )
      }
    }
  }

  // 绘制星云边缘（更柔和）
  drawNebulaEdge(ctx, centerX, centerY, radius, progress) {
    const edgeWidth = radius * 0.3
    const innerRadius = radius - edgeWidth

    // 创建边缘渐变
    const gradient = ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, radius
    )
    gradient.addColorStop(0, 'rgba(60, 30, 120, 0)')
    gradient.addColorStop(0.3, 'rgba(60, 30, 120, 0.1)')
    gradient.addColorStop(0.7, 'rgba(60, 30, 120, 0.05)')
    gradient.addColorStop(1, 'rgba(60, 30, 120, 0)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  // 更新时间
  update(dt) {
    this.time += dt * 0.001
  }
}
