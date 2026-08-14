/**
 * 音效管理器
 * 使用 Web Audio API 生成程序化音效
 */

export class SoundManager {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.isEnabled = true
    this.volume = 0.3
    this.isInitialized = false
  }

  async init() {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.audioContext.destination)
      this.isInitialized = true
    } catch (error) {
      console.warn('Web Audio API 不支持:', error)
      this.isEnabled = false
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  }

  enable() {
    this.isEnabled = true
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }
  }

  disable() {
    this.isEnabled = false
    if (this.masterGain) {
      this.masterGain.gain.value = 0
    }
  }

  toggle() {
    if (this.isEnabled) {
      this.disable()
    } else {
      this.enable()
    }
    return this.isEnabled
  }

  // 播放低频嗡鸣声
  playDrone(duration = 1, startVolume = 0, endVolume = 0.3) {
    if (!this.isEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(50, this.audioContext.currentTime)

    gainNode.gain.setValueAtTime(startVolume, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(endVolume, this.audioContext.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)

    return { oscillator, gainNode }
  }

  // 播放爆发音效
  playBurst(duration = 0.5) {
    if (!this.isEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + duration * 0.5)
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration)

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // 播放穿越音效
  playWhoosh(duration = 0.8) {
    if (!this.isEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + duration * 0.3)
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + duration)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, this.audioContext.currentTime)
    filter.frequency.exponentialRampToValueAtTime(5000, this.audioContext.currentTime + duration * 0.3)
    filter.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + duration)

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)

    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // 播放光芒音效
  playGlow(duration = 1) {
    if (!this.isEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + duration * 0.3)
    oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + duration)

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + duration * 0.3)
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // 播放完成音效
  playComplete() {
    if (!this.isEnabled || !this.audioContext) return

    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1)

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + i * 0.1)
      gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + i * 0.1 + 0.05)
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + i * 0.1 + 0.5)

      oscillator.connect(gainNode)
      gainNode.connect(this.masterGain)

      oscillator.start(this.audioContext.currentTime + i * 0.1)
      oscillator.stop(this.audioContext.currentTime + i * 0.1 + 0.5)
    })
  }

  // 播放环境音
  playAmbient(duration = 5) {
    if (!this.isEnabled || !this.audioContext) return

    // 使用多个振荡器创建丰富的环境音
    const frequencies = [60, 120, 180, 240]

    frequencies.forEach(freq => {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime)

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 1)
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime + duration - 1)
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(this.masterGain)

      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + duration)
    })
  }
}

// 单例模式
export const soundManager = new SoundManager()
