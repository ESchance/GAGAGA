/**
 * 过渡效果
 * 从星球到网页的平滑过渡
 */

import { lerp, easeInOut } from '../utils/MathUtils'

export class TransitionEffect {
  constructor() {
    this.time = 0
  }

  // 绘制空间裂开效果
  drawSpaceCrack(ctx, width, height, progress, centerX, centerY) {
    if (progress <= 0) return

    ctx.save()

    // 计算裂开宽度
    const crackWidth = easeInOut(progress) * width * 0.9
    const crackHeight = easeInOut(progress) * height

    // 绘制左侧（黑色遮罩）
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(centerX - crackWidth / 2, 0)

    // 贝塞尔曲线（模拟裂开边缘）
    ctx.bezierCurveTo(
      centerX - crackWidth / 3, centerY * 0.2,
      centerX - crackWidth / 4, centerY * 0.4,
      centerX, centerY
    )
    ctx.bezierCurveTo(
      centerX + crackWidth / 4, centerY * 1.6,
      centerX + crackWidth / 3, centerY * 1.8,
      centerX - crackWidth / 2, height
    )

    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = '#000000'
    ctx.fill()

    // 绘制右侧（黑色遮罩）
    ctx.beginPath()
    ctx.moveTo(width, 0)
    ctx.lineTo(centerX + crackWidth / 2, 0)

    ctx.bezierCurveTo(
      centerX + crackWidth / 3, centerY * 0.2,
      centerX + crackWidth / 4, centerY * 0.4,
      centerX, centerY
    )
    ctx.bezierCurveTo(
      centerX - crackWidth / 4, centerY * 1.6,
      centerX - crackWidth / 3, centerY * 1.8,
      centerX + crackWidth / 2, height
    )

    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = '#000000'
    ctx.fill()

    // 绘制裂开边缘发光
    this.drawCrackGlow(ctx, centerX, centerY, crackWidth, crackHeight, progress)

    ctx.restore()
  }

  drawCrackGlow(ctx, centerX, centerY, width, height, progress) {
    const glowAlpha = easeInOut(progress) * 0.8

    // 左侧边缘发光
    ctx.beginPath()
    ctx.moveTo(centerX - width / 2, 0)
    ctx.bezierCurveTo(
      centerX - width / 3, centerY * 0.2,
      centerX - width / 4, centerY * 0.4,
      centerX, centerY
    )
    ctx.bezierCurveTo(
      centerX + width / 4, centerY * 1.6,
      centerX + width / 3, centerY * 1.8,
      centerX - width / 2, height
    )

    const leftGradient = ctx.createLinearGradient(
      centerX - width / 2 - 30, centerY,
      centerX - width / 2 + 30, centerY
    )
    leftGradient.addColorStop(0, `rgba(100, 120, 200, ${glowAlpha})`)
    leftGradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

    ctx.strokeStyle = leftGradient
    ctx.lineWidth = 4
    ctx.stroke()

    // 右侧边缘发光
    ctx.beginPath()
    ctx.moveTo(centerX + width / 2, 0)
    ctx.bezierCurveTo(
      centerX + width / 3, centerY * 0.2,
      centerX + width / 4, centerY * 0.4,
      centerX, centerY
    )
    ctx.bezierCurveTo(
      centerX - width / 4, centerY * 1.6,
      centerX - width / 3, centerY * 1.8,
      centerX + width / 2, height
    )

    const rightGradient = ctx.createLinearGradient(
      centerX + width / 2 + 30, centerY,
      centerX + width / 2 - 30, centerY
    )
    rightGradient.addColorStop(0, `rgba(100, 120, 200, ${glowAlpha})`)
    rightGradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

    ctx.strokeStyle = rightGradient
    ctx.lineWidth = 4
    ctx.stroke()
  }

  // 绘制淡出效果
  drawFadeOut(ctx, width, height, progress) {
    const alpha = easeInOut(progress)
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.fillRect(0, 0, width, height)
  }

  // 更新时间
  update(dt) {
    this.time += dt * 0.001
  }
}
