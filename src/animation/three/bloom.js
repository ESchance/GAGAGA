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
    0.35, // strength（克制，避免光污染）
    0.6,  // radius
    0.4   // threshold（只对高亮区域辉光，暗部不泛光）
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
