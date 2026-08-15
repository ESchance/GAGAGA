import * as THREE from 'three'

// 星云体积：多个 billboard Sprite 高斯堆叠，形成柔和云雾感
export class NebulaVolume {
  constructor({ x, y, z, radius, name, color, softTexture, spriteCount = 50 }) {
    this.name = name
    this.radius = radius
    this.group = new THREE.Group()
    this.group.position.set(x, y, z)

    this.sprites = []
    for (let i = 0; i < spriteCount; i++) {
      const offset = this.gaussianOffset()
      const size = 8 + Math.random() * 26
      const material = new THREE.SpriteMaterial({
        map: softTexture,
        color,
        transparent: true,
        opacity: 0.12 + Math.random() * 0.26,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(size, size, 1)
      sprite.position.set(offset.x * radius, offset.y * radius, offset.z * radius * 0.6)
      this.group.add(sprite)
      this.sprites.push(sprite)
    }

    // 外圈大光晕壳（更大更淡）
    this.shells = []
    for (let i = 0; i < 3; i++) {
      const material = new THREE.SpriteMaterial({
        map: softTexture,
        color,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(radius * 2.2, radius * 2.2, 1)
      sprite.position.set(0, 0, 0)
      this.group.add(sprite)
      this.shells.push(sprite)
    }
  }

  // 三维高斯分布近似（多次随机平均）
  gaussianOffset() {
    const u = () => (Math.random() + Math.random() + Math.random()) / 3
    return { x: u() * 2 - 1, y: u() * 2 - 1, z: u() * 2 - 1 }
  }

  // 缓慢旋转 + 呼吸
  update(time) {
    this.group.rotation.y = time * 0.05
    this.sprites.forEach((s, i) => {
      const breathe = 0.75 + 0.25 * Math.sin(time * 0.6 + i * 0.5)
      s.scale.setScalar(breathe)
    })
  }

  dispose() {
    this.sprites.forEach((s) => s.material.dispose())
    this.shells.forEach((s) => s.material.dispose())
  }
}
