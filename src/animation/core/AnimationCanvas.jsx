/**
 * Canvas 渲染组件 - 电影级叙事体验
 * 负责渲染所有动画效果
 */

import { useEffect, useRef } from 'react'
import { DustSystem } from './DustSystem'
import { NebulaEffect } from './NebulaEffect'
import { PlanetEffect } from './PlanetEffect'
import { TransitionEffect } from './TransitionEffect'
import { AnimationTimeline, PHASES } from '../timeline/AnimationTimeline'
import { lerp, easeInOut, randomRange } from '../utils/MathUtils'

export default function AnimationCanvas({ timeline, onComplete }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const stateRef = useRef({
    dustSystem: null,
    nebulaEffect: null,
    planetEffect: null,
    transitionEffect: null,
    camera: { x: 0, y: 0, z: 0 },
    emitTimer: 0
  })

  // 初始化
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const state = stateRef.current

    // 设置画布大小
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'

      // 重新初始化系统
      const isMobile = window.innerWidth < 640
      state.dustSystem = new DustSystem({
        maxParticles: isMobile ? 100 : 200,
        width: rect.width,
        height: rect.height
      })
      state.nebulaEffect = new NebulaEffect(rect.width, rect.height)
      state.planetEffect = new PlanetEffect()
      state.transitionEffect = new TransitionEffect()
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  // 动画循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const state = stateRef.current
    let lastTime = 0

    const animate = (timestamp) => {
      const dt = Math.min(timestamp - lastTime, 50) // 限制最大dt
      lastTime = timestamp

      // 更新时间轴
      const isComplete = timeline.update(timestamp)

      // 清空画布
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      // 绘制背景
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, rect.width, rect.height)

      // 根据阶段绘制不同效果
      const phase = timeline.currentPhase
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // 更新所有效果
      state.dustSystem.update(dt)
      state.nebulaEffect.update(dt)
      state.planetEffect.update(dt)
      state.transitionEffect.update(dt)

      switch (phase) {
        case PHASES.VOID_BIRTH:
          drawVoidBirthPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.NEBULA_FORM:
          drawNebulaFormPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.TRAVERSE:
          drawTraversePhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline, dt)
          break

        case PHASES.DISCOVERY:
          drawDiscoveryPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.APPROACH:
          drawApproachPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.TRANSITION:
          drawTransitionPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.COMPLETE:
          // 动画完成
          break
      }

      // 继续动画
      if (!isComplete) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // 开始动画
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [timeline])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: '#000000' }}
    />
  )
}

// 阶段1：虚空诞生 (0-4s)
function drawVoidBirthPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.VOID_BIRTH)

  // 中心光点从无到有
  const glowSize = lerp(0, 20, progress)
  const glowAlpha = lerp(0, 0.6, progress)

  // 呼吸效果
  const breathe = Math.sin(progress * Math.PI) * 0.1 + 0.9

  // 绘制光点
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowSize * breathe
  )
  gradient.addColorStop(0, `rgba(100, 120, 200, ${glowAlpha})`)
  gradient.addColorStop(0.5, `rgba(80, 100, 180, ${glowAlpha * 0.5})`)
  gradient.addColorStop(1, 'rgba(60, 80, 160, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, glowSize * breathe, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
}

// 阶段2：星云凝聚 (4-8s)
function drawNebulaFormPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.NEBULA_FORM)

  // 绘制星云
  state.nebulaEffect.draw(ctx, centerX, centerY, 200, progress, 'blue')

  // 从边缘发射尘埃
  state.emitTimer += 16
  if (state.emitTimer > 200) {
    state.dustSystem.emitFromEdges(10)
    state.emitTimer = 0
  }

  // 更新和绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, 0)

  // 中心光点增强
  const glowSize = lerp(20, 40, progress)
  const glowAlpha = lerp(0.6, 0.8, progress)

  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowSize
  )
  gradient.addColorStop(0, `rgba(100, 120, 200, ${glowAlpha})`)
  gradient.addColorStop(0.5, `rgba(80, 100, 180, ${glowAlpha * 0.5})`)
  gradient.addColorStop(1, 'rgba(60, 80, 160, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
}

