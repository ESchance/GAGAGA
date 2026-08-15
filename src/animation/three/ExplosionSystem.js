import * as THREE from 'three'

// EXPLOSION：粒子从中心炸开，飞向旋臂目标形成漩涡银河；少部分飞出屏幕
// 无星云聚集、无连线，粒子炸开即为银河
export class ExplosionSystem {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    this.target = new Float32Array(count * 3) // 目标位置（旋臂或飞出）
    this.flyOut = new Uint8Array(count)       // 是否飞出屏幕
    this.delay = new Float32Array(count)
    this.duration = new Float32Array(count)
    this.active = new Uint8Array(count)
    this.finished = new Uint8Array(count)

    const arms = 3
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      this.delay[i] = Math.random() * 250
      this.duration[i] = 800 + Math.random() * 1600
      if (Math.random() < 0.2) {
        // 20% 飞出屏幕
        this.flyOut[i] = 1
        const bt = Math.random() * Math.PI * 2
        const bp = Math.acos(2 * Math.random() - 1)
        const d = 150 + Math.random() * 60
        this.target[i * 3] = Math.sin(bp) * Math.cos(bt) * d
        this.target[i * 3 + 1] = Math.sin(bp) * Math.sin(bt) * d
        this.target[i * 3 + 2] = Math.cos(bp) * d - 40
      } else {
        // 80% 旋臂银河（XY 平面盘，正面朝向的漩涡）
        const u = Math.random()
        const r = 12 + Math.pow(u, 0.55) * 52
        const arm = i % arms
        const theta = r * 0.6 + (arm * Math.PI * 2) / arms + (Math.random() - 0.5) * 0.4
        this.target[i * 3] = r * Math.cos(theta)
        this.target[i * 3 + 1] = r * Math.sin(theta)
        this.target[i * 3 + 2] = -38 - Math.random() * 10
      }
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

    this.exploded = false
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
      // 从中心飞向目标（炸开即为银河成形）
      const t = Math.min(1, (elapsed - this.delay[i]) / this.duration[i])
      const k = 1 - (1 - t) * (1 - t)
      pos[ix] = this.target[ix] * k
      pos[ix + 1] = this.target[ix + 1] * k
      pos[ix + 2] = this.target[ix + 2] * k
      if (t >= 1) {
        if (this.flyOut[i]) {
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
