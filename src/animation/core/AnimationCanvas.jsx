/**
 * Canvas 渲染组件 - 最终版
 * 炸开+固定粒子+呼吸光源+HUD穿梭+快速穿梭+星云集群
 */

import { useEffect, useRef } from 'react'
import { ParticleSystem, TraverseParticle, FastTraverseParticle } from './ParticleSystem'
import { StarSystem } from './StarSystem'
import { NebulaSystem } from './NebulaSystem'
import { createNebulaClusters } from './NebulaCluster'
import { PHASES } from '../timeline/AnimationTimeline'
import { lerp } from '../utils/MathUtils'

export default function AnimationCanvas({ timeline, onNebulaHover }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const stateRef = useRef({
    particleSystem: null,
    starSystem: null,
    nebulaSystem: null,
    nebulaClusters: [],
    traverseParticles: [],
    fastTraverseParticles: [],
    camera: { x: 0, y: 0, z: 0 },
    time: 0,
    explosionTriggered: false,
    attractTriggered: false,
    clustersVisible: false,
    shakeTrauma: 0,
    mouseX: 0,
    mouseY: 0
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
      state.particleSystem = new ParticleSystem({
        maxParticles: isMobile ? 800 : 1500
      })
      state.starSystem = new StarSystem(rect.width, rect.height, {
        starCount: isMobile ? 150 : 300
      })
      state.nebulaSystem = new NebulaSystem(rect.width, rect.height, {
        nebulaCount: isMobile ? 4 : 8
      })

      // 创建星云集群（区分移动端和PC端）
      state.nebulaClusters = createNebulaClusters(rect.width, rect.height, isMobile ? 4 : 6, isMobile)

      // 创建穿梭粒子
      state.traverseParticles = []
      for (let i = 0; i < (isMobile ? 60 : 120); i++) {
        state.traverseParticles.push(new TraverseParticle(rect.width, rect.height))
      }

      // 创建快速穿梭粒子（区分移动端）
      state.fastTraverseParticles = []
      for (let i = 0; i < (isMobile ? 80 : 150); i++) {
        state.fastTraverseParticles.push(new FastTraverseParticle(rect.width, rect.height, isMobile))
      }

      state.explosionTriggered = false
      state.attractTriggered = false
      state.clustersVisible = false
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // 监听鼠标移动
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      state.mouseX = e.clientX - rect.left
      state.mouseY = e.clientY - rect.top

      // 检测星云悬停
      if (state.clustersVisible) {
        let foundHovered = null
        state.nebulaClusters.forEach(cluster => {
          const isHovered = cluster.checkHover(state.mouseX, state.mouseY)
          if (isHovered) {
            foundHovered = cluster.name
          }
        })
        // 通知父组件
        if (onNebulaHover) {
          onNebulaHover(foundHovered)
        }
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [onNebulaHover])

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

      const isComplete = timeline.update(timestamp)

      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, rect.width, rect.height)

      // 屏幕震动（爆炸冲击）：trauma 衰减，震动强度 = trauma²
      state.shakeTrauma = Math.max(0, state.shakeTrauma - dt * 0.00035)
      const shakeT = state.shakeTrauma * state.shakeTrauma
      const shakeX = shakeT > 0 ? (Math.random() * 2 - 1) * shakeT * 10 : 0
      const shakeY = shakeT > 0 ? (Math.random() * 2 - 1) * shakeT * 7 : 0
      if (shakeX !== 0 || shakeY !== 0) {
        ctx.save()
        ctx.translate(shakeX, shakeY)
      }

      const phase = timeline.currentPhase
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // 更新系统
      if (state.particleSystem) state.particleSystem.update(dt)
      if (state.starSystem) state.starSystem.update(state.time)
      if (state.nebulaSystem) state.nebulaSystem.update(dt)

      // 更新星云集群（渐入效果）
      state.nebulaClusters.forEach(cluster => cluster.update())

      switch (phase) {
        case PHASES.DARKNESS:
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

        case PHASES.FAST_TRAVERSE:
          drawFastTraversePhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline, dt)
          break

        case PHASES.ENTER:
          drawEnterPhase(ctx, rect.width, rect.height, centerX, centerY, state, timeline)
          break
      }

      // 恢复震动后的坐标变换
      if (shakeX !== 0 || shakeY !== 0) {
        ctx.restore()
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

// 阶段2：奇点诞生（前半段显现，后半段坍缩成亮点）
function drawBirthPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.BIRTH)

  // 坍缩进度：0.3~0.7 向中心收缩，完成后保持亮点停顿
  const collapse = Math.max(0, Math.min(1, (progress - 0.3) / 0.4))
  const scale = 1 - collapse

  // 中心光点（调暗调小，避免刺眼光球；坍缩时收缩）
  const glowSize = lerp(0, 10, progress) * scale
  const breathe = Math.sin(progress * Math.PI * 3) * 0.3 + 0.7

  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowSize * breathe
  )
  gradient.addColorStop(0, `rgba(255, 255, 255, ${0.35 * scale})`)
  gradient.addColorStop(0.3, `rgba(200, 220, 255, ${0.2 * scale})`)
  gradient.addColorStop(0.6, `rgba(150, 180, 255, ${0.1 * scale})`)
  gradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, Math.max(glowSize * breathe, 0.1), 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  for (let i = 0; i < 3; i++) {
    const ringProgress = (progress + i * 0.3) % 1
    const ringSize = ringProgress * 100 * scale
    const ringAlpha = (1 - ringProgress) * 0.3 * scale

    ctx.beginPath()
    ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(100, 120, 200, ${ringAlpha})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

// 阶段3：大爆发（粒子吸引到星云位置）
function drawExplosionPhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.EXPLOSION)

  // 闪光效果
  if (progress < 0.1) {
    const flashAlpha = Math.pow(1 - (progress / 0.1), 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`
    ctx.fillRect(0, 0, width, height)
  }

  // 触发粒子爆炸 + 屏幕震动
  if (!state.explosionTriggered && progress > 0.05) {
    state.particleSystem.emitExplosion(centerX, centerY, 1500)
    state.explosionTriggered = true
    state.shakeTrauma = 1
  }

  // 冲击波环（屏幕扩散，爆炸前段）
  if (progress < 0.35) {
    for (let i = 0; i < 3; i++) {
      const rp = Math.max(0, (progress - i * 0.06) / 0.3)
      if (rp > 0 && rp < 1) {
        const ringRadius = rp * Math.max(width, height) * 0.5
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(160, 190, 255, ${(1 - rp) * 0.6})`
        ctx.lineWidth = 2 + rp * 3
        ctx.stroke()
      }
    }
  }

  // 将粒子吸引到星云位置
  if (!state.attractTriggered && progress > 0.3) {
    state.attractTriggered = true

    // 获取活跃的粒子
    const activeParticles = state.particleSystem.particles.filter(p => p.active)

    // 为每个星云分配粒子
    state.nebulaClusters.forEach((cluster, clusterIndex) => {
      // 计算应该分配给这个星云的粒子范围
      const particlesPerCluster = Math.floor(activeParticles.length / state.nebulaClusters.length)
      const startIndex = clusterIndex * particlesPerCluster
      const endIndex = startIndex + particlesPerCluster

      // 将粒子吸引到这个星云
      for (let i = startIndex; i < endIndex && i < activeParticles.length; i++) {
        activeParticles[i].setAttractToNebula(cluster)
      }
    })
  }

  // 星云集群显示（渐入）
  if (progress > 0.5 && !state.clustersVisible) {
    state.clustersVisible = true
    state.nebulaClusters.forEach(cluster => {
      cluster.visible = true
    })
  }

  // 更新和绘制粒子
  if (state.particleSystem) {
    state.particleSystem.update(dt)
    state.particleSystem.draw(ctx)
  }

  // 绘制星云集群
  if (state.clustersVisible) {
    state.nebulaClusters.forEach(cluster => {
      cluster.update()
      cluster.draw(ctx, state.time)
    })
  }

  // （移除呼吸光源：白色呼吸光球太刺眼，且会遮挡文字）
}

