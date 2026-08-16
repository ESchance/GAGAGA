import { PHASES } from '../timeline/AnimationTimeline'

// 阶段渲染协调器：根据时间轴阶段更新各 3D 系统状态
// ctx = { timeline, systems, camera, bloom, time, dt, quality, state }
//
// 生命周期核心约定：
//   星空(stars)     —— 仅 DARKNESS/BIRTH 显示，爆炸后由银河接管背景
//   奇点(singularity) —— 仅 DARKNESS/BIRTH
//   银河(explosion) —— EXPLOSION 炸开成型后【持久保留】到动画结束，穿梭阶段缓慢自转
//   穿梭(traverse)  —— TRAVERSE 起显示，第一视角掠过银河

export function renderPhase(phase, ctx) {
  const { timeline, systems, camera, bloom, time, dt } = ctx
  const { stars, singularity, explosion, shake, flash, traverse } = systems

  // 银河坍缩：BIRTH 后段收缩成亮点，EXPLOSION 前段重新展开
  let galaxyCollapse = 0
  if (phase === PHASES.BIRTH) {
    const birthP = timeline.getEasedProgress(PHASES.BIRTH)
    galaxyCollapse = Math.max(0, Math.min(1, (birthP - 0.35) / 0.25))
  } else if (phase === PHASES.EXPLOSION) {
    const explP = timeline.getEasedProgress(PHASES.EXPLOSION)
    galaxyCollapse = Math.max(0, Math.min(1, 1 - explP / 0.3))
  }
  if (stars) stars.setCollapse(galaxyCollapse)

  // 星空始终更新（仅在显示阶段）
  if (stars) stars.update(time)

  switch (phase) {
    case PHASES.DARKNESS: {
      // 奇点提前淡显（progress=0，极低透明度），实现 DARKNESS→BIRTH 平滑过渡
      if (singularity) singularity.update(time, 0)
      if (bloom) bloom.setStrength(0)
      break
    }

    case PHASES.BIRTH: {
      const progress = timeline.getEasedProgress(PHASES.BIRTH)
      if (singularity) singularity.update(time, progress)
      if (bloom) bloom.setStrength(progress * 0.35)
      break
    }

    case PHASES.EXPLOSION: {
      // 一次性触发：爆炸 + 震屏
      if (!ctx.state.explosionTriggered) {
        ctx.state.explosionTriggered = true
        ctx.state.explosionStart = time * 1000
        if (explosion) explosion.explode()
        if (shake) shake.add(1)
      }
      const elapsed = time * 1000 - ctx.state.explosionStart
      if (explosion) explosion.update(elapsed)
      if (flash) flash.visible = false
      if (bloom) bloom.setStrength(0.15)
      break
    }

    case PHASES.TRAVERSE: {
      // 银河持久保留并缓慢自转，作为第一视角穿越的背景（不再 clear）
      if (explosion) explosion.rotate(dt * 0.0002)
      if (traverse) {
        traverse.update(dt, 1)
        traverse.hideLines()
        // 淡入过渡（穿梭阶段前 1/4 渐显，不硬切）
        const tp = timeline.getPhaseProgress(PHASES.TRAVERSE)
        traverse.setOpacity(Math.min(1, tp * 4))
      }
      if (flash) flash.visible = false
      if (bloom) bloom.setStrength(0.3)
      resetFov(camera)
      break
    }

    case PHASES.BUTTON: {
      // 银河持续自转，穿梭粒子巡航等待用户点击
      if (explosion) explosion.rotate(dt * 0.0002)
      if (traverse) {
        traverse.update(dt, 1)
        traverse.hideLines()
      }
      if (flash) flash.visible = false
      if (bloom) bloom.setStrength(0.45)
      break
    }

    case PHASES.FAST_TRAVERSE: {
      const progress = timeline.getEasedProgress(PHASES.FAST_TRAVERSE)
      // 快速穿梭时银河自转加快，增强速度感
      if (explosion) explosion.rotate(dt * 0.0008)
      if (traverse) {
        traverse.update(dt, 2)
        traverse.updateLines(dt, 2)
      }
      if (bloom) bloom.setStrength(0.35)
      camera.fov = 60 + 12 * progress
      camera.updateProjectionMatrix()
      if (flash) flash.visible = false
      break
    }

    case PHASES.ENTER: {
      if (explosion) explosion.rotate(dt * 0.0002)
      if (traverse) {
        traverse.hideLines()
        // 淡出过渡（结尾渐隐，不硬切）
        const ep = timeline.getPhaseProgress(PHASES.ENTER)
        traverse.setOpacity(Math.max(0, 1 - ep))
      }
      // 光亮慢慢布满整个屏幕
      if (flash) {
        flash.visible = true
        flash.material.opacity = timeline.getPhaseProgress(PHASES.ENTER)
      }
      if (bloom) bloom.setStrength(0)
      break
    }
  }
}

function resetFov(camera) {
  if (camera.fov !== 60) {
    camera.fov = 60
    camera.updateProjectionMatrix()
  }
}
