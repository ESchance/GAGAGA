import * as THREE from 'three'

// EXPLOSION：粒子从中心炸开，聚集成多个星云
// - 每个粒子分配到某个星云簇，目标 = 簇中心 + 簇内椭球偏移（各星云大小形状不同）
// - 簇内粒子近距离连线，形成雾状星云网络
// - 星云随机布局（不拥挤），粒子比无序星空更亮、更多
export class ExplosionSystem {
  constructor(count, nebulaCenters) {
    this.count = count
    this.group = new THREE.Group()
    const nebulaCount = nebulaCenters.length || 1

    this.clusterOf = new Uint8Array(count)    // 所属星云簇
    this.target = new Float32Array(count * 3) // 簇内目标点
    this.delay = new Float32Array(count)
    this.duration = new Float32Array(count)
    this.active = new Uint8Array(count)
    this.finished = new Uint8Array(count)

    // 每个星云的大小权重（不同大小）
    const clusterWeight = nebulaCenters.map(() => 0.6 + Math.random() * 0.8)
    const totalWeight = clusterWeight.reduce((a, b) => a + b, 0)

    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // 按权重分配星云簇（大簇分到更多粒子）
      let rr = Math.random() * totalWeight
      let c = 0
      for (let k = 0; k < nebulaCount; k++) {
        rr -= clusterWeight[k]
        if (rr <= 0) { c = k; break }
      }
      this.clusterOf[i] = c
      const center = nebulaCenters[c]

      // 簇内椭球偏移（各星云形状不同）
      const shapeX = 0.6 + Math.random() * 0.7
      const shapeY = 0.6 + Math.random() * 0.7
      const shapeZ = 0.6 + Math.random() * 0.7
      const half = center.size * 0.55
      this.target[i * 3] = center.x + this.gaussian() * shapeX * half
      this.target[i * 3 + 1] = center.y + this.gaussian() * shapeY * half
      this.target[i * 3 + 2] = center.z + this.gaussian() * shapeZ * half

      this.delay[i] = Math.random() * 350
      this.duration[i] = 900 + Math.random() * 1800
    }

    // 粒子：更亮更多（电磁色）
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const colors = new Float32Array(count * 3)
    const palette = [
      [0.5, 0.85, 1.0], [0.4, 0.75, 1.0], [0.6, 0.5, 1.0], [0.7, 0.4, 1.0],
      [0.2, 0.95, 0.95], [0.5, 0.7, 1.0], [0.4, 0.6, 1.0], [0.6, 0.6, 1.0]
    ]
    for (let i = 0; i < count; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.geometry = geometry

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    })
    this.material = material
    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)

    // 粒子间连线（星云内近距离连线，雾状网络）
    this.lineSample = 900
    this.linePositions = new Float32Array(this.lineSample * 6)
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3))
    this.lineGeometry = lineGeo
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x9ac0ff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    this.lines = new THREE.LineSegments(lineGeo, this.lineMaterial)
    this.group.add(this.lines)

    this.exploded = false
  }

  // 近似高斯随机（多次平均）
  gaussian() {
    return (Math.random() + Math.random() + Math.random()) / 1.5 - 1
  }

  explode() {
    this.exploded = true
  }

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
      // 从中心炸开，飞向星云目标（聚集成星云）
      const t = Math.min(1, (elapsed - this.delay[i]) / this.duration[i])
      const k = 1 - (1 - t) * (1 - t)
      pos[ix] = this.target[ix] * k
      pos[ix + 1] = this.target[ix + 1] * k
      pos[ix + 2] = this.target[ix + 2] * k
      if (t >= 1) this.finished[i] = 1
    }
    this.geometry.attributes.position.needsUpdate = true
    this.updateLines()
  }

  // 粒子间近距离连线（星云内部雾状网络；星云间距离远自然不连）
  updateLines() {
    const pos = this.geometry.attributes.position.array
    const lp = this.linePositions
    const n = Math.min(this.lineSample, this.count)
    const threshold2 = 7 * 7
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
