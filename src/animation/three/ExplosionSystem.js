import * as THREE from 'three'

// EXPLOSION：亮点粒子炸开，球状扩散成雾
// - 粒子数量多、尺寸小，从中心向球壳目标点扩散
// - 部分粒子飞出屏幕，部分停在远处（3~4 倍半径）围成立体球
// - 粒子之间细线连接，模拟雾状尘雾
export class ExplosionSystem {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    // 粒子从中心向球壳目标点扩散（扩散速度各不相同，无序散布，避免同心/银河结构）
    this.dir = new Float32Array(count * 3)   // 随机单位方向
    this.targetR = new Float32Array(count)   // 目标半径
    this.delay = new Float32Array(count)
    this.duration = new Float32Array(count)  // 每个粒子的扩散时长（随机，造成无序）
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
      this.delay[i] = Math.random() * 300
      // 扩散时长随机（0.6s~2.4s），粒子快慢不一，无序弥漫
      this.duration[i] = 600 + Math.random() * 1800
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
      // 扩散进度：每粒子时长随机，easeOut 加速扩散（无序散布）
      const t = Math.min(1, (elapsed - this.delay[i]) / this.duration[i])
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
