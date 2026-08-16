import * as THREE from 'three'

// EXPLOSION：粒子从中心炸开，飞向旋臂目标形成漩涡银河；少部分飞出屏幕
// 无星云聚集、无连线，粒子炸开即为银河
// 粒子有大有小（aSize 随机）、有快有慢（delay/duration 随机）、银河有厚度（立体 3D）
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
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      this.delay[i] = Math.random() * 250
      this.duration[i] = 800 + Math.random() * 1600

      // 粒子大小：有大有小（多数小、少数大），层次分明
      const sizeRand = Math.random()
      if (sizeRand > 0.95) sizes[i] = 2.2 + Math.random() * 0.8        // 5% 特大
      else if (sizeRand > 0.80) sizes[i] = 1.5 + Math.random() * 0.7   // 15% 大
      else if (sizeRand > 0.45) sizes[i] = 0.9 + Math.random() * 0.6   // 35% 中
      else sizes[i] = 0.4 + Math.random() * 0.5                        // 45% 小

      if (Math.random() < 0.2) {
        // 20% 飞出屏幕（3D 球面分布）
        this.flyOut[i] = 1
        const bt = Math.random() * Math.PI * 2
        const bp = Math.acos(2 * Math.random() - 1)
        const d = 150 + Math.random() * 60
        this.target[i * 3] = Math.sin(bp) * Math.cos(bt) * d
        this.target[i * 3 + 1] = Math.sin(bp) * Math.sin(bt) * d
        this.target[i * 3 + 2] = Math.cos(bp) * d - 40
      } else {
        // 80% 旋臂银河（XY 平面盘，z 轴加厚增强立体 3D 感）
        const u = Math.random()
        const r = 8 + Math.pow(u, 0.6) * 56
        const arm = i % arms
        const theta = r * 0.55 + (arm * Math.PI * 2) / arms + (Math.random() - 0.5) * 0.25
        this.target[i * 3] = r * Math.cos(theta)
        this.target[i * 3 + 1] = r * Math.sin(theta)
        // z 轴厚度：从 -38~-44（6 厚度）加宽到 -53~-23（30 厚度），银河立体
        this.target[i * 3 + 2] = -38 + (Math.random() - 0.5) * 30
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

    // 粒子颜色（电磁蓝紫系）
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
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    this.geometry = geometry

    // 自定义 shader：支持逐粒子大小（PointsMaterial 无法做到「有大有小」）
    const material = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: null } },
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * (120.0 / max(-mv.z, 0.1)), 0.5, 8.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, tex.a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
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
    this.material.uniforms.uTexture.value = texture
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
