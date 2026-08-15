/**
 * 入场动画主组件 - 最终版
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import RendererSwitch from './core/RendererSwitch'
import SkipButton from './components/SkipButton'
import HUDOverlay from './components/HUDOverlay'
import MobileHUD from './components/MobileHUD'
import { AnimationTimeline, PHASES } from './timeline/AnimationTimeline'

export default function IntroAnimation({
  onComplete,
  _isFirstTime = true,
  showSkip = false,
  onExploreClick
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [animationStarted, setAnimationStarted] = useState(false)
  const [rendererReady, setRendererReady] = useState(false)
  const [showExploreButton, setShowExploreButton] = useState(false)
  const [showHUD, setShowHUD] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [hoveredNebula, setHoveredNebula] = useState(null)
  const timelineRef = useRef(null)

  // 惰性初始化时间轴，保证任何渲染时都已存在
  if (!timelineRef.current) {
    timelineRef.current = new AnimationTimeline(28000)
  }

  // 假加载进度条（期间并行预加载渲染器 + 科技感字体）
  useEffect(() => {
    // 按需加载 Orbitron / JetBrains Mono 字体（自托管，符合 CSP）
    // 并等待字体实际下载完成，避免标题先用系统字体显示、随后切换导致"抽动"
    const fontReady = Promise.allSettled([
      import('@fontsource/orbitron/400.css'),
      import('@fontsource/orbitron/700.css'),
      import('@fontsource/orbitron/900.css'),
      import('@fontsource/jetbrains-mono/400.css'),
      import('@fontsource/jetbrains-mono/500.css')
    ]).then(() => document.fonts.ready).then(() => Promise.all([
      document.fonts.load('700 72px Orbitron'),
      document.fonts.load('900 72px Orbitron'),
      document.fonts.load('400 16px "JetBrains Mono"')
    ]))

    let progress = 0
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      clearInterval(loadInterval)
      setIsLoading(false)
    }

    const loadInterval = setInterval(() => {
      progress += Math.random() * 10 + 3
      if (progress >= 100) {
        progress = 100
        // 字体就绪后才结束加载；最多兜底等待 6 秒
        fontReady.then(finish).catch(finish)
        setTimeout(finish, 6000)
      }
      setLoadProgress(Math.min(progress, 100))
    }, 150)

    return () => clearInterval(loadInterval)
  }, [])

  // 渲染器就绪且 loading 完成后才开始动画（避免时间轴跳帧）
  useEffect(() => {
    if (isLoading || !rendererReady) return
    setAnimationStarted(true)
  }, [isLoading, rendererReady])

  useEffect(() => {
    if (!timelineRef.current || !animationStarted) return

    const timeline = timelineRef.current

    timeline.onPhaseChange = (newPhase) => {
      if (newPhase === PHASES.BIRTH) {
        setShowTitle(true)
      }
      if (newPhase === PHASES.EXPLOSION) {
        setShowTitle(false)
      }
      if (newPhase === PHASES.TRAVERSE) {
        setShowHUD(true)
      }
      if (newPhase === PHASES.BUTTON) {
        setShowExploreButton(true)
        // 暂停时间轴，等待用户点击
        timeline.isWaitingForUser = true
      }
      if (newPhase === PHASES.FAST_TRAVERSE) {
        setShowHUD(false)
        setShowExploreButton(false)
      }
    }

    timeline.onComplete = () => {
      setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 500)
    }
  }, [animationStarted, onComplete])

  useEffect(() => {
    if (animationStarted && timelineRef.current) {
      timelineRef.current.start()
    }
  }, [animationStarted])

  // 点击开始探索 → 继续动画（快速穿梭）
  const handleExploreClick = useCallback(() => {
    setShowExploreButton(false)
    setShowHUD(false)

    if (timelineRef.current) {
      timelineRef.current.continueAfterUserAction()
    }

    // 通知父组件
    if (onExploreClick) {
      onExploreClick()
    }
  }, [onExploreClick])

  const handleSkip = useCallback(() => {
    if (onComplete) {
      onComplete()
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* 加载界面 */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-2xl">嘎</span>
            </div>
          </div>
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="text-gray-500 text-sm mt-4">加载中... {Math.round(loadProgress)}%</p>
        </div>
      )}

      {/* 动画画布（渲染器选择器：PC 高配 Three.js / 移动端及降级 2D）
          始终挂载，loading 期间并行预加载渲染器 */}
      <RendererSwitch
        timeline={timelineRef.current}
        onNebulaHover={setHoveredNebula}
        onReady={() => setRendererReady(true)}
      />

      {/* 标题 */}
      {!isLoading && showTitle && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="text-center relative">
            {/* 深色遮罩：压暗背景，保证标题清晰可读 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square rounded-full bg-black/60 blur-3xl" />
            <div className="relative">
              {/* 主标题：平滑浮现（淡入 + 上移 + 缩放） */}
              <h1 className="title-fade-in text-5xl md:text-7xl font-bold text-white mb-4" style={{
                textShadow: '0 0 40px rgba(0, 255, 255, 0.6), 0 0 80px rgba(0, 191, 255, 0.3)',
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.2em'
              }}>
                嘎宇宙
              </h1>
              {/* 副标题：错峰淡入，更平缓 */}
              <p className="title-fade-in-delayed text-cyan-300 text-lg tracking-widest opacity-80" style={{
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                GAGA UNIVERSE
              </p>
              <p className="title-fade-in-delayed text-gray-400 text-sm mt-2 tracking-widest" style={{ animationDelay: '0.7s' }}>
                初始化宇宙创生协议
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      {!isLoading && showHUD && (
        <>
          <div className="hidden sm:block">
            <HUDOverlay visible={showHUD} hoveredNebula={hoveredNebula} />
          </div>
          <div className="sm:hidden">
            <MobileHUD visible={showHUD} hoveredNebula={hoveredNebula} />
          </div>
        </>
      )}

      {/* 开始探索按钮 */}
      {!isLoading && showExploreButton && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="text-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #00bfff 30%, #e0ffff 60%, #9370db 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.15em',
              textShadow: '0 0 30px rgba(0, 255, 255, 0.3)'
            }}>
              宇宙探索者
            </h2>
            <p className="text-cyan-300 text-sm tracking-widest mb-8" style={{
              fontFamily: 'JetBrains Mono, monospace',
              textShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
            }}>
              深空探索系统已激活 · 准备进入宇宙
            </p>
            <button
              onClick={handleExploreClick}
              className="px-10 py-4 bg-white/10 backdrop-blur-sm text-cyan-300 border border-cyan-400/40 rounded-lg text-lg font-medium hover:bg-white/20 hover:border-cyan-400/80 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
              style={{
                fontFamily: 'Orbitron, sans-serif',
                letterSpacing: '0.2em',
                clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
              }}
            >
              开始探索
            </button>
            <p className="text-gray-500 text-xs mt-4 tracking-widest">
              点击进入深空
            </p>
          </div>
        </div>
      )}

      {/* 跳过按钮 */}
      {!isLoading && showSkip && !showExploreButton && (
        <SkipButton visible={true} onSkip={handleSkip} />
      )}
    </div>
  )
}
