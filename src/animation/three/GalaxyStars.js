import * as THREE from 'three'

// 银河密度星空
// 对数碟形分布 + 双旋臂 + 高斯厚度，中心白蓝、边缘橙黄，带闪烁 shader
export class GalaxyStars {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    const radius = 700
    const arms = 2
    const spiralTwist = 0.55

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // 对数半径：中心密、边缘疏
      const u = Math.random()
      const r = -Math.log(1 - u) * (radius / 4.5)
      const arm = i % arms
      // 旋臂偏移 + 高斯抖动（近似）
      const armOffset = (Math.random() - 0.5) * 0.9
      const theta = r * spiralTwist + (arm * Math.PI) / arms + armOffset

      positions[i * 3] = r * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(theta)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45

      sizes[i] = 0.3 + Math.random() * 1.1
      phases[i] = Math.random() * Math.PI * 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uRadius: { value: radius }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uRadius;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // 径向颜色：中心淡蓝 → 边缘暗橙（压低亮度，呈现细小星星而非光球）
          float r = length(position.xy);
          float t = clamp(r / uRadius, 0.0, 1.0);
          vec3 centerColor = vec3(0.55, 0.62, 0.85);
          vec3 edgeColor = vec3(0.8, 0.62, 0.42);
          vColor = mix(centerColor, edgeColor, t);

          float twinkle = 0.55 + 0.3 * sin(uTime * 2.0 + aPhase);
          vAlpha = twinkle * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float starSize = aSize * (30.0 / max(-mvPosition.z, 0.1)) * twinkle;
          // 相机后方或过近的粒子隐藏；clamp 上限防止近距离粒子变成巨大光球
          if (mvPosition.z > -0.5) {
            starSize = 0.0;
          }
          gl_PointSize = clamp(starSize, 0.5, 4.0);
          gl_Position = projectionMatrix * mvPosition;
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
      blending: THREE.NormalBlending
    })

    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)
    this.material = material
    this.geometry = geometry
  }

  // 传入软圆点纹理
  setTexture(texture) {
    this.material.uniforms.uTexture.value = texture
  }

  update(time) {
    this.material.uniforms.uTime.value = time
    this.group.rotation.z = time * 0.02
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
