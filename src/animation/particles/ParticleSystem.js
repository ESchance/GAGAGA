// 粒子宿主：typed-array 数据 + 各阶段目标生成（星空/坍缩/奇点/爆炸银河/穿梭）
// 纯逻辑，不依赖 Three；ThreeRenderer 与 Canvas2DRenderer 共用。
// 尺寸用对数正态分布（少数大星+大量小星）、速度用随机倍率（有快有慢）。

import { clamp, expoIn, expoOut, easeInOutCubic, lerp } from '../easing'

const RING_COUNT = 300 // 奇点环绕立体星点数量

// 近似正态分布 [-1,1]（3 次采样平均）
function gauss() {
  return (Math.random() + Math.random() + Math.random()) / 1.5 - 1
}

// 对数正态尺寸：多数小、少数大（基数调大使粒子在屏幕上清晰可见）
function logNormalSize() {
  return 3.5 * Math.exp(gauss() * 1.1)
}

function randomDir() {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi),
  }
}

// 银河螺旋臂目标位置：4 条臂，臂厚高斯分布
function galaxyTarget() {
  const arm = Math.floor(Math.random() * 4)
  const t = Math.random()
  const radius = 5 + t * 120
  const theta = (arm / 4) * Math.PI * 2 + t * 2.1
  return {
    x: radius * Math.cos(theta),
    y: gauss() * 12,
    z: radius * Math.sin(theta),
  }
}

// 生成一颗星空粒子（蓝白紫调）
function createStar() {
  const r = 300 + Math.random() * 300
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const isWarm = Math.random() < 0.18 // 少数暖色星点缀
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
    ox: 0, oy: 0, oz: 0,
    tx: 0, ty: 0, tz: 0,
    baseSize: logNormalSize(),
    size: 0,
    speed: 0.55 + Math.random() * 0.65, // 坍缩/爆发速度倍率（有快有慢）
    phase: Math.random() * Math.PI * 2,
    mode: 'star', // star | core | ring | escape | galaxy
    vx: 0, vy: 0, vz: 0,
    ringRadius: 0, ringBaseAngle: 0, ringY: 0,
    r: isWarm ? 0.95 : 0.65 + Math.random() * 0.3,
    g: isWarm ? 0.7 + Math.random() * 0.2 : 0.7 + Math.random() * 0.3,
    b: 0.9 + Math.random() * 0.1,
  }
}

export class ParticleSystem {
  constructor(count) {
    this.count = count
    this.particles = []
    this.lastStage = null
    for (let i = 0; i < count; i++) this.particles.push(createStar())
  }

  // 每帧更新：按阶段驱动粒子位置/大小/速度
  update(snapshot) {
    const { stage } = snapshot
    if (stage !== this.lastStage) {
      this._onStageEnter(stage)
      this.lastStage = stage
    }

    switch (stage) {
      case 'nebula': this._updateNebula(snapshot); break
      case 'collapse': this._updateCollapse(snapshot); break
      case 'singularity': this._updateSingularity(snapshot); break
      case 'bigbang': this._updateBigbang(snapshot); break
      case 'travel': this._updateTravel(snapshot); break
      case 'burst': this._updateBurst(snapshot); break
      default: break
    }
  }

  // 渲染器每帧同步到 buffer 前调用（保证首帧 size 有值）
  ensureSizes() {
    for (const p of this.particles) {
      if (!p.size) p.size = p.baseSize
    }
  }

  // —— 阶段进入 ——
  _onStageEnter(stage) {
    if (stage === 'collapse') {
      // 以当前星空位置为 origin，坍缩目标为中心
      for (const p of this.particles) {
        p.ox = p.x; p.oy = p.y; p.oz = p.z
        p.tx = 0; p.ty = 0; p.tz = 0
      }
    } else if (stage === 'singularity') {
      // 中心核 + 一圈立体环绕星点
      for (let i = 0; i < this.count; i++) {
        const p = this.particles[i]
        if (i < RING_COUNT) {
          p.mode = 'ring'
          p.ringRadius = 10 + Math.random() * 6
          p.ringBaseAngle = Math.random() * Math.PI * 2
          p.ringY = (Math.random() - 0.5) * 4
          p.size = p.baseSize * 0.4
          p.r = 0.55; p.g = 0.9; p.b = 1.0
        } else {
          p.mode = 'core'
          p.x = 0; p.y = 0; p.z = 0
          p.size = p.baseSize
          p.r = 0.92; p.g = 0.85; p.b = 1.0
        }
      }
    } else if (stage === 'bigbang') {
      // 从中心爆发：40% 逃逸飞出屏幕，60% 落位成银河
      for (const p of this.particles) {
        p.ox = 0; p.oy = 0; p.oz = 0
        if (Math.random() < 0.4) {
          p.mode = 'escape'
          const dir = randomDir()
          const dist = 1500 + Math.random() * 1000
          p.tx = dir.x * dist
          p.ty = dir.y * dist
          p.tz = dir.z * dist
          p.speed = 1.5 + Math.random() * 2.5 // 快
        } else {
          p.mode = 'galaxy'
          const t = galaxyTarget()
          p.tx = t.x; p.ty = t.y; p.tz = t.z
          p.speed = 0.35 + Math.random() * 0.5 // 慢
          // 银河多色
          const hue = Math.random()
          p.r = hue < 0.33 ? 0.5 + Math.random() * 0.2 : 0.8 + Math.random() * 0.2
          p.g = hue < 0.66 ? 0.7 + Math.random() * 0.3 : 0.5 + Math.random() * 0.3
          p.b = 0.9 + Math.random() * 0.1
        }
        p.size = p.baseSize
      }
    } else if (stage === 'travel') {
      for (const p of this.particles) { p.vx = 0; p.vy = 0; p.vz = 0 }
    } else if (stage === 'burst') {
      // 进入加速，粒子前冲速度在 update 中按 speedMultiplier 施加
    }
  }

