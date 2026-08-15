import * as THREE from 'three'

// EXPLOSION：亮点粒子炸开，向"银河状"旋涡目标扩散成旋臂
// 粒子无序地从中心弥散，最终聚成相机前方的旋涡银河（3 条旋臂）
export class ExplosionSystem {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    // 每个粒子：先球状立体炸开，再收拢到旋涡银河目标点（旋臂结构）
    this.dir3D = new Float32Array(count * 3)  // 球状炸开的 3D 方向
    this.ballR = new Float32Array(count)       // 球状炸开半径
    this.target = new Float32Array(count * 3)  // 旋臂目标
    this.delay = new Float32Array(count)
    this.duration = new Float32Array(count)
    this.active = new Uint8Array(count)
    this.finished = new Uint8Array(count)

    const arms = 3
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // 球状炸开方向（3D 全向）
      const btheta = Math.random() * Math.PI * 2
      const bphi = Math.acos(2 * Math.random() - 1)
      this.dir3D[i * 3] = Math.sin(bphi) * Math.cos(btheta)
      this.dir3D[i * 3 + 1] = Math.sin(bphi) * Math.sin(btheta)
      this.dir3D[i * 3 + 2] = Math.cos(bphi)
      this.ballR[i] = 20 + Math.random() * 35

      // 旋臂目标：XY 平面盘（正面朝向），旋臂螺旋清晰
      const u = Math.random()
      const r = 12 + Math.pow(u, 0.55) * 52 // 半径 12~64
      const arm = i % arms
      const theta = r * 0.6 + (arm * Math.PI * 2) / arms + (Math.random() - 0.5) * 0.55
      this.target[i * 3] = r * Math.cos(theta)
      this.target[i * 3 + 1] = r * Math.sin(theta)
      this.target[i * 3 + 2] = -38 - Math.random() * 12
      this.delay[i] = Math.random() * 300
      this.duration[i] = 700 + Math.random() * 1800
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
      size: 0.55,
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
      // 阶段1：球状立体炸开（0~0.5s，从中心向 3D 球面扩散，避免聚集光球）
      const t1 = Math.min(1, elapsed / 500)
      const ballEase = 1 - (1 - t1) * (1 - t1)
      const bx = this.dir3D[ix] * this.ballR[i] * ballEase
      const by = this.dir3D[ix + 1] * this.ballR[i] * ballEase
      const bz = this.dir3D[ix + 2] * this.ballR[i] * ballEase
      // 阶段2：从球面收拢聚成旋臂银河（0.5s 后，平滑过渡到旋臂目标）
      const t2 = Math.max(0, Math.min(1, (elapsed - 500) / 1800))
      const k2 = t2 * t2 * (3 - 2 * t2) // smoothstep
      pos[ix] = bx + (this.target[ix] - bx) * k2
      pos[ix + 1] = by + (this.target[ix + 1] - by) * k2
      pos[ix + 2] = bz + (this.target[ix + 2] - bz) * k2
      if (t2 >= 1) this.finished[i] = 1
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
