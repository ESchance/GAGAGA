import * as THREE from 'three'

// BIRTH 阶段：中心一圈清晰的蓝色小粒子（非发光光球）
// 使用普通混合（NormalBlending），粒子叠加不增亮，保持"粒子云"质感
export class Singularity {
  constructor(count = 200, softTexture) {
    this.group = new THREE.Group()
    this.count = count

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // 球壳分布（中心空心），形成"一圈/一簇"粒子而非实心光团
      const r = 8 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
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
          // 坍缩：粒子向屏幕中心前方聚拢成一个清晰的小亮点
          vec3 target = vec3(0.0, 0.0, -20.0);
          vec3 p = mix(position, target, uCollapse);
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
  }

  update(time, progress) {
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uProgress.value = progress
    // 坍缩进度：progress 0.3~0.7 之间从 0→1（1.6 秒，环清晰可见地收缩成亮点）
    // 完成后保持亮点停顿（0.7~1.0），营造"暴风雨前的宁静"
    const collapse = Math.max(0, Math.min(1, (progress - 0.3) / 0.4))
    this.material.uniforms.uCollapse.value = collapse
    this.group.rotation.z = time * 0.04
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
