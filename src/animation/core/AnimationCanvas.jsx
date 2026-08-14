/**
 * Canvas 渲染组件 - 宇宙大爆发叙事体验
 */

import { useEffect, useRef } from 'react'
import { DustSystem } from './DustSystem'
import { NebulaEffect } from './NebulaEffect'
import { PlanetEffect } from './PlanetEffect'
import { TransitionEffect } from './TransitionEffect'
import { AnimationTimeline, PHASES } from '../timeline/AnimationTimeline'
import { lerp, easeInOut, randomRange } from '../utils/MathUtils'

export default function AnimationCanvas({ timeline }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const stateRef = useRef({
    dustSystem: null,
    nebulaEffect: null,
    planetEffect: null,
    transitionEffect: null,
    camera: { x: 0, y: 0, z: 0 },
    emitTimer: 0,
    explosionProgress: 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const state = stateRef.current

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const state = stateRef.current
    let lastTime = 0

    const animate = (timestamp) => {
      const dt = Math.min(timestamp - lastTime, 50)
      lastTime = timestamp

      const isComplete = timeline.update(timestamp)

      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      // 黑色背景
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, rect.width, rect.height)

      const phase = timeline.currentPhase
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // 更新效果
      state.dustSystem.update(dt)
      state.nebulaEffect.update(dt)
      state.planetEffect.update(dt)
      state.transitionEffect.update(dt)

      switch (phase) {
        case PHASES.DARKNESS:
          // 纯黑，无任何元素
          break

        case PHASES.BIRTH:
          drawBirthPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.EXPLOSION:
          drawExplosionPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline, dt)
          break

        case PHASES.TRAVERSE:
          drawTraversePhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline, dt)
          break

        case PHASES.BUTTON:
          drawButtonPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.RACE_SELECTION:
          // 等待用户操作，保持当前画面
          break

        case PHASES.TRAVERSE_2:
          drawTraverse2Phase(ctx, rect.width, rect.height, centerX, centerY, state, timeline, dt)
          break

        case PHASES.ENTER:
          drawEnterPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break
      }

      if (!isComplete) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

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

// 阶段1：黑暗 (0-3s)
function drawDarknessPhase(ctx, width, height) {
  // 纯黑，无任何元素
}

// 阶段2：亮点诞生 (3-6s)
function drawBirthPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.BIRTH)

  // 亮点从无到有
  const glowSize = lerp(0, 15, progress)
  const glowAlpha = lerp(0, 0.8, progress)

  // 呼吸效果
  const breathe = Math.sin(progress * Math.PI * 2) * 0.2 + 0.8

  // 绘制亮点
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowSize * breathe
  )
  gradient.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`)
  gradient.addColorStop(0.3, `rgba(200, 220, 255, ${glowAlpha * 0.8})`)
  gradient.addColorStop(0.6, `rgba(150, 180, 255, ${glowAlpha * 0.5})`)
  gradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, glowSize * breathe, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
}

// 阶段3：宇宙大爆炸 (6-10s)
function drawExplosionPhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.EXPLOSION)

  // 爆炸效果
  const explosionSize = lerp(15, 100, easeOut(progress))
  const explosionAlpha = lerp(1, 0.3, progress)

  // 中央光源
  const coreGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, explosionSize
  )
  coreGradient.addColorStop(0, `rgba(255, 255, 255, ${explosionAlpha})`)
  coreGradient.addColorStop(0.2, `rgba(200, 220, 255, ${explosionAlpha * 0.8})`)
  coreGradient.addColorStop(0.5, `rgba(100, 120, 200, ${explosionAlpha * 0.5})`)
  coreGradient.addColorStop(1, 'rgba(50, 60, 100, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, explosionSize, 0, Math.PI * 2)
  ctx.fillStyle = coreGradient
  ctx.fill()

  // 爆炸粒子
  if (progress > 0.1 && progress < 0.8) {
    state.emitTimer += dt
    if (state.emitTimer > 50) {
      state.dustSystem.emitBurst(centerX, centerY, 20)
      state.emitTimer = 0
    }
  }

  // 绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, 0)

  // 星云开始形成
  if (progress > 0.3) {
    const nebulaProgress = (progress - 0.3) / 0.7
    state.nebulaEffect.draw(ctx, centerX, centerY, 150 * nebulaProgress, nebulaProgress, 'blue')
  }
}

// 阶段4：穿越停留 (10-14s)
function drawTraversePhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.TRAVERSE)
  const velocity = timeline.getTraverseVelocity()

  // 更新相机位置
  state.camera.z += velocity * dt * 0.3

  // 绘制星云
  state.nebulaEffect.draw(ctx, centerX, centerY, 200, 0.8, 'purple')

  // 绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, state.camera.z)

  // 发射尘埃
  state.emitTimer += dt
  if (state.emitTimer > 150) {
    state.dustSystem.emitBurst(centerX, centerY, 5)
    state.emitTimer = 0
  }

  // 速度线
  if (velocity > 0.3) {
    const lineCount = Math.floor(velocity * 8)
    for (let i = 0; i < lineCount; i++) {
      const x = randomRange(0, width)
      const y = randomRange(0, height)
      const length = velocity * 25

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + length)
      ctx.strokeStyle = `rgba(150, 170, 220, ${velocity * 0.15})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

