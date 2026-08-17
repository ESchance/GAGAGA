// 入场动画全屏遮罩：持有 canvas、创建 timeline + 渲染器、驱动 rAF 主循环
// 职责边界：只做"怎么播"，播完调 onComplete；新用户播完由 AppShell 弹种族选择
// 生命周期用局部 disposed（每个 effect 独立），避免与共享状态冲突

import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimationTimeline } from './AnimationTimeline'
import { detectTier } from './device'
import { createRenderer } from './renderer/RendererSwitch'
import { FpsMonitor } from './FpsMonitor'
import Title from './components/Title'
import StartButton from './components/StartButton'
import SkipButton from './components/SkipButton'
import HUD from './components/HUD'

export default function IntroOverlay({ newUser, onComplete }) {
  const canvasRef = useRef(null)
  const fpsTextRef = useRef(null)
  const timelineRef = useRef(null)
  const rafRef = useRef(0)
  const stageRef = useRef('nebula')
  const st = useRef({
    kind: null,
    tier: null,
    renderer: null,
    fps: null,
    resizeHandler: null,
    debug: {},
  }).current

  const [stage, setStage] = useState('nebula')
  const [showStart, setShowStart] = useState(false)
  const [debugOn, setDebugOn] = useState(false)

  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  // 读取调试参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    st.debug = {
      startAtStage: params.get('introStage') || undefined,
      pause: params.get('introPause') === '1',
      debug: params.get('introDebug') === '1',
    }
    if (st.debug.debug) setDebugOn(true)
  }, [st])

  // 主逻辑：创建 timeline + 渲染器 + 主循环
  useEffect(() => {
    const canvas = canvasRef.current
    let disposed = false

    function handleStage(key) {
      stageRef.current = key
      setStage(key)
      if (key === 'travel') {
        setTimeout(() => setShowStart(true), 800)
      }
      if (key === 'burst') setShowStart(false)
    }

    function doComplete() {
      if (!disposed) completeRef.current?.()
    }

    // 降级：three → 2d（重建渲染器，timeline 不重启）
    async function degrade() {
      if (st.kind === '2d' || disposed) return
      st.renderer?.dispose()
      st.renderer = null
      try {
        const res = await createRenderer(canvas, { tier: '2d' })
        if (disposed || !res.renderer) {
          res.renderer?.dispose()
          return
        }
        st.kind = res.kind
        st.tier = res.tier
        st.renderer = res.renderer
        st.resizeHandler?.()
      } catch (err) {
        console.warn('[intro] degrade failed:', err)
      }
    }

    async function init() {
      const tier = detectTier()
      const timeline = new AnimationTimeline({ debug: st.debug })
      timelineRef.current = timeline
      timeline.onStageChange(handleStage)
      timeline.onComplete(doComplete)

      let renderer
      let kind
      let actualTier
      try {
        const res = await createRenderer(canvas, { tier })
        renderer = res.renderer
        kind = res.kind
        actualTier = res.tier
      } catch (err) {
        console.warn('[intro] createRenderer failed:', err)
        return
      }

      if (disposed) {
        renderer?.dispose()
        return
      }
      if (kind === 'skip') {
        doComplete() // prefers-reduced-motion：直接跳过
        return
      }

      st.kind = kind
      st.tier = actualTier
      st.renderer = renderer

      st.resizeHandler = () => renderer.resize(window.innerWidth, window.innerHeight)
      st.resizeHandler()
      window.addEventListener('resize', st.resizeHandler)

      timeline.start(performance.now())

      // 帧率监控：three 档位监控降级；debug 时显示 FPS/tier/stage
      if (kind === 'three') {
        st.fps = new FpsMonitor({
          onSlow: () => degrade(),
          onFrame: (f) => {
            if (st.debug.debug && fpsTextRef.current) {
              fpsTextRef.current.textContent =
                `FPS ${Math.round(f)} · ${st.tier} · ${stageRef.current}`
            }
          },
        })
        st.fps.start()
      }

      function loop(now) {
        if (disposed) return
        if (st.debug.pause) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        const snapshot = timeline.update(now)
        renderer.update(snapshot)
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    init()

    return () => {
      disposed = true
      cancelAnimationFrame(rafRef.current)
      st.fps?.stop()
      st.fps = null
      st.renderer?.dispose()
      st.renderer = null
      if (st.resizeHandler) {
        window.removeEventListener('resize', st.resizeHandler)
        st.resizeHandler = null
      }
    }
  }, [st])

  const handleStart = useCallback(() => {
    const t = timelineRef.current
    if (t?.isWaitingForUser) t.startAcceleration(performance.now())
  }, [])

  const handleSkip = useCallback(() => {
    timelineRef.current?.skip()
  }, [])

  return (
    <div className="intro-overlay">
      <canvas ref={canvasRef} className="intro-canvas" />
      <Title stage={stage} />
      <HUD stage={stage} />
      <StartButton onClick={handleStart} show={showStart} />
      {!newUser && <SkipButton onClick={handleSkip} />}
      {debugOn && <div className="intro-fps" ref={fpsTextRef}>FPS --</div>}
    </div>
  )
}
