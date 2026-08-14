/**
 * Canvas 渲染组件 - 最终版
 * 借鉴参考代码，实现宇宙大爆发视觉效果
 */

import { useEffect, useRef } from 'react'
import { ParticleSystem } from './ParticleSystem'
import { StarSystem } from './StarSystem'
import { NebulaSystem } from './NebulaSystem'
import { AnimationTimeline, PHASES } from '../timeline/AnimationTimeline'
import { lerp, easeInOut, easeOut, randomRange } from '../utils/MathUtils'

export default function AnimationCanvas({ timeline }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const stateRef = useRef({
    particleSystem: null,
    starSystem: null,
    nebulaSystem: null,
    camera: { x: 0, y: 0, z: 0 },
    time: 0
  })

  // 初始化
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
      state.particleSystem = new ParticleSystem({
        maxParticles: isMobile ? 500 : 2000
      })
      state.starSystem = new StarSystem(rect.width, rect.height, {
        starCount: isMobile ? 150 : 300
      })
      state.nebulaSystem = new NebulaSystem(rect.width, rect.height, {
        nebulaCount: isMobile ? 4 : 8
      })
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
      const dt = Math.min(timestamp - lastTime, 50)
      lastTime = timestamp
      state.time += dt * 0.001

      // 更新时间轴
      const isComplete = timeline.update(timestamp)

      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      // 黑色背景
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, rect.width, rect.height)

      const phase = timeline.currentPhase
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // 更新所有系统
      if (state.particleSystem) state.particleSystem.update(dt)
      if (state.starSystem) state.starSystem.update(state.time)
      if (state.nebulaSystem) state.nebulaSystem.update(dt)

      // 根据阶段绘制
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
          // 等待用户操作
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

// 阶段1：虚空（0-4s）
function drawVoidPhase(ctx, width, height, centerX, centerY, state, timeline) {
  // 纯黑，无任何元素
}

// 阶段2：奇点诞生（4-8s）
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

  // 脉动光环
  for (let i = 0; i < 3; i++) {
    const ringProgress = (progress + i * 0.3) % 1
    const ringSize = ringProgress * 100
    const ringAlpha = (1 - ringProgress) * 0.3

    ctx.beginPath()
    ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(100, 120, 200, ${ringAlpha})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

// 阶段3：大爆发（8-14s）
function drawExplosionPhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.EXPLOSION)

  // 闪光效果
  if (progress < 0.1) {
    const flashAlpha = 1 - (progress / 0.1)
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`
    ctx.fillRect(0, 0, width, height)
  }

  // 触发粒子爆炸
  if (progress > 0.05 && progress < 0.3 && state.particleSystem.count === 0) {
    state.particleSystem.emitExplosion(centerX, centerY, 2000)
  }

  // 绘制粒子
  if (state.particleSystem) {
    state.particleSystem.draw(ctx)
  }

  // 星云开始形成
  if (progress > 0.3 && state.nebulaSystem) {
    const nebulaAlpha = (progress - 0.3) / 0.7
    ctx.globalAlpha = nebulaAlpha
    state.nebulaSystem.draw(ctx)
    ctx.globalAlpha = 1
  }
}

// 阶段4：穿越停留（14-20s）
function drawTraversePhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.TRAVERSE)

  // 绘制星云
  if (state.nebulaSystem) {
    state.nebulaSystem.draw(ctx)
  }

  // 绘制恒星
  if (state.starSystem) {
    state.starSystem.draw(ctx, state.time, 0, 0, state.camera.z)
  }

  // 绘制剩余粒子
  if (state.particleSystem) {
    state.particleSystem.draw(ctx)
  }

  // 速度线
  const velocity = Math.sin(progress * Math.PI) * 2
  if (velocity > 0.5) {
    const lineCount = Math.floor(velocity * 5)
    for (let i = 0; i < lineCount; i++) {
      const x = randomRange(0, width)
      const y = randomRange(0, height)
      const length = velocity * 20

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + length)
      ctx.strokeStyle = `rgba(150, 170, 220, ${velocity * 0.1})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

// 阶段5：按钮出现（20-26s）
function drawButtonPhase(ctx, width, height, centerX, centerY, state, timeline) {
  // 绘制星云
  if (state.nebulaSystem) {
    state.nebulaSystem.draw(ctx)
  }

  // 绘制恒星
  if (state.starSystem) {
    state.starSystem.draw(ctx, state.time, 0, 0, state.camera.z)
  }
}

// 阶段7：再次穿越（26-32s）
function drawTraverse2Phase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.TRAVERSE_2)

  // 更新相机位置
  state.camera.z += dt * 0.3

  // 绘制星云
  if (state.nebulaSystem) {
    state.nebulaSystem.draw(ctx)
  }

  // 绘制恒星（带视差）
  if (state.starSystem) {
    state.starSystem.draw(ctx, state.time, 0, 0, state.camera.z)
  }

  // 速度线
  const velocity = 1.5
  const lineCount = Math.floor(velocity * 10)
  for (let i = 0; i < lineCount; i++) {
    const x = randomRange(0, width)
    const y = randomRange(0, height)
    const length = velocity * 30

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + length)
    ctx.strokeStyle = `rgba(100, 150, 200, ${velocity * 0.15})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// 阶段8：进入首页（32-36s）
function drawEnterPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.ENTER)

  // 绘制星云
  if (state.nebulaSystem) {
    ctx.globalAlpha = 1 - progress
    state.nebulaSystem.draw(ctx)
    ctx.globalAlpha = 1
  }

  // 绘制恒星
  if (state.starSystem) {
    ctx.globalAlpha = 1 - progress
    state.starSystem.draw(ctx, state.time, 0, 0, state.camera.z)
    ctx.globalAlpha = 1
  }

  // 白色淡出
  ctx.fillStyle = `rgba(255, 255, 255, ${progress})`
  ctx.fillRect(0, 0, width, height)
}
