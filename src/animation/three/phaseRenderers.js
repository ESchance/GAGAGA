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

      // 白光从爆炸中心向全屏扩散（0~0.35，伴随粒子炸开）
      if (flash) {
        if (progress < 0.35) {
          flash.visible = true
          const spread = progress / 0.35
          const s = 2 + spread * 45
          flash.scale.set(s, s, 1)
          flash.material.opacity = 0.85 * (1 - spread)
        } else {
          flash.visible = false
        }
      }

      // 星云在爆炸吸聚后期开始成形（scale 0→1）
      if (nebulae) {
        const nebulaFade = Math.max(0, Math.min(1, (progress - 0.5) / 0.35))
        nebulae.forEach((n) => n.group.scale.setScalar(0.01 + nebulaFade * 0.99))
      }

      if (bloom) bloom.setStrength(0.55)
      break
    }

    case PHASES.TRAVERSE: {
      if (traverse) {
        traverse.update(dt, 1)
        traverse.hideLines()
      }
      if (nebulae) {
        nebulae.forEach((n) => {
          n.group.scale.setScalar(1)
          n.update(time)
        })
      }
      if (flash) flash.visible = false
      if (bloom) bloom.setStrength(0.3)
      resetFov(camera)
      break
    }

    case PHASES.BUTTON: {
      if (traverse) traverse.hideLines()
      if (nebulae) {
        nebulae.forEach((n) => {
          n.group.scale.setScalar(1)
          n.update(time)
        })
      }
      if (flash) flash.visible = false
      if (bloom) bloom.setStrength(0.45)
      break
    }

    case PHASES.FAST_TRAVERSE: {
      const progress = timeline.getEasedProgress(PHASES.FAST_TRAVERSE)
      if (traverse) {
        traverse.update(dt, 8)
        traverse.updateLines(dt, 8)
      }
      if (bloom) bloom.setStrength(0.35)
      // FOV 增大增强速度感
      camera.fov = 60 + 12 * progress
      camera.updateProjectionMatrix()
      // 末段白色淡出（全屏扩散光）
      if (flash) {
        if (progress > 0.7) {
          flash.visible = true
          flash.scale.set(45, 45, 1)
          flash.material.opacity = (progress - 0.7) / 0.3
        } else {
          flash.visible = false
        }
      }
      break
    }

    case PHASES.ENTER: {
      if (traverse) traverse.hideLines()
      // 全屏白光淡入进入首页
      if (flash) {
        flash.visible = true
        flash.scale.set(45, 45, 1)
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
