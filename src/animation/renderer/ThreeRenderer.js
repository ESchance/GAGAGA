// Three.js 渲染器（PC 高/中配）
// 实现统一接口：init / resize / update(snapshot) / dispose
// 背景用 CSS 深空渐变（canvas 透明），Three 只画 additive 发光粒子

import * as THREE from 'three'
import { ParticleSystem } from '../particles/ParticleSystem'
import { particleVertexShader, particleFragmentShader } from '../particles/shaders'
import { tierLimit } from '../device'

export class ThreeRenderer {
  constructor(canvas, { tier }) {
    this.canvas = canvas
    this.tier = tier
    this.dpr = tierLimit(tier).dpr
    this.ps = new ParticleSystem(tierLimit(tier).count)
    this.ps.ensureSizes()
    this.attrs = this.ps.fillAttributes()
    this.time = 0
    this.disposed = false
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: this.tier === 'high',
    })
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setClearColor(0x000000, 0)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 6000)
    this.camera.position.set(0, 0, 0)
    this.camera.lookAt(0, 0, -1)

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.attrs.position, 3))
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.attrs.color, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.attrs.size, 1))
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(this.attrs.phase, 1))
    this.geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.attrs.velocity, 3))

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.dpr },
        uTrailLen: { value: 0 },
      },
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  update(snapshot) {
    if (this.disposed) return

    this.ps.update(snapshot)
    this.ps.syncAttributes(this.attrs)

    this.time += snapshot.dt
    this.material.uniforms.uTime.value = this.time
    this.material.uniforms.uTrailLen.value = snapshot.stage === 'burst' ? 1 : 0

    // 相机前进：travel/burst 沿 -Z 穿越银河
    if (snapshot.stage === 'travel' || snapshot.stage === 'burst') {
      const speed =
        snapshot.stage === 'burst' ? 80 * snapshot.speedMultiplier : 40
      this.camera.position.z -= speed * snapshot.dt
    }

    this.camera.lookAt(0, 0, this.camera.position.z - 10)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.geometry?.dispose()
    this.material?.dispose()
    this.renderer?.dispose()
  }
}
