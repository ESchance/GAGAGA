import { describe, it, expect } from 'vitest'
import { AnimationTimeline, STAGES } from '../AnimationTimeline'

describe('AnimationTimeline', () => {
  it('7 个阶段常量定义正确', () => {
    expect(STAGES.map((s) => s.key)).toEqual([
      'nebula',
      'title',
      'collapse',
      'singularity',
      'bigbang',
      'travel',
      'burst',
    ])
  })

  it('nebula 阶段从 0 开始', () => {
    const tl = new AnimationTimeline()
    tl.start(0)
    const snap = tl.update(1000)
    expect(snap.stage).toBe('nebula')
    expect(snap.state).toBe('scripted')
  })

  it('脚本段依次推进，15000ms 进入 travel 等待', () => {
    const tl = new AnimationTimeline()
    tl.start(0)
    const stages = []
    tl.onStageChange((key) => stages.push(key))
    for (let t = 0; t <= 16000; t += 100) tl.update(t)

    expect(stages).toContain('title')
    expect(stages).toContain('collapse')
    expect(stages).toContain('singularity')
    expect(stages).toContain('bigbang')
    expect(stages).toContain('travel')
    expect(tl.state).toBe('waiting')
    expect(tl.isWaitingForUser).toBe(true)
  })

  it('travel 等待阶段：elapsed 冻结在 15000，dt 仍流动', () => {
    const tl = new AnimationTimeline()
    tl.start(0)
    tl.update(15000)
    const s1 = tl.update(15100)
    expect(s1.state).toBe('waiting')
    expect(s1.elapsed).toBe(15000)
    expect(s1.dt).toBeGreaterThan(0)

    // 长时间等待不切阶段
    const s2 = tl.update(40000)
    expect(s2.stage).toBe('travel')
    expect(s2.state).toBe('waiting')
  })

  it('startAcceleration 进入 accelerating，速度爬升到 2', () => {
    const tl = new AnimationTimeline()
    tl.start(0)
    tl.update(15000)
    expect(tl.isWaitingForUser).toBe(true)

    tl.startAcceleration(15000)
    const s1 = tl.update(15300) // 300ms，爬升中
    expect(s1.state).toBe('accelerating')
    expect(s1.speedMultiplier).toBeGreaterThan(1)
    expect(s1.speedMultiplier).toBeLessThan(2)

    const s2 = tl.update(15600) // 600ms，达到 2
    expect(s2.speedMultiplier).toBe(2)
  })

  it('点击后 2200ms 完成并触发 onComplete', () => {
    const tl = new AnimationTimeline()
    tl.start(0)
    tl.update(15000)
    let done = false
    tl.onComplete(() => {
      done = true
    })
    tl.startAcceleration(15000)
    tl.update(17200) // 2200ms
    expect(tl.state).toBe('done')
    expect(done).toBe(true)
  })

  it('burst 阶段 burstProgress 从 0 推进到 1', () => {
    const tl = new AnimationTimeline()
    tl.start(0)
    tl.update(15000)
    tl.startAcceleration(15000)
    const sMid = tl.update(16100) // 1100ms，进度约 0.5
    expect(sMid.stage).toBe('burst')
    expect(sMid.burstProgress).toBeGreaterThan(0)
    expect(sMid.burstProgress).toBeLessThan(1)
  })

  it('skip 立即 done 并触发完成回调', () => {
    const tl = new AnimationTimeline()
    tl.start(0)
    let done = false
    tl.onComplete(() => {
      done = true
    })
    tl.update(1000)
    tl.skip()
    expect(tl.state).toBe('done')
    expect(done).toBe(true)
  })

  it('debug.startAtStage 可快进到指定阶段', () => {
    const tl = new AnimationTimeline({ debug: { startAtStage: 'bigbang' } })
    tl.start(0)
    const snap = tl.update(0)
    expect(snap.stage).toBe('bigbang')
    expect(tl.state).toBe('scripted')
  })
})
