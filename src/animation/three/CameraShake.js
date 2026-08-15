// 相机震动系统（trauma 创伤值模型）
// 震动强度 = trauma²，trauma 随时间衰减
export class CameraShake {
  constructor() {
    this.trauma = 0
  }

  // 触发震动
  add(amount = 1) {
    this.trauma = Math.min(1, this.trauma + amount)
  }

  // 获取当前抖动偏移量（幅度加大，实现明显的全屏震动）
  getOffset() {
    if (this.trauma <= 0) return { x: 0, y: 0, roll: 0 }
    const t = this.trauma * this.trauma
    return {
      x: (Math.random() * 2 - 1) * t * 0.45,
      y: (Math.random() * 2 - 1) * t * 0.3,
      roll: (Math.random() * 2 - 1) * t * 0.03
    }
  }

  // 随时间衰减（dt 为毫秒）
  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 0.00035)
  }
}
