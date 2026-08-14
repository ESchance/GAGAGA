/**
 * Canvas 渲染组件 - 最终版
 * 炸开+固定粒子+呼吸光源+HUD穿梭+快速穿梭+星云集群
 */

import { useEffect, useRef } from 'react'
import { ParticleSystem, TraverseParticle, FastTraverseParticle } from './ParticleSystem'
import { StarSystem } from './StarSystem'
import { NebulaSystem } from './NebulaSystem'
import { createNebulaClusters } from './NebulaCluster'
import { AnimationTimeline, PHASES } from '../timeline/AnimationTimeline'
import { lerp, randomRange } from '../utils/MathUtils'

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
    fixTriggered: false,
    nebulaTriggered: false,
    clustersVisible: false,
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

      // 创建星云集群
      state.nebulaClusters = createNebulaClusters(rect.width, rect.height, isMobile ? 4 : 6)

      // 创建穿梭粒子
      state.traverseParticles = []
      for (let i = 0; i < (isMobile ? 60 : 120); i++) {
        state.traverseParticles.push(new TraverseParticle(rect.width, rect.height))
      }

      // 创建快速穿梭粒子
      state.fastTraverseParticles = []
      for (let i = 0; i < (isMobile ? 80 : 150); i++) {
        state.fastTraverseParticles.push(new FastTraverseParticle(rect.width, rect.height))
      }

      state.explosionTriggered = false
      state.fixTriggered = false
      state.nebulaTriggered = false
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
      state.time += dt * 0.001

      const isComplete = timeline.update(timestamp)

      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, rect.width, rect.height)

      const phase = timeline.currentPhase
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // 更新系统
      if (state.particleSystem) state.particleSystem.update(dt)
      if (state.starSystem) state.starSystem.update(state.time)
      if (state.nebulaSystem) state.nebulaSystem.update(dt)

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

// 阶段2：奇点诞生
function drawBirthPhase(ctx, width, height, centerX, centerY, state, timeline) {
  const progress = timeline.getEasedProgress(PHASES.BIRTH)

  const glowSize = lerp(0, 20, progress)
  const breathe = Math.sin(progress * Math.PI * 3) * 0.3 + 0.7

  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowSize * breathe
  )
  gradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`)
  gradient.addColorStop(0.3, `rgba(200, 220, 255, 0.6)`)
  gradient.addColorStop(0.6, `rgba(150, 180, 255, 0.3)`)
  gradient.addColorStop(1, 'rgba(100, 120, 200, 0)')

  ctx.beginPath()
  ctx.arc(centerX, centerY, glowSize * breathe, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

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

// 阶段3：大爆发
function drawExplosionPhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.EXPLOSION)

  // 闪光效果
  if (progress < 0.1) {
    const flashAlpha = Math.pow(1 - (progress / 0.1), 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`
    ctx.fillRect(0, 0, width, height)
  }

  // 触发粒子爆炸
  if (!state.explosionTriggered && progress > 0.05) {
    state.particleSystem.emitExplosion(centerX, centerY, 1500)
    state.explosionTriggered = true
  }

  // 固定部分粒子
  if (!state.fixTriggered && progress > 0.3) {
    state.particleSystem.fixParticles(0.3)
    state.fixTriggered = true
  }

  // 星云开始形成
  if (!state.nebulaTriggered && progress > 0.4) {
    state.nebulaTriggered = true
  }

  // 星云集群显示
  if (progress > 0.6 && !state.clustersVisible) {
    state.clustersVisible = true
    state.nebulaClusters.forEach(cluster => {
      cluster.visible = true
    })
  }

  // 绘制粒子
  if (state.particleSystem) {
    state.particleSystem.draw(ctx)
  }

  // 绘制星云
  if (state.nebulaTriggered && state.nebulaSystem) {
    const nebulaAlpha = Math.min(1, (progress - 0.4) / 0.6)
    ctx.globalAlpha = nebulaAlpha * 0.8
    state.nebulaSystem.draw(ctx)
    ctx.globalAlpha = 1
  }

  // 绘制星云集群
  if (state.clustersVisible) {
    state.nebulaClusters.forEach(cluster => {
      cluster.draw(ctx, state.time)
    })
  }

  // 呼吸光源
  if (progress > 0.2) {
    const breathe = Math.sin(state.time * 2) * 0.3 + 0.7
    const glowAlpha = (1 - progress) * 0.5 * breathe
    const glowSize = 30 + progress * 20

    const glow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, glowSize
    )
    glow.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`)
    glow.addColorStop(0.5, `rgba(100, 120, 200, ${glowAlpha * 0.5})`)
    glow.addColorStop(1, 'rgba(50, 60, 100, 0)')

    ctx.beginPath()
    ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2)
    ctx.fillStyle = glow
    ctx.fill()
  }
}

// 阶段4：HUD穿梭
function drawTraversePhase(ctx, width, height, centerX, centerY, state, timeline, dt) {
  const progress = timeline.getEasedProgress(PHASES.TRAVERSE)

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
function drawButtonPhase(ctx, width, height, centerX, centerY, state, timeline) {
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
