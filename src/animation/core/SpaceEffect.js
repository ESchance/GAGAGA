/**
 * 空间效果
 * 负责渲染空间裂开等效果
 */

import { lerp } from '../utils/MathUtils'

export class SpaceEffect {
  constructor() {
    this.time = 0
  }

  // 绘制空间裂开效果
  drawSpaceCrack(ctx, width, height, progress, centerX, centerY) {
    if (progress <= 0) return

    ctx.save()

    // 创建裂开路径
    ctx.beginPath()

    const crackWidth = progress * width * 0.8
    const crackHeight = progress * height

    // 左侧形状
    ctx.moveTo(0, 0)
    ctx.lineTo(centerX - crackWidth / 2, 0)
    ctx.quadraticCurveTo(
      centerX - crackWidth / 4,
      centerY * 0.3,
      centerX,
      centerY
    )
    ctx.quadraticCurveTo(
      centerX + crackWidth / 4,
      centerY * 1.7,
      centerX - crackWidth / 2,
      height
    )
    ctx.lineTo(0, height)
    ctx.closePath()

    // 填充黑色背景
    ctx.fillStyle = '#000000'
    ctx.fill()

    // 右侧形状
    ctx.beginPath()
    ctx.moveTo(width, 0)
    ctx.lineTo(centerX + crackWidth / 2, 0)
    ctx.quadraticCurveTo(
      centerX + crackWidth / 4,
      centerY * 0.3,
      centerX,
      centerY
    )
    ctx.quadraticCurveTo(
      centerX - crackWidth / 4,
      centerY * 1.7,
      centerX + crackWidth / 2,
      height
    )
    ctx.lineTo(width, height)
    ctx.closePath()

    ctx.fillStyle = '#000000'
    ctx.fill()

    // 添加裂开边缘发光
    this.drawCrackEdge(ctx, centerX, centerY, crackWidth, crackHeight, progress)

    ctx.restore()
  }

  // 绘制裂开边缘发光
  drawCrackEdge(ctx, centerX, centerY, width, height, progress) {
    const glowAlpha = progress * 0.8

    // 左侧边缘
    const leftGradient = ctx.createLinearGradient(
      centerX - width / 2 - 20, centerY,
      centerX - width / 2 + 20, centerY
    )
    leftGradient.addColorStop(0, `rgba(102, 126, 234, ${glowAlpha})`)
    leftGradient.addColorStop(1, 'rgba(102, 126, 234, 0)')

    ctx.beginPath()
    ctx.moveTo(centerX - width / 2, 0)
    ctx.quadraticCurveTo(
      centerX - width / 4,
      centerY * 0.3,
      centerX,
      centerY
    )
    ctx.quadraticCurveTo(
      centerX + width / 4,
      centerY * 1.7,
      centerX - width / 2,
      height
    )
    ctx.strokeStyle = leftGradient
    ctx.lineWidth = 3
    ctx.stroke()

    // 右侧边缘
    const rightGradient = ctx.createLinearGradient(
      centerX + width / 2 + 20, centerY,
      centerX + width / 2 - 20, centerY
    )
    rightGradient.addColorStop(0, `rgba(102, 126, 234, ${glowAlpha})`)
    rightGradient.addColorStop(1, 'rgba(102, 126, 234, 0)')

    ctx.beginPath()
    ctx.moveTo(centerX + width / 2, 0)
    ctx.quadraticCurveTo(
      centerX + width / 4,
      centerY * 0.3,
      centerX,
      centerY
    )
    ctx.quadraticCurveTo(
      centerX - width / 4,
      centerY * 1.7,
      centerX + width / 2,
      height
    )
    ctx.strokeStyle = rightGradient
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // 绘制能量波纹
  drawEnergyRipple(ctx, x, y, radius, progress, alpha) {
    const rippleCount = 3
    const maxRadius = radius * 2

    for (let i = 0; i < rippleCount; i++) {
      const rippleProgress = (progress + i * 0.3) % 1
      const currentRadius = rippleProgress * maxRadius
      const rippleAlpha = alpha * (1 - rippleProgress)

      if (rippleAlpha > 0 && currentRadius > 0) {
        ctx.beginPath()
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(102, 126, 234, ${rippleAlpha})`
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
  }
}
