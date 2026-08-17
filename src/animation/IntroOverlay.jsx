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
  const diagRef = useRef(null)
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
  const [showDiag, setShowDiag] = useState(false)

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
    if (st.debug.debug) {
      setDebugOn(true)
      setShowDiag(true)
    } else {
      // 非 debug 也默认显示诊断面板 15 秒，便于定位动画问题
      setShowDiag(true)
      const t = setTimeout(() => setShowDiag(false), 15000)
      return () => clearTimeout(t)
    }
  }, [st])

  // 诊断面板：左上角大字号显示运行状态；错误捕获仅在 introDebug=1 时启用
  useEffect(() => {
    const errors = []
    let onError = null
    const render = () => {
      const t = timelineRef.current
      if (!diagRef.current) return
      const lines = [
        `阶段: ${stageRef.current}`,
        `状态: ${t?.state || '-'}`,
        `时间: ${Math.round(t?.elapsed || 0)}ms`,
        `渲染: ${st.kind || '-'} / ${st.tier || '-'}`,
      ]
      if (errors.length) lines.push(`错误(${errors.length}): ${errors[errors.length - 1]}`)
      diagRef.current.textContent = lines.join('\n')
    }
    if (st.debug.debug) {
      onError = (e) => {
        errors.push(e.message || String(e.error || e))
        render()
      }
      window.addEventListener('error', onError)
    }
    const timer = setInterval(render, 400)
    return () => {
      if (onError) window.removeEventListener('error', onError)
      clearInterval(timer)
    }
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

      // 帧率监控：three 档位监控降级；debug 时显示 FPS/tier/stage/state/elapsed
      if (kind === 'three') {
        st.fps = new FpsMonitor({
          onSlow: () => degrade(),
          onFrame: (f) => {
            if (st.debug.debug && fpsTextRef.current) {
              const t = timelineRef.current
              fpsTextRef.current.textContent =
                `FPS ${Math.round(f)} · ${st.tier} · ${stageRef.current}` +
                ` · ${t?.state} · ${Math.round(t?.elapsed || 0)}ms`
            }
          },
        })
        st.fps.start()
      }

      let started = false
      function loop() {
        if (disposed) return
        // 统一用 performance.now() 作时间源：某些 WebView 的 rAF 回调时间参数可能不递增，
        // 导致 dt 恒为 0、时间轴卡死。performance.now() 在标准浏览器必然单调递增。
        const now = performance.now()
        if (st.debug.pause) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        try {
          if (!started) {
            timeline.start(now)
            started = true
          }
          const snapshot = timeline.update(now)
          renderer.update(snapshot)
        } catch (err) {
          // 单帧出错不中断循环，打印便于定位
          console.error('[intro] frame error:', err)
        }
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
    if (t?.isWaitingForUser) t.startAcceleration()
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
      {showDiag && <div className="intro-diag" ref={diagRef}>诊断加载中...</div>}
      {debugOn && <div className="intro-fps" ref={fpsTextRef}>FPS --</div>}
    </div>
  )
}
