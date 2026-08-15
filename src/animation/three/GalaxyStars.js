import * as THREE from 'three'

// 银河密度星空
// 对数碟形分布 + 双旋臂 + 高斯厚度，中心白蓝、边缘橙黄，带闪烁 shader
export class GalaxyStars {
  constructor(count) {
    this.count = count
    this.group = new THREE.Group()

    const radius = 700

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // 无序星空：随机散布（无旋臂/银河结构），中心密边缘疏
      const u = Math.random()
      const r = Math.pow(u, 0.5) * radius
      const theta = Math.random() * Math.PI * 2

      positions[i * 3] = r * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(theta)
      // 整体放在相机前方远处（z=-250），保证所有粒子可见
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 250

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
        uRadius: { value: radius },
        uCollapse: { value: 0 }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uRadius;
        uniform float uCollapse;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // 坍缩：银河粒子向屏幕中心前方聚拢（爆炸前参与坍缩）
          vec3 target = vec3(0.0, 0.0, -60.0);
          vec3 p = mix(position, target, uCollapse);

          // 径向颜色（基于原位置，坍缩过程颜色不变）
          float r = length(position.xy);
          float t = clamp(r / uRadius, 0.0, 1.0);
          vec3 centerColor = vec3(0.55, 0.62, 0.85);
          vec3 edgeColor = vec3(0.8, 0.62, 0.42);
          vColor = mix(centerColor, edgeColor, t);

          float twinkle = 0.55 + 0.3 * sin(uTime * 2.0 + aPhase);
          vAlpha = twinkle * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          // 粒子位于相机前方 z≈-250，用对应系数得到适中尺寸
          float starSize = aSize * (750.0 / max(-mvPosition.z, 0.1)) * twinkle;
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

  // 设置坍缩进度（0=正常银河，1=全部聚拢到中心前方）
  setCollapse(value) {
    this.material.uniforms.uCollapse.value = value
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
