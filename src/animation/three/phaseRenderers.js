import { PHASES } from '../timeline/AnimationTimeline'

// 阶段渲染协调器：根据时间轴阶段更新各 3D 系统状态
// ctx = { timeline, systems, camera, bloom, time, dt, quality, state, nebulaCenters }

export function renderPhase(phase, ctx) {
  const { timeline, systems, camera, bloom, time, dt } = ctx
  const { stars, singularity, explosion, shake, flash, traverse, nebulae } = systems

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
        explosion.update(elapsed)
      }

      // 无刺眼白光
      if (flash) flash.visible = false

      // 星云在爆炸后期开始成形（scale 0→1）
      if (nebulae) {
        const nebulaFade = Math.max(0, Math.min(1, (progress - 0.5) / 0.35))
        nebulae.forEach((n) => n.group.scale.setScalar(0.01 + nebulaFade * 0.99))
      }

      // 低泛光，避免大面积光晕
      if (bloom) bloom.setStrength(0.15)
      break
    }

    case PHASES.TRAVERSE: {
      // 清空爆炸残留粒子，只保留星云
      if (explosion) explosion.clear()
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
      // 去除满屏白光
      if (flash) flash.visible = false
      break
    }

    case PHASES.ENTER: {
      if (traverse) traverse.hideLines()
      // 去除满屏白光（动画自然结束，由父组件卸载切换首页）
      if (flash) flash.visible = false
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
