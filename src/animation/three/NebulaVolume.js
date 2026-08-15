import * as THREE from 'three'

// 星云体积：多个 billboard Sprite 高斯堆叠，形成柔和云雾感
export class NebulaVolume {
  constructor({ x, y, z, radius, name, color, softTexture, spriteCount = 50 }) {
    this.name = name
    this.radius = radius
    this.baseX = x
    this.baseY = y
    this.baseZ = z
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
        opacity: 0.1 + Math.random() * 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(size, size, 1)
      sprite.position.set(offset.x * radius, offset.y * radius, offset.z * radius * 0.6)
      this.group.add(sprite)
      this.sprites.push({ sprite, baseScale: size })
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

  // 缓慢旋转 + 漂移 + 呼吸，让星云"动起来"
  update(time) {
    this.group.rotation.y = time * 0.05
    this.group.position.x = this.baseX + Math.sin(time * 0.08) * 2.5
    this.group.position.y = this.baseY + Math.cos(time * 0.06) * 1.8
    this.group.position.z = this.baseZ + Math.sin(time * 0.04 + 1) * 1.5
    this.sprites.forEach((entry, i) => {
      const breathe = 0.78 + 0.22 * Math.sin(time * 0.6 + i * 0.5)
      entry.sprite.scale.set(entry.baseScale * breathe, entry.baseScale * breathe, 1)
    })
  }

  dispose() {
    this.sprites.forEach((entry) => entry.sprite.material.dispose())
    this.shells.forEach((s) => s.material.dispose())
  }
}
