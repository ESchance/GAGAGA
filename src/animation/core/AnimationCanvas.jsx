/**
 * Canvas 渲染组件
 * 负责渲染所有动画效果
 */

import { useEffect, useRef, useCallback } from 'react'
import { ParticleSystem } from './ParticleSystem'
import { StarField } from './StarField'
import { GlowEffect } from './GlowEffect'
import { SpaceEffect } from './SpaceEffect'
import { AnimationTimeline, PHASES } from '../timeline/AnimationTimeline'
import { lerp, easeInOut, randomRange } from '../utils/MathUtils'

export default function AnimationCanvas({ timeline, onComplete, isMuted }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const stateRef = useRef({
    particleSystem: null,
    starField: null,
    glowEffect: null,
    spaceEffect: null,
    camera: { x: 0, y: 0, z: 0 }
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

      // 重新初始化星场
      state.starField = new StarField(rect.width, rect.height, {
        starCount: window.innerWidth < 640 ? 150 : 300
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // 初始化效果
    state.particleSystem = new ParticleSystem({
      maxParticles: window.innerWidth < 640 ? 300 : 500
    })
    state.glowEffect = new GlowEffect()
    state.spaceEffect = new SpaceEffect()

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
      const dt = timestamp - lastTime
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

      switch (phase) {
        case PHASES.VOID:
          drawVoidPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.STAR_FORM:
          drawStarFormPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.TRAVERSE:
          drawTraversePhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline, dt)
          break

        case PHASES.CORE:
          drawCorePhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.CRACK:
          drawCrackPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break

        case PHASES.COMPLETE:
          // 动画完成，淡出
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

// 阶段1：虚空觉醒
function drawVoidPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.VOID)

  // 中心光点出现
  const glowSize = lerp(0, 30, progress)
  const glowAlpha = lerp(0, 0.8, progress)

  // 呼吸效果
  const breathe = Math.sin(progress * Math.PI * 2) * 0.2 + 0.8

  state.glowEffect.drawCenterGlow(ctx, centerX, centerY, glowSize * breathe, glowAlpha)
}

// 阶段2：星河形成
function drawStarFormPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.STAR_FORM)

  // 绘制背景星场
  state.starField.draw(ctx, timeline.currentTime * 0.001)

  // 中央光源增强
  const coreSize = lerp(30, 60, progress)
  const coreAlpha = lerp(0.8, 1, progress)
  state.glowEffect.drawCoreLight(ctx, centerX, centerY, coreSize, coreAlpha)

  // 发射粒子
  if (Math.random() < 0.3) {
    state.particleSystem.emitSpiral(centerX, centerY, 5)
  }

  // 更新和绘制粒子
  state.particleSystem.update(16)
  state.particleSystem.draw(ctx, 0, 0, 0)
}

// 阶段3：穿越星云
function drawTraversePhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.TRAVERSE)

  // 更新相机位置
  state.camera.z += dt * 0.2

  // 绘制星场（带视差）
  state.starField.draw(ctx, timeline.currentTime * 0.001, 0, 0, state.camera.z)

  // 发射粒子
  if (Math.random() < 0.5) {
    state.particleSystem.emit(
      centerX + randomRange(-200, 200),
      centerY + randomRange(-200, 200),
      3,
      { z: randomRange(100, 500), decay: 0.008 }
    )
  }

  // 更新和绘制粒子
  state.particleSystem.update(dt)
  state.particleSystem.draw(ctx, 0, 0, state.camera.z)
}

// 阶段4：抵达核心
function drawCorePhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.CORE)

  // 绘制星场
  state.starField.draw(ctx, timeline.currentTime * 0.001, 0, 0, state.camera.z)

  // 核心光源
  const coreSize = lerp(60, 150, progress)
  const coreAlpha = lerp(1, 0.8, progress)
  state.glowEffect.drawCoreLight(ctx, centerX, centerY, coreSize, coreAlpha)

  // 光线辐射
  const rayLength = lerp(100, 300, progress)
  state.glowEffect.drawRays(ctx, centerX, centerY, rayLength, lerp(0.5, 0.3, progress))

  // 镜头光晕
  const flareSize = lerp(50, 150, progress)
  state.glowEffect.drawLensFlare(ctx, centerX, centerY, flareSize, lerp(0.3, 0.6, progress))

  // 能量波纹
  state.spaceEffect.drawEnergyRipple(ctx, centerX, centerY, 100, progress, 0.5)
}

// 阶段5：空间裂开
function drawCrackPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.CRACK)

  // 绘制背景
  state.starField.draw(ctx, timeline.currentTime * 0.001, 0, 0, state.camera.z)

  // 核心光源（逐渐消失）
  const coreAlpha = lerp(0.8, 0, progress)
  state.glowEffect.drawCoreLight(ctx, centerX, centerY, 150, coreAlpha)

  // 空间裂开效果
  state.spaceEffect.drawSpaceCrack(ctx, window.innerWidth, window.innerHeight, progress, centerX, centerY)

  // 淡出效果
  if (progress > 0.8) {
    const fadeOut = (progress - 0.8) / 0.2
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeOut * 0.5})`
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
  }
}
