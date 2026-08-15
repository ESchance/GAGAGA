import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  createRenderer,
  createScene,
  createCamera,
  createSoftCircleTexture,
  createDeepSpaceBackground
} from '../three/threeCore'
import { GalaxyStars } from '../three/GalaxyStars'
import { Singularity } from '../three/Singularity'
import { ExplosionSystem } from '../three/ExplosionSystem'
import { CameraShake } from '../three/CameraShake'
import { TraverseField } from '../three/TraverseField'
import { renderPhase } from '../three/phaseRenderers'
import { PHASES } from '../timeline/AnimationTimeline'

// 生成星云簇中心：网格 + 抖动，分散布局不拥挤，大小各异
function generateNebulaCenters(count = 6) {
  const centers = []
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    // 网格单元内随机抖动，避免整齐排列与重叠
    const x = -0.8 + (col + 0.5 + (Math.random() - 0.5) * 0.6) * (1.6 / cols)
    const y = -0.8 + (row + 0.5 + (Math.random() - 0.5) * 0.6) * (1.6 / rows)
    centers.push({
      x: x * 20,
      y: y * 12,
      z: -30 - Math.random() * 25,
      size: 9 + Math.random() * 15 // 各星云大小不同
    })
  }
  return centers
}

// Three.js 渲染组件（PC 高/中配）
// 与 AnimationCanvas 保持相同 props：{ timeline, onNebulaHover }，多一个 quality
export default function ThreeAnimationCanvas({ timeline, _onNebulaHover, onReady, quality = 'high' }) {
  const containerRef = useRef(null)
  const stateRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // StrictMode 双挂载防护
    if (stateRef.current) return
    const state = {
      renderer: null,
      scene: null,
      camera: null,
      bloom: null,
      rafId: null,
      disposables: [],
      systems: {},
      state: { explosionTriggered: false, explosionStart: 0 },
      nebulaCenters: []
    }
    stateRef.current = state

    // 渲染器
    const renderer = createRenderer()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)
    state.renderer = renderer

    const scene = createScene()
    state.scene = scene
    const camera = createCamera()
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    // 相机加入场景，使其子对象（如全屏光效）可被渲染
    scene.add(camera)
    state.camera = camera

    // 软圆点纹理
    const softTexture = createSoftCircleTexture()
    state.disposables.push(softTexture)

    // 深空背景
    const background = createDeepSpaceBackground()
    scene.add(background)
    state.disposables.push(background.geometry, background.material)

    // 银河星空
    const stars = new GalaxyStars(quality === 'high' ? 5000 : 2500)
    stars.setTexture(softTexture)
    scene.add(stars.group)
    state.systems.stars = stars
    state.disposables.push(stars)

    // 奇点（中心蓝色粒子群，数量适中）
    const singularity = new Singularity(quality === 'high' ? 400 : 200, softTexture)
    singularity.group.visible = false
    scene.add(singularity.group)
    state.systems.singularity = singularity
    state.disposables.push(singularity)

    // 星云簇中心（爆炸粒子聚集成星云的布局，不拥挤）
    state.nebulaCenters = generateNebulaCenters(quality === 'high' ? 7 : 5)

    // 爆炸系统：粒子炸开后分簇聚集成多个星云（更亮更多）
    const explosion = new ExplosionSystem(
      quality === 'high' ? 25000 : 12000,
      state.nebulaCenters
    )
    explosion.setTexture(softTexture)
    scene.add(explosion.group)
    state.systems.explosion = explosion
    state.disposables.push(explosion)

    // 穿梭粒子场（数量稀疏）
    const traverse = new TraverseField(quality === 'high' ? 600 : 300, softTexture)
    scene.add(traverse.group)
    state.systems.traverse = traverse
    state.disposables.push(traverse)

    // 相机震动
    const shake = new CameraShake()
    state.systems.shake = shake

    // 全屏扩散白光（径向渐变光，替代矩形白框；挂在相机上始终全屏）
    const flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: softTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthTest: false,
        blending: THREE.AdditiveBlending
      })
    )
    flash.scale.set(1, 1, 1)
    flash.position.set(0, 0, -5)
    flash.frustumCulled = false
    flash.renderOrder = 999
    flash.visible = false
    camera.add(flash)
    state.systems.flash = flash
    state.disposables.push(flash.material)

    // 泛光后处理（仅高配，动态加载）
    if (quality === 'high') {
      import('../three/bloom')
        .then((mod) => {
          state.bloom = mod.setupBloom(renderer, scene, camera)
        })
        .catch((error) => {
          console.error('Bloom 后处理加载失败，降级为普通渲染:', error)
        })
    }

    // 主循环
    let lastTime = 0
    const animate = (timestamp) => {
      state.rafId = requestAnimationFrame(animate)
      const dt = Math.min(timestamp - lastTime, 50)
      lastTime = timestamp
      const time = timestamp * 0.001

      const isComplete = timeline.update(timestamp)
      const phase = timeline.currentPhase

      // 相机震动衰减
      shake.update(dt)

      // 奇点：DARKNESS 起即淡显，BIRTH 渐亮（平滑过渡，不再瞬切）
      singularity.group.visible =
        phase === PHASES.DARKNESS || phase === PHASES.BIRTH

      // 穿梭粒子：从穿梭阶段到探索按钮阶段一直保持存在
      traverse.group.visible =
        phase === PHASES.TRAVERSE ||
        phase === PHASES.BUTTON ||
        phase === PHASES.FAST_TRAVERSE ||
        phase === PHASES.ENTER

      // 爆炸粒子只在爆炸阶段显示（初始粒子聚在原点，提前显示会成一个亮点）
      explosion.group.visible = phase === PHASES.EXPLOSION

      // 阶段渲染
      renderPhase(phase, {
        timeline,
        systems: state.systems,
        camera,
        bloom: state.bloom,
        time,
        dt,
        quality,
        state: state.state,
        nebulaCenters: state.nebulaCenters
      })

      // 应用相机震动
      const offset = shake.getOffset()
      camera.position.set(offset.x, offset.y, 0)
      camera.rotation.z = offset.roll

      // 深空背景跟随相机
      background.position.copy(camera.position)

      // 渲染（有 bloom 用 composer，否则直接渲染）
      if (state.bloom) {
        state.bloom.render()
      } else {
        renderer.render(scene, camera)
      }

      if (isComplete) {
        cancelAnimationFrame(state.rafId)
        state.rafId = null
      }
    }
    state.rafId = requestAnimationFrame(animate)

    // 自适应尺寸
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      if (state.bloom) state.bloom.resize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    // 渲染器就绪，通知父组件启动时间轴
    onReady?.()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (state.rafId) cancelAnimationFrame(state.rafId)
      // 释放 GPU 资源，防止 WebGL 上下文泄漏
      state.disposables.forEach((d) => {
        if (d && typeof d.dispose === 'function') d.dispose()
      })
      if (state.bloom) {
        state.bloom.composer.dispose()
      }
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      stateRef.current = null
    }
  }, [timeline, quality, onReady])

  return <div ref={containerRef} className="absolute inset-0" />
}