// 阶段4：HUD穿梭
function drawTraversePhase(ctx, width, height, centerX, centerY, state, _timeline, dt) {
  // 绘制固定粒子
  if (state.particleSystem) {
    ctx.globalAlpha = 0.5
    state.particleSystem.draw(ctx)
    ctx.globalAlpha = 1
  }

  // 绘制星云
  if (state.nebulaSystem) {
    state.nebulaSystem.draw(ctx)
  }

  // 绘制恒星
  if (state.starSystem) {
    state.starSystem.draw(ctx, state.time)
  }

  // 绘制星云集群
  state.nebulaClusters.forEach(cluster => {
    cluster.draw(ctx, state.time)
  })

  // 绘制穿梭粒子
  state.traverseParticles.forEach(p => {
    p.update(dt)
    p.draw(ctx)
  })
}

// 阶段5：按钮出现
function drawButtonPhase(ctx, width, height, centerX, centerY, state, _timeline) {
  if (state.particleSystem) {
    ctx.globalAlpha = 0.5
    state.particleSystem.draw(ctx)
    ctx.globalAlpha = 1
  }

  if (state.nebulaSystem) {
    state.nebulaSystem.draw(ctx)
  }

  if (state.starSystem) {
    state.starSystem.draw(ctx, state.time)
  }

  // 绘制星云集群（带悬停效果）
  state.nebulaClusters.forEach(cluster => {
    cluster.draw(ctx, state.time)
  })

  state.traverseParticles.forEach(p => {
    p.update(16)
    p.draw(ctx)
  })
}

// 阶段6：快速穿梭
function drawFastTraversePhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.FAST_TRAVERSE)

  state.fastTraverseParticles.forEach(p => {
    p.update(dt)
    p.draw(ctx)
  })

  // 白色淡出
  if (progress > 0.7) {
    const fadeProgress = (progress - 0.7) / 0.3
    ctx.fillStyle = `rgba(255, 255, 255, ${fadeProgress})`
    ctx.fillRect(0, 0, width, height)
  }
}

// 阶段7：进入首页
function drawEnterPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.ENTER)

  ctx.fillStyle = `rgba(255, 255, 255, ${progress})`
  ctx.fillRect(0, 0, width, height)
}
