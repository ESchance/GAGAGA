import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// 泛光后处理（仅高配档动态加载）
// 通过 composer.render 替代 renderer.render
export function setupBloom(renderer, scene, camera) {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.7, // strength
    0.7, // radius
    0.1  // threshold（暗场低阈值，保证辉光充分）
  )
  composer.addPass(bloomPass)

  return {
    composer,
    bloomPass,
    // 按阶段设置泛光强度
    setStrength(value) {
      bloomPass.strength = value
    },
    // 窗口尺寸变化
    resize(width, height) {
      composer.setSize(width, height)
    },
    render() {
      composer.render()
    }
  }
}
