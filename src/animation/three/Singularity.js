import * as THREE from 'three'

// BIRTH 阶段：奇点光球 + 脉冲环
export class Singularity {
  constructor() {
    this.group = new THREE.Group()

    // 奇点光球（fresnel 发光 + 呼吸）
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 3.0);
          float pulse = 0.8 + 0.2 * sin(uTime * 3.0);
          vec3 base = vec3(0.55, 0.65, 1.0);
          vec3 hot = vec3(1.0, 1.0, 1.0);
          vec3 color = mix(base, hot, fresnel) * (0.5 + fresnel * 1.4) * pulse;
          gl_FragColor = vec4(color, 1.0);
        }
      `
    })
    this.core = new THREE.Mesh(geometry, material)
    this.group.add(this.core)

    // 3 个脉冲环
    this.rings = []
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1, 48),
        new THREE.MeshBasicMaterial({
          color: 0x88aaff,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      )
      ring.rotation.x = Math.PI / 2
      this.group.add(ring)
      this.rings.push(ring)
    }

    this.material = material
  }

  update(time, progress) {
    this.material.uniforms.uTime.value = time

    // 光球长大 + 呼吸（progress 0→1）
    const breathe = Math.sin(progress * Math.PI * 3) * 0.15 + 0.85
    const scale = (0.5 + progress * 2.2) * breathe
    this.core.scale.setScalar(scale)

    // 脉冲环扩散
    this.rings.forEach((ring, i) => {
      const rp = (progress + i * 0.33) % 1
      ring.scale.setScalar(rp * 7 + 1)
      ring.material.opacity = (1 - rp) * 0.45
      ring.rotation.z = time * 0.6 + i * 2.1
    })
  }

  dispose() {
    this.core.geometry.dispose()
    this.core.material.dispose()
    this.rings.forEach((r) => {
      r.geometry.dispose()
      r.material.dispose()
    })
  }
}
