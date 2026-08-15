import { PHASES } from '../timeline/AnimationTimeline'

// 阶段渲染协调器：根据时间轴阶段更新各 3D 系统状态
// ctx = { timeline, systems, camera, bloom, time, dt, quality, state, nebulaCenters }

export function renderPhase(phase, ctx) {
  const { timeline, systems, camera, bloom, time, dt } = ctx
  const { stars, singularity, explosion, shake, flash, traverse, nebulae } = systems

  // 星空始终更新
  if (stars) stars.update(time)

  switch (phase) {
    case PHASES.DARKNESS: {
      if (bloom) bloom.setStrength(0)
      break
    }

    case PHASES.BIRTH: {
      const progress = timeline.getEasedProgress(PHASES.BIRTH)
      if (singularity) singularity.update(time, progress)
      if (bloom) bloom.setStrength(progress)
      break
    }

    case PHASES.EXPLOSION: {
      const progress = timeline.getEasedProgress(PHASES.EXPLOSION)

      // 一次性触发：爆炸 + 震屏
      if (!ctx.state.explosionTriggered) {
        ctx.state.explosionTriggered = true
        ctx.state.explosionStart = time * 1000
        if (explosion) explosion.explode()
        if (shake) shake.add(1)
      }

      const elapsed = time * 1000 - ctx.state.explosionStart
      if (explosion) {
        explosion.update(elapsed, dt)
        explosion.updateShockRings(progress, time)
        if (progress > 0.3) {
          explosion.setAttractTargets(ctx.nebulaCenters)
        }
      }

      // 全屏白闪（爆炸瞬间）
      if (flash) {
        if (progress < 0.12) {
          flash.visible = true
          flash.material.opacity = Math.pow(1 - progress / 0.12, 2)
        } else {
          flash.visible = false
        }
      }

      if (bloom) bloom.setStrength(1.5)
      break
    }

    case PHASES.TRAVERSE: {
      if (traverse) {
        traverse.update(dt, 1)
        traverse.hideLines()
      }
      if (nebulae) nebulae.forEach((n) => n.update(time))
      if (flash) flash.visible = false
      if (bloom) bloom.setStrength(0.7)
      resetFov(camera)
      break
    }

    case PHASES.BUTTON: {
      if (traverse) traverse.hideLines()
      if (nebulae) nebulae.forEach((n) => n.update(time))
      if (flash) flash.visible = false
      if (bloom) bloom.setStrength(1.1)
      break
    }

    case PHASES.FAST_TRAVERSE: {
      const progress = timeline.getEasedProgress(PHASES.FAST_TRAVERSE)
      if (traverse) {
        traverse.update(dt, 8)
        traverse.updateLines(dt, 8)
      }
      if (bloom) bloom.setStrength(1.3)
      // FOV 增大增强速度感
      camera.fov = 60 + 12 * progress
      camera.updateProjectionMatrix()
      // 末段白色淡出
      if (flash) {
        if (progress > 0.7) {
          flash.visible = true
          flash.material.opacity = (progress - 0.7) / 0.3
        } else {
          flash.visible = false
        }
      }
      break
    }

    case PHASES.ENTER: {
      if (traverse) traverse.hideLines()
      if (flash) {
        flash.visible = true
        flash.material.opacity = timeline.getEasedProgress(PHASES.ENTER)
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