// 阶段3：穿越星云 (8-14s)
function drawTraversePhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.TRAVERSE)
  const velocity = timeline.getTraverseVelocity()

  // 更新相机位置（Z轴移动）
  state.camera.z += velocity * dt * 0.5

  // 绘制星云（带视差）
  state.nebulaEffect.draw(ctx, centerX, centerY, 250, 0.8, 'purple')

  // 从中心发射尘埃
  state.emitTimer += 16
  if (state.emitTimer > 100) {
    state.dustSystem.emitBurst(centerX, centerY, 5)
    state.emitTimer = 0
  }

  // 更新和绘制尘埃（带视差）
  state.dustSystem.draw(ctx, 0, 0, state.camera.z)

  // 绘制速度线（增强穿越感）
  if (velocity > 0.5) {
    const lineCount = Math.floor(velocity * 10)
    for (let i = 0; i < lineCount; i++) {
      const x = randomRange(0, width)
      const y = randomRange(0, height)
      const length = velocity * 30

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + length)
      ctx.strokeStyle = `rgba(150, 170, 220, ${velocity * 0.2})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

// 阶段4：发现星球 (14-20s)
function drawDiscoveryPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.DISCOVERY)

  // 绘制星云（逐渐消散）
  state.nebulaEffect.draw(ctx, centerX, centerY, 300, 1 - progress * 0.5, 'purple')

  // 绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, state.camera.z)

  // 星球从远处逐渐显现
  const planetRadius = lerp(10, 80, progress)
  const planetAlpha = lerp(0, 1, progress)

  state.planetEffect.draw(ctx, centerX, centerY, planetRadius, progress, planetAlpha)

  // 绘制光晕
  const glowGradient = ctx.createRadialGradient(
    centerX, centerY, planetRadius,
    centerX, centerY, planetRadius * 2
  )
  glowGradient.addColorStop(0, `rgba(100, 120, 200, ${planetAlpha * 0.3})`)
  glowGradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, planetRadius * 2, 0, Math.PI * 2)
  ctx.fillStyle = glowGradient
  ctx.fill()
}

// 阶段5：接近星球 (20-26s)
function drawApproachPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.APPROACH)

  // 绘制星云（继续消散）
  state.nebulaEffect.draw(ctx, centerX, centerY, 200, (1 - progress) * 0.5, 'teal')

  // 绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, state.camera.z)

  // 星球逐渐变大
  const planetRadius = lerp(80, 150, progress)

  state.planetEffect.draw(ctx, centerX, centerY, planetRadius, progress, 1)

  // 光晕增强
  const glowGradient = ctx.createRadialGradient(
    centerX, centerY, planetRadius,
    centerX, centerY, planetRadius * 1.5
  )
  glowGradient.addColorStop(0, `rgba(100, 120, 200, ${0.3 + progress * 0.2})`)
  glowGradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, planetRadius * 1.5, 0, Math.PI * 2)
  ctx.fillStyle = glowGradient
  ctx.fill()
}

// 阶段6：进入世界 (26-30s)
function drawTransitionPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.TRANSITION)

  // 绘制空间裂开效果
  state.transitionEffect.drawSpaceCrack(ctx, width, height, progress, centerX, centerY)

  // 星球逐渐消失
  const planetAlpha = 1 - progress
  if (planetAlpha > 0) {
    const planetRadius = lerp(150, 50, progress)
    state.planetEffect.draw(ctx, centerX, centerY, planetRadius, progress, planetAlpha)
  }

  // 最后阶段淡出到白色
  if (progress > 0.8) {
    const fadeProgress = (progress - 0.8) / 0.2
    ctx.fillStyle = `rgba(255, 255, 255, ${fadeProgress})`
    ctx.fillRect(0, 0, width, height)
  }
}
