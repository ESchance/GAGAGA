import * as THREE from 'three'

// EXPLOSION：亮点粒子炸开，向"银河状"旋涡目标扩散成旋臂
// 粒子无序地从中心弥散，最终聚成相机前方的旋涡银河（3 条旋臂）
export class ExplosionSystem {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    // 每个粒子从中心附近的无序位置，向旋涡银河目标点移动（炸开成旋臂）
    this.basePos = new Float32Array(count * 3)   // 初始无序位置（避免聚集光球）
    this.target = new Float32Array(count * 3)     // 旋臂目标
    this.delay = new Float32Array(count)
    this.duration = new Float32Array(count)
    this.active = new Uint8Array(count)
    this.finished = new Uint8Array(count)

    const arms = 3
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // 初始无序：中心附近随机散布（非光球）
      const br = Math.pow(Math.random(), 0.8) * 15
      const btheta = Math.random() * Math.PI * 2
      const bphi = Math.acos(2 * Math.random() - 1)
      this.basePos[i * 3] = br * Math.sin(bphi) * Math.cos(btheta)
      this.basePos[i * 3 + 1] = br * Math.sin(bphi) * Math.sin(btheta)
      this.basePos[i * 3 + 2] = br * Math.cos(bphi)
      positions[i * 3] = this.basePos[i * 3]
      positions[i * 3 + 1] = this.basePos[i * 3 + 1]
      positions[i * 3 + 2] = this.basePos[i * 3 + 2]

      // 旋臂目标：XY 平面盘（正面朝向），旋臂螺旋清晰
      const u = Math.random()
      const r = 12 + Math.pow(u, 0.55) * 52 // 半径 12~64
      const arm = i % arms
      const theta = r * 0.6 + (arm * Math.PI * 2) / arms + (Math.random() - 0.5) * 0.4
      this.target[i * 3] = r * Math.cos(theta)
      this.target[i * 3 + 1] = r * Math.sin(theta)
      this.target[i * 3 + 2] = -38 - Math.random() * 12
      this.delay[i] = Math.random() * 300
      this.duration[i] = 700 + Math.random() * 1800 // 无序扩散
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // 电磁青紫色
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
      size: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    })
    this.material = material
    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)

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
      // 从初始无序位置向旋涡银河目标移动（无序节奏）
      const t = Math.min(1, (elapsed - this.delay[i]) / this.duration[i])
      const k = 1 - (1 - t) * (1 - t)
      const ik = 1 - k
      pos[ix] = this.basePos[ix] * ik + this.target[ix] * k
      pos[ix + 1] = this.basePos[ix + 1] * ik + this.target[ix + 1] * k
      pos[ix + 2] = this.basePos[ix + 2] * ik + this.target[ix + 2] * k
      if (t >= 1) this.finished[i] = 1
    }
    this.geometry.attributes.position.needsUpdate = true
  }

  // 立即隐藏所有粒子
  clear() {
    this.geometry.attributes.position.array.fill(9999)
    this.geometry.attributes.position.needsUpdate = true
    this.active.fill(0)
    this.finished.fill(0)
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