// 阶段5：按钮出现 (14-16s)
function drawButtonPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.BUTTON)

  // 绘制背景星云
  state.nebulaEffect.draw(ctx, centerX, centerY, 200, 0.8, 'purple')

  // 绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, state.camera.z)

  // 中央光源
  const glowSize = lerp(50, 80, progress)
  const glowAlpha = lerp(0.5, 0.8, progress)

  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowSize
  )
  gradient.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`)
  gradient.addColorStop(0.3, `rgba(100, 120, 200, ${glowAlpha * 0.6})`)
  gradient.addColorStop(1, 'rgba(50, 60, 100, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
}

// 阶段7：再次穿越 (16-22s)
function drawTraverse2Phase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.TRAVERSE_2)
  const velocity = timeline.getTraverse2Velocity()

  // 更新相机位置
  state.camera.z += velocity * dt * 0.5

  // 绘制星云
  state.nebulaEffect.draw(ctx, centerX, centerY, 250, 0.8, 'teal')

  // 绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, state.camera.z)

  // 发射尘埃
  state.emitTimer += dt
  if (state.emitTimer > 80) {
    state.dustSystem.emitBurst(centerX, centerY, 10)
    state.emitTimer = 0
  }

  // 速度线（更快）
  if (velocity > 0.5) {
    const lineCount = Math.floor(velocity * 12)
    for (let i = 0; i < lineCount; i++) {
      const x = randomRange(0, width)
      const y = randomRange(0, height)
      const length = velocity * 35

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + length)
      ctx.strokeStyle = `rgba(100, 150, 200, ${velocity * 0.2})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}

// 阶段8：进入首页 (22-26s)
function drawEnterPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.ENTER)

  // 绘制星云（逐渐消散）
  state.nebulaEffect.draw(ctx, centerX, centerY, 200, (1 - progress) * 0.8, 'teal')

  // 绘制尘埃
  state.dustSystem.draw(ctx, 0, 0, state.camera.z)

  // 中央光源逐渐变大变亮
  const glowSize = lerp(80, width, progress)
  const glowAlpha = lerp(0.8, 1, progress)

  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowSize
  )
  gradient.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`)
  gradient.addColorStop(0.3, `rgba(200, 220, 255, ${glowAlpha * 0.8})`)
  gradient.addColorStop(0.6, `rgba(150, 180, 255, ${glowAlpha * 0.5})`)
  gradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // 最后阶段淡出到白色
  if (progress > 0.7) {
    const fadeProgress = (progress - 0.7) / 0.3
    ctx.fillStyle = `rgba(255, 255, 255, ${fadeProgress})`
    ctx.fillRect(0, 0, width, height)
  }
}
