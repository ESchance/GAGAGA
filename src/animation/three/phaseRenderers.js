import { PHASES } from '../timeline/AnimationTimeline'

// 阶段渲染协调器：根据时间轴阶段更新各 3D 系统状态
// ctx = { timeline, systems, camera, bloom, time, dt, quality, state, nebulaCenters }

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

      // 低泛光，避免大面积光晕
      if (bloom) bloom.setStrength(0.15)
      break
    }

    case PHASES.TRAVERSE: {
      // 清空爆炸粒子（其聚成的星云已由穿梭阶段接管背景）
      if (explosion) explosion.clear()
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
      // 穿梭粒子保持存在并继续巡航（一直播放到用户点击）
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
      if (traverse) {
        traverse.hideLines()
        // 淡出过渡（结尾渐隐，不硬切）
        const ep = timeline.getPhaseProgress(PHASES.ENTER)
        traverse.setOpacity(Math.max(0, 1 - ep))
      }
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
