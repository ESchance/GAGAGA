import * as THREE from 'three'

// BIRTH 阶段：中心一圈清晰的蓝色小粒子（非发光光球）
// 使用普通混合（NormalBlending），粒子叠加不增亮，保持"粒子云"质感
export class Singularity {
  constructor(count = 200, softTexture) {
    this.group = new THREE.Group()
    this.count = count

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    // 保存初始位置，供 CPU 坍缩插值使用
    this.basePositions = new Float32Array(count * 3)
    this.positions = positions
    for (let i = 0; i < count; i++) {
      // 球壳分布（中心空心），形成"一圈/一簇"粒子而非实心光团
      const r = 8 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      this.basePositions[i * 3] = positions[i * 3]
      this.basePositions[i * 3 + 1] = positions[i * 3 + 1]
      this.basePositions[i * 3 + 2] = positions[i * 3 + 2]
      sizes[i] = 0.35 + Math.random() * 0.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    this.geometry = geometry

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: softTexture || null },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uCollapse: { value: 0 }
      },
      vertexShader: `
        attribute float aSize;
        uniform float uTime;
        uniform float uProgress;
        uniform float uCollapse;
        varying float vAlpha;
        void main() {
          // 位置已由 CPU 更新为坍缩位置（不再在此处做 mix，确保确定性生效）
          vec3 p = position;
          float breathe = 0.85 + 0.15 * sin(uTime * 2.0 + position.x * 1.5);
          // 坍缩时保持亮度与尺寸，让环收缩成亮点的过程清晰可见
          vAlpha = breathe * (0.08 + 0.5 * uProgress);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float starSize = aSize * (90.0 / max(-mv.z, 0.1)) * breathe * (1.0 - 0.2 * uCollapse);
          // clamp 上限防止粒子靠近相机时放大成光球，同时保证坍缩后亮点可见
          gl_PointSize = clamp(starSize, 1.0, 8.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          // 蓝色粒子
          gl_FragColor = vec4(0.42, 0.62, 1.0, tex.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false
      // 默认 NormalBlending：粒子叠加不增亮，避免形成光球
    })
    this.material = material

    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)

    // 核心小光点：坍缩成亮点时的中心白点（小巧）
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: softTexture || null,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
    halo.position.set(0, 0, -20) // 与坍缩目标重合
    halo.scale.set(3.5, 3.5, 1)
    this.group.add(halo)
    this.halo = halo

    // 粒子感光晕：三维球壳分布，无光晕的实心小点，更近更多，立体包裹核心
    const haloCount = 320
    const haloPositions = new Float32Array(haloCount * 3)
    const haloSizes = new Float32Array(haloCount)
    for (let i = 0; i < haloCount; i++) {
      // 球面均匀分布（theta + phi），前后左右立体包裹
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 1.2 + Math.random() * 0.8
      haloPositions[i * 3] = Math.cos(theta) * Math.sin(phi) * radius
      haloPositions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * radius
      haloPositions[i * 3 + 2] = Math.cos(phi) * radius
      haloSizes[i] = 0.3 + Math.random() * 0.5
    }
    const haloGeo = new THREE.BufferGeometry()
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3))
    haloGeo.setAttribute('aSize', new THREE.BufferAttribute(haloSizes, 1))
    const haloMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: `
        attribute float aSize;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (130.0 / max(-mv.z, 0.1));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        void main() {
          // 实心圆点（无光晕）：圆内实心、圆外透明
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          if (length(uv) > 1.0) discard;
          gl_FragColor = vec4(1.0, 1.0, 1.0, uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    })
    const haloParticles = new THREE.Points(haloGeo, haloMat)
    haloParticles.position.set(0, 0, -20)
    this.group.add(haloParticles)
    this.haloParticles = haloParticles
    this.haloParticlesGeo = haloGeo
    this.haloParticlesMat = haloMat
  }

  update(time, progress) {
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uProgress.value = progress
    // 坍缩进度：progress 0.3~0.7 之间从 0→1（1.6 秒，环清晰可见地收缩成亮点）
    // 完成后保持亮点停顿（0.7~1.0），营造"暴风雨前的宁静"
    const collapse = Math.max(0, Math.min(1, (progress - 0.3) / 0.4))
    this.material.uniforms.uCollapse.value = collapse
    this.group.rotation.z = time * 0.04

    // 白色光晕随坍缩渐显（坍缩完成、亮点停顿时刻最明显；小巧柔和不过曝）
    if (this.halo) {
      const haloOpacity = collapse * collapse * 0.5
      this.halo.material.opacity = haloOpacity
      // 核心光点略微呼吸，增强"蓄势"感
      const breathe = 0.85 + 0.15 * Math.sin(time * 3.0)
      this.halo.scale.setScalar(3.5 * breathe)
    }
    // 粒子感光晕：围绕核心的实心小粒子渐显、双轴缓慢旋转，立体感明显
    if (this.haloParticles) {
      this.haloParticles.material.uniforms.uOpacity.value = collapse * collapse * 0.85
      this.haloParticles.rotation.z = time * 0.25
      this.haloParticles.rotation.y = time * 0.15
    }

    // CPU 确定性更新粒子位置：从球壳向中心前方 (0,0,-20) 插值收缩
    const targetZ = -20
    const pos = this.geometry.attributes.position.array
    for (let i = 0; i < this.count; i++) {
      const k = 1 - collapse
      pos[i * 3] = this.basePositions[i * 3] * k
      pos[i * 3 + 1] = this.basePositions[i * 3 + 1] * k
      pos[i * 3 + 2] = this.basePositions[i * 3 + 2] * k + targetZ * collapse
    }
    this.geometry.attributes.position.needsUpdate = true
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    if (this.halo) this.halo.material.dispose()
    if (this.haloParticlesGeo) this.haloParticlesGeo.dispose()
    if (this.haloParticlesMat) this.haloParticlesMat.dispose()
  }
}
