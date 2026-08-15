import * as THREE from 'three'

// EXPLOSION 阶段：爆发粒子 + 吸聚星云 + 冲击波环
export class ExplosionSystem {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.delays = new Float32Array(count)
    this.decays = new Float32Array(count)
    this.lifes = new Float32Array(count)
    this.active = new Uint8Array(count)
    this.attracted = new Uint8Array(count)
    this.targets = new Float32Array(count * 3)
    this.arrived = new Uint8Array(count)

    for (let i = 0; i < count; i++) {
      this.delays[i] = this.randomDelay()
      this.decays[i] = this.randomDecay()
      this.lifes[i] = 1
      const speed = this.randomSpeed()
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      this.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      this.velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      this.velocities[i * 3 + 2] = Math.cos(phi) * speed
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

    // 粒子颜色（电磁雾：青、蓝、紫为主，无刺眼白/橙）
    const colors = new Float32Array(count * 3)
    const palette = [
      [0.4, 0.8, 1.0], [0.3, 0.7, 1.0], [0.5, 0.4, 1.0], [0.6, 0.3, 1.0],
      [0.0, 0.9, 0.9], [0.4, 0.6, 1.0], [0.3, 0.5, 0.9], [0.5, 0.5, 1.0]
    ]
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c[0]
      colors[i * 3 + 1] = c[1]
      colors[i * 3 + 2] = c[2]
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.geometry = geometry

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    })
    this.material = material
    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)

    // 单段倾斜 3D 冲击波（半透明）+ 环上凸显的尘土粒子
    this.shockRing = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 1, 64),
      new THREE.MeshBasicMaterial({
        color: 0x7fa8ff,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
    this.shockRing.rotation.x = 1.2 // 倾斜约 69°（0.5~2 范围内），3D 立体
    this.shockRing.position.set(0, 0, -10)
    this.shockRing.visible = false
    this.group.add(this.shockRing)

    // 冲击波携带的尘土粒子：分布在倾斜环圆周上，随环扩散，凸显
    this.dustCount = 220
    this.dustPositions = new Float32Array(this.dustCount * 3)
    this.dustActive = new Uint8Array(this.dustCount).fill(1)
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3))
    this.dustGeometry = dustGeo
    this.dustMaterial = new THREE.PointsMaterial({
      size: 3.2,
      color: 0xcfe0ff, // 青白亮色，凸显
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
    this.dustPoints = new THREE.Points(dustGeo, this.dustMaterial)
    this.dustPoints.visible = false
    this.group.add(this.dustPoints)

    this.exploded = false
    this.attractTriggered = false
  }

  setTexture(texture) {
    this.material.map = texture
    this.material.needsUpdate = true
  }

  explode() {
    this.exploded = true
    if (this.dustPoints) this.dustPoints.visible = true
  }

  // 设置吸聚目标（星云簇中心数组 [{x,y,z}]）
  setAttractTargets(clusterCenters) {
    if (this.attractTriggered || !clusterCenters.length) return
    this.attractTriggered = true
    const perCluster = Math.floor(this.count / clusterCenters.length)
    clusterCenters.forEach((center, ci) => {
      for (let i = ci * perCluster; i < (ci + 1) * perCluster && i < this.count; i++) {
        this.attracted[i] = 1
        this.targets[i * 3] = center.x
        this.targets[i * 3 + 1] = center.y
        this.targets[i * 3 + 2] = center.z
      }
    })
  }

  update(elapsed, dt) {
    if (!this.exploded) return
    const pos = this.positions
    const f = dt / 16

    // 延迟激活
    for (let i = 0; i < this.count; i++) {
      if (!this.active[i] && elapsed >= this.delays[i]) {
        this.active[i] = 1
      }
    }

    for (let i = 0; i < this.count; i++) {
      if (!this.active[i]) continue
      const ix = i * 3
      const iy = ix + 1
      const iz = ix + 2

      if (this.arrived[i]) continue

      if (this.attracted[i]) {
        const dx = this.targets[ix] - pos[ix]
        const dy = this.targets[iy] - pos[iy]
        const dz = this.targets[iz] - pos[iz]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 3) {
          this.arrived[i] = 1
        } else {
          const k = 0.018 * f
          pos[ix] += dx * k
          pos[iy] += dy * k
          pos[iz] += dz * k
        }
      } else {
        pos[ix] += this.velocities[ix] * f
        pos[iy] += this.velocities[iy] * f
        pos[iz] += this.velocities[iz] * f
        const drag = Math.pow(0.95, f)
        this.velocities[ix] *= drag
        this.velocities[iy] *= drag
        this.velocities[iz] *= drag
      }

      // 生命衰减
      this.lifes[i] -= this.decays[i] * f
      if (this.lifes[i] <= 0) {
        pos[ix] = 9999
        pos[iy] = 9999
        pos[iz] = 9999
        this.active[i] = 0
      }
    }
    this.geometry.attributes.position.needsUpdate = true
  }

  // 单段冲击波：倾斜半透明 3D 环 + 环上凸显的尘土粒子，向相机扑面
  updateDust(progress) {
    if (!this.shockRing) return
    const rp = progress <= 0.4 ? Math.max(0, progress / 0.35) : 1
    const active = progress <= 0.4 && rp > 0 && rp < 1
    this.shockRing.visible = active
    this.dustPoints.visible = active
    if (!active) return

    // 冲击波：倾斜环扩散 + 向相机扑面（z 推进）
    const ringScale = 0.4 + rp * 4
    const ringZ = -10 + rp * 9.5
    this.shockRing.scale.setScalar(ringScale)
    this.shockRing.position.z = ringZ
    this.shockRing.material.opacity = (1 - rp) * 0.3

    // 尘土粒子：沿倾斜环圆周分布，随环扩散 + 扑面，凸显
    const tilt = 1.2
    const pos = this.dustPositions
    for (let i = 0; i < this.dustCount; i++) {
      const theta = (i / this.dustCount) * Math.PI * 2 + rp * 0.6
      const r = ringScale
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = Math.cos(tilt) * Math.sin(theta) * r
      pos[i * 3 + 2] = -Math.sin(tilt) * Math.sin(theta) * r + ringZ
    }
    this.dustGeometry.attributes.position.needsUpdate = true
    this.dustMaterial.opacity = (1 - rp) * 0.9
  }

  // 快速淡出所有粒子（星云成形后融入，避免吸聚粒子静止成"一圈不动"）
  fadeAll() {
    for (let i = 0; i < this.count; i++) {
      this.lifes[i] = Math.min(this.lifes[i], 0.02)
    }
  }

  // 立即隐藏所有粒子（含尘土）
  clear() {
    const pos = this.positions
    for (let i = 0; i < this.count; i++) {
      if (this.active[i]) {
        pos[i * 3] = 9999
        pos[i * 3 + 1] = 9999
        pos[i * 3 + 2] = 9999
        this.active[i] = 0
      }
    }
    this.geometry.attributes.position.needsUpdate = true
    if (this.shockRing) this.shockRing.visible = false
    if (this.dustPoints) {
      this.dustPoints.visible = false
      this.dustGeometry.attributes.position.needsUpdate = true
    }
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    if (this.shockRing) {
      this.shockRing.geometry.dispose()
      this.shockRing.material.dispose()
    }
    if (this.dustGeometry) this.dustGeometry.dispose()
    if (this.dustMaterial) this.dustMaterial.dispose()
  }

  randomDelay() {
    const r = Math.random()
    if (r > 0.9) return Math.random() * 500 + 200
    if (r > 0.7) return Math.random() * 200 + 100
    if (r > 0.4) return Math.random() * 100 + 50
    return 0
  }

  randomDecay() {
    const r = Math.random()
    if (r > 0.85) return 0.002 + Math.random() * 0.003
    if (r > 0.5) return 0.006 + Math.random() * 0.008
    if (r > 0.15) return 0.012 + Math.random() * 0.015
    return 0.02 + Math.random() * 0.025
  }

  randomSpeed() {
    // 电磁雾：缓慢弥漫扩散（低速度，形成雾团而非猛烈炸飞）
    const r = Math.random()
    if (r > 0.9) return Math.random() * 4 + 5
    if (r > 0.7) return Math.random() * 3 + 3
    if (r > 0.4) return Math.random() * 2.5 + 1.5
    if (r > 0.15) return Math.random() * 1.5 + 0.5
    return Math.random() * 0.8 + 0.1
  }
}
