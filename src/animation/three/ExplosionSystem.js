import * as THREE from 'three'

// 爆炸 + 银河系统
// 粒子从中心炸开：80% 飞向旋臂目标形成银河（持久保留），20% 飞出屏幕
// 银河粒子在穿梭阶段保持并缓慢自转，作为「第一视角穿越银河」的背景
// 只用一个自定义属性 aSize（粒子大小），颜色在 shader 内按大小插值，避免任何属性名冲突
export class ExplosionSystem {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    this.target = new Float32Array(count * 3) // 目标位置（旋臂或飞出）
    this.flyOut = new Uint8Array(count)       // 是否飞出屏幕
    this.delay = new Float32Array(count)      // 起飞延迟（有快有慢）
    this.duration = new Float32Array(count)   // 飞行时长（有快有慢）
    this.active = new Uint8Array(count)
    this.finished = new Uint8Array(count)

    const arms = 3
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)     // 粒子大小（有大有小）

    for (let i = 0; i < count; i++) {
      this.delay[i] = Math.random() * 250
      this.duration[i] = 1000 + Math.random() * 1500

      // 粒子大小：有大有小（多数小、少数大），层次分明
      const sizeRand = Math.random()
      if (sizeRand > 0.95) sizes[i] = 2.8 + Math.random() * 1.0      // 5% 特大
      else if (sizeRand > 0.80) sizes[i] = 1.8 + Math.random() * 0.8 // 15% 大
      else if (sizeRand > 0.45) sizes[i] = 1.1 + Math.random() * 0.7 // 35% 中
      else sizes[i] = 0.5 + Math.random() * 0.5                      // 45% 小

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
        this.target[i * 3 + 2] = -38 + (Math.random() - 0.5) * 30
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    this.geometry = geometry

    // 自定义 shader：支持逐粒子大小（PointsMaterial 无法做到「有大有小」）
    const material = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: null } },
      vertexShader: `
        attribute float aSize;
        varying vec3 vColor;
        void main() {
          // 用 aSize 插值颜色：小粒子偏蓝紫，大粒子偏白（直观可靠，无额外属性）
          float t = clamp((aSize - 0.5) / 3.0, 0.0, 1.0);
          vec3 small = vec3(0.5, 0.72, 1.0);   // 小粒子蓝
          vec3 large = vec3(0.9, 0.95, 1.0);   // 大粒子白
          vColor = mix(small, large, t);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * (400.0 / max(-mv.z, 0.1)), 2.0, 24.0);
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

  // 爆炸阶段：粒子按各自 delay/duration 从中心飞向目标
  update(elapsed) {
    if (!this.exploded) return
    const pos = this.geometry.attributes.position.array
    for (let i = 0; i < this.count; i++) {
      if (!this.active[i] && elapsed >= this.delay[i]) {
        this.active[i] = 1
      }
      if (!this.active[i] || this.finished[i]) continue
      const ix = i * 3
      const t = Math.min(1, (elapsed - this.delay[i]) / this.duration[i])
      const k = 1 - (1 - t) * (1 - t) // 缓出，粒子先快后慢，炸开更有力
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

  // 穿梭阶段：银河缓慢自转，增强「身处银河」的真实感（不再 clear，银河持久保留）
  rotate(rate) {
    this.group.rotation.z += rate
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
