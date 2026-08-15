import * as THREE from 'three'

// BIRTH 阶段：中心聚集的柔和粒子群（替代刺眼的实心发光白球）
// 光点云在中心聚拢、轻微呼吸，光感柔和不刺眼
export class Singularity {
  constructor(count = 600, softTexture) {
    this.group = new THREE.Group()
    this.count = count

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // 球内均匀随机分布（半径小，聚成一小团）
      const r = Math.pow(Math.random(), 1 / 3) * 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      sizes[i] = 0.8 + Math.random() * 1.4
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    this.geometry = geometry

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: softTexture || null },
        uTime: { value: 0 },
        uProgress: { value: 0 }
      },
      vertexShader: `
        attribute float aSize;
        uniform float uTime;
        uniform float uProgress;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // 中心偏暖白，随进度微变
          vColor = mix(vec3(0.65, 0.75, 1.0), vec3(0.95, 0.92, 0.9), uProgress);
          float breathe = 0.7 + 0.3 * sin(uTime * 2.5 + position.x * 2.0 + position.y * 1.5);
          vAlpha = breathe * (0.35 + 0.65 * uProgress);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (180.0 / max(-mv.z, 0.1)) * breathe * (0.5 + 0.5 * uProgress);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, tex.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    this.material = material

    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)
  }

  update(time, progress) {
    this.material.uniforms.uTime.value = time
    this.material.uniforms.uProgress.value = progress
    this.group.rotation.z = time * 0.08
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
