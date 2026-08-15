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

    // 粒子颜色（固定调色板）
    const colors = new Float32Array(count * 3)
    const palette = [
      [1, 1, 1], [0.88, 1, 1], [0, 0.81, 0.82], [0, 0.75, 1],
      [0.25, 0.41, 0.88], [0.58, 0.44, 0.86], [1, 0.39, 0.28], [1, 0.27, 0]
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
      size: 2.2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    })
    this.material = material
    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)

    // 冲击波环（位于相机前方 z=-12 的屏幕特效，面向相机）
    this.shockRings = []
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.96, 1, 64),
        new THREE.MeshBasicMaterial({
          color: 0xaac4ff,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      )
      ring.position.set(0, 0, -12)
      ring.visible = false
      this.group.add(ring)
      this.shockRings.push(ring)
    }

    this.exploded = false
    this.attractTriggered = false
  }

  setTexture(texture) {
    this.material.map = texture
    this.material.needsUpdate = true
  }

  explode() {
    this.exploded = true
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

  // 冲击波环扩散（progress 0~0.35 期间）
  updateShockRings(progress, time) {
    this.shockRings.forEach((ring, i) => {
      const rp = progress <= 0.35 ? Math.max(0, (progress - i * 0.06) / 0.3) : 1
      if (progress <= 0.35 && rp > 0 && rp < 1) {
        ring.visible = true
        ring.scale.setScalar(0.5 + rp * 14)
        ring.material.opacity = (1 - rp) * 0.7
        ring.rotation.z = time * 0.3 + i
      } else {
        ring.visible = false
      }
    })
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.shockRings.forEach((r) => {
      r.geometry.dispose()
      r.material.dispose()
    })
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
    const r = Math.random()
    if (r > 0.95) return Math.random() * 15 + 20
    if (r > 0.75) return Math.random() * 10 + 10
    if (r > 0.45) return Math.random() * 6 + 4
    if (r > 0.15) return Math.random() * 3 + 1
    return Math.random() * 1 + 0.2
  }
}