  // —— 各阶段更新 ——

  _updateNebula({ dt }) {
    const angle = 0.02 * dt
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    for (const p of this.particles) {
      const x = p.x * c - p.z * s
      p.z = p.x * s + p.z * c
      p.x = x
      // 记录 origin，为坍缩做准备
      p.ox = p.x; p.oy = p.y; p.oz = p.z
      p.vx = 0; p.vy = 0; p.vz = 0
    }
  }

  _updateCollapse({ localProgress }) {
    for (const p of this.particles) {
      const t = clamp(localProgress * p.speed, 0, 1)
      const e = expoIn(t)
      p.x = lerp(p.ox, p.tx, e)
      p.y = lerp(p.oy, p.ty, e)
      p.z = lerp(p.oz, p.tz, e)
      p.size = p.baseSize * (1 - 0.7 * e) // 聚拢中缩小
    }
  }

  _updateSingularity({ dt }) {
    const angSpeed = 0.8 * dt
    const time = dt
    for (const p of this.particles) {
      if (p.mode === 'ring') {
        p.ringBaseAngle += angSpeed
        p.x = Math.cos(p.ringBaseAngle) * p.ringRadius
        p.z = Math.sin(p.ringBaseAngle) * p.ringRadius
        p.y = p.ringY * Math.sin(time * 0.5 + p.phase) // 立体起伏
      } else if (p.mode === 'core') {
        // 中心核微抖 + 脉冲（shader 闪烁已处理亮度）
        p.x = Math.sin(time * 2 + p.phase) * 0.4
        p.y = Math.cos(time * 2 + p.phase) * 0.4
        p.z = 0
      }
    }
  }

  _updateBigbang({ localProgress }) {
    for (const p of this.particles) {
      const t = clamp(localProgress * p.speed, 0, 1)
      const e = p.mode === 'escape' ? expoOut(t) : easeInOutCubic(t)
      p.x = lerp(p.ox, p.tx, e)
      p.y = lerp(p.oy, p.ty, e)
      p.z = lerp(p.oz, p.tz, e)
    }
  }

  _updateTravel({ dt }) {
    for (const p of this.particles) {
      if (p.mode === 'galaxy') {
        p.y += Math.sin(dt * 0.4 + p.phase) * 0.01 // 微漂
      }
      p.vx = 0; p.vy = 0; p.vz = 0
    }
  }

  _updateBurst({ dt, speedMultiplier }) {
    // 粒子整体向相机前冲（-Z 方向），速度随倍率；shader 用 aVelocity 生成拖尾
    const vz = 45 * speedMultiplier * dt
    for (const p of this.particles) {
      p.z -= vz
      p.vx = 0; p.vy = 0; p.vz = -vz
    }
  }

  // —— 供渲染器同步 ——

  fillAttributes() {
    return {
      position: new Float32Array(this.count * 3),
      color: new Float32Array(this.count * 3),
      size: new Float32Array(this.count),
      phase: new Float32Array(this.count),
      velocity: new Float32Array(this.count * 3),
    }
  }

  syncAttributes(attrs) {
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i]
      const i3 = i * 3
      attrs.position[i3] = p.x
      attrs.position[i3 + 1] = p.y
      attrs.position[i3 + 2] = p.z
      attrs.color[i3] = p.r
      attrs.color[i3 + 1] = p.g
      attrs.color[i3 + 2] = p.b
      attrs.size[i] = p.size || p.baseSize
      attrs.phase[i] = p.phase
      attrs.velocity[i3] = p.vx
      attrs.velocity[i3 + 1] = p.vy
      attrs.velocity[i3 + 2] = p.vz
    }
  }
}
