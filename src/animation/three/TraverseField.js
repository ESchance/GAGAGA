import * as THREE from 'three'

// 穿梭粒子场（TRAVERSE 推进粒子 + FAST_TRAVERSE 拖尾线）
// 粒子从远处向相机飞，穿过即重置到远处
export class TraverseField {
  constructor(count, softTexture) {
    this.count = count
    this.group = new THREE.Group()

    this.positions = new Float32Array(count * 3)
    this.speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      this.resetParticle(i)
    }

    // 粒子
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry = geometry
    const material = new THREE.PointsMaterial({
      size: 0.8,
      map: softTexture,
      color: 0x6b9eff, // 与奇点粒子相近的蓝色，更小
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    })
    this.material = material
    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)

    // 拖尾线（FAST_TRAVERSE）
    this.linePositions = new Float32Array(count * 6)
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3))
    this.lineGeo = lineGeo
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    this.lineMat = lineMat
    this.lines = new THREE.LineSegments(lineGeo, lineMat)
    this.lines.visible = false
    this.group.add(this.lines)
  }

  resetParticle(i) {
    const radius = 20 + Math.random() * 18
    const angle = Math.random() * Math.PI * 2
    this.positions[i * 3] = Math.cos(angle) * radius
    this.positions[i * 3 + 1] = Math.sin(angle) * radius * 0.55
    this.positions[i * 3 + 2] = -180 - Math.random() * 120
    this.speeds[i] = 0.5 + Math.random() * 1.0
  }

  // 穿梭：粒子向相机（z 增大）移动，穿过 z>-2 重置
  // 速度进一步降低，缓慢巡航
  update(dt, speedScale = 1) {
    const pos = this.positions
    const v = (0.25 + 1.2 * speedScale) * (dt / 16)
    for (let i = 0; i < this.count; i++) {
      pos[i * 3 + 2] += v * this.speeds[i]
      if (pos[i * 3 + 2] > -2) {
        this.resetParticle(i)
      }
    }
    this.geometry.attributes.position.needsUpdate = true
  }

  // 快速穿梭：每粒子生成拉伸拖尾线
  updateLines(dt, speedScale = 1) {
    this.lines.visible = true
    const pos = this.positions
    const trailLength = 4 + speedScale * 5
    for (let i = 0; i < this.count; i++) {
      const ix = i * 6
      this.linePositions[ix] = pos[i * 3]
      this.linePositions[ix + 1] = pos[i * 3 + 1]
      this.linePositions[ix + 2] = pos[i * 3 + 2]
      this.linePositions[ix + 3] = pos[i * 3]
      this.linePositions[ix + 4] = pos[i * 3 + 1]
      this.linePositions[ix + 5] = pos[i * 3 + 2] + trailLength
    }
    this.lineGeo.attributes.position.needsUpdate = true
  }

  hideLines() {
    this.lines.visible = false
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.lineGeo.dispose()
    this.lineMat.dispose()
  }
}
