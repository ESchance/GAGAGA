import * as THREE from 'three'

// ========================================
// Three.js 渲染核心工厂
// 供 ThreeAnimationCanvas 使用
// ========================================

// 创建渲染器
export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.setClearColor(0x000000, 1)
  return renderer
}

// 创建场景
export function createScene() {
  return new THREE.Scene()
}

// 创建透视相机
export function createCamera() {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000)
  camera.position.set(0, 0, 0)
  return camera
}

// 生成软圆点纹理（程序化，无外部资源，符合 CSP）
// 用于粒子贴图、Sprite、光晕
export function createSoftCircleTexture(size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const half = size / 2
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// 深空背景：大球体内表面渐变（中心暗紫蓝 → 边缘近黑）
// 随相机移动保持"无穷远"感
export function createDeepSpaceBackground() {
  const geometry = new THREE.SphereGeometry(900, 32, 32)
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uColorInner: { value: new THREE.Color(0x0a0a30) },
      uColorEdge: { value: new THREE.Color(0x000000) }
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 uColorInner;
      uniform vec3 uColorEdge;
      void main() {
        vec3 dir = normalize(vPos);
        float t = clamp(abs(dir.y) * 0.6 + length(dir.xz) * 0.4, 0.0, 1.0);
        vec3 color = mix(uColorInner, uColorEdge, t);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'deepSpaceBackground'
  return mesh
}
