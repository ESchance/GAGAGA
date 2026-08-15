import * as THREE from 'three'

// EXPLOSION：亮点粒子炸开，球状扩散成雾
// - 粒子数量多、尺寸小，从中心向球壳目标点扩散
// - 部分粒子飞出屏幕，部分停在远处（3~4 倍半径）围成立体球
// - 粒子之间细线连接，模拟雾状尘雾
export class ExplosionSystem {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    // 粒子从中心向球壳目标点扩散
    this.dir = new Float32Array(count * 3)   // 随机单位方向
    this.targetR = new Float32Array(count)   // 目标半径
    this.delay = new Float32Array(count)
    this.active = new Uint8Array(count)
    this.finished = new Uint8Array(count)

    const positions = new Float32Array(count * 3) // 初始在中心
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      this.dir[i * 3] = Math.sin(phi) * Math.cos(theta)
      this.dir[i * 3 + 1] = Math.sin(phi) * Math.sin(theta)
      this.dir[i * 3 + 2] = Math.cos(phi)
      // 约 85% 停在 30~70（3~4 倍亮点半径，围球）；约 15% 飞出屏幕
      this.targetR[i] = Math.random() < 0.85
        ? 30 + Math.random() * 40
        : 130 + Math.random() * 60
      this.delay[i] = Math.random() * 250
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // 电磁青紫色（细小粒子，非刺眼白）
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
      size: 0.4,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    })
    this.material = material
    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)

    // 粒子间细线（雾状尘雾）：采样一部分粒子，连接近邻
    this.lineSample = 700
    this.linePositions = new Float32Array(this.lineSample * 6)
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3))
    this.lineGeometry = lineGeo
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x9ac0ff,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    this.lines = new THREE.LineSegments(lineGeo, this.lineMaterial)
    this.group.add(this.lines)

    this.exploded = false
  }

  explode() {
    this.exploded = true
  }

  // 传入软圆点纹理（粒子圆点）
  setTexture(texture) {
    this.material.map = texture
    this.material.needsUpdate = true
  }

  update(elapsed) {
    if (!this.exploded) return
    const pos = this.geometry.attributes.position.array

    for (let i = 0; i < this.count; i++) {
      if (!this.active[i] && elapsed >= this.delay[i]) {
        this.active[i] = 1
      }
      if (!this.active[i] || this.finished[i]) continue

      const ix = i * 3
      // 扩散进度：从中心到目标，easeOut 加速扩散
      const t = Math.min(1, (elapsed - this.delay[i]) / 1400)
      const eased = 1 - (1 - t) * (1 - t)
      const r = this.targetR[i] * eased
      pos[ix] = this.dir[ix] * r
      pos[ix + 1] = this.dir[ix + 1] * r
      pos[ix + 2] = this.dir[ix + 2] * r

      if (t >= 1) {
        if (this.targetR[i] > 100) {
          // 飞出屏幕的粒子隐藏
          pos[ix] = 9999
          pos[ix + 1] = 9999
          pos[ix + 2] = 9999
          this.active[i] = 0
        }
        this.finished[i] = 1
      }
    }
    this.geometry.attributes.position.needsUpdate = true
    this.updateLines()
  }

  // 粒子间连线：采样近邻粒子对，形成雾状网络
  updateLines() {
    const pos = this.geometry.attributes.position.array
    const lp = this.linePositions
    const n = Math.min(this.lineSample, this.count)
    const threshold2 = 9 * 9
    let count = 0
    const maxLines = 1200
    for (let i = 0; i < n && count < maxLines; i++) {
      if (!this.active[i] || this.finished[i]) continue
      for (let j = i + 1; j < n && count < maxLines; j++) {
        if (!this.active[j] || this.finished[j]) continue
        const dx = pos[i * 3] - pos[j * 3]
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
        if (dx * dx + dy * dy + dz * dz < threshold2) {
          const li = count * 6
          lp[li] = pos[i * 3]
          lp[li + 1] = pos[i * 3 + 1]
          lp[li + 2] = pos[i * 3 + 2]
          lp[li + 3] = pos[j * 3]
          lp[li + 4] = pos[j * 3 + 1]
          lp[li + 5] = pos[j * 3 + 2]
          count++
        }
      }
    }
    for (let k = count * 6; k < lp.length; k++) lp[k] = 9999
    this.lineGeometry.attributes.position.needsUpdate = true
    this.lines.visible = count > 0
  }

  // 立即隐藏所有粒子与连线
  clear() {
    this.geometry.attributes.position.array.fill(9999)
    this.geometry.attributes.position.needsUpdate = true
    this.lines.visible = false
    this.active.fill(0)
    this.finished.fill(0)
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.lineGeometry.dispose()
    this.lineMaterial.dispose()
  }
}
