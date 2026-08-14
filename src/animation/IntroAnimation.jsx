/**
 * 入场动画主组件 - 最终版
 * 宇宙大爆发叙事体验
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import AnimationCanvas from './core/AnimationCanvas'
import SkipButton from './components/SkipButton'
import HUDOverlay from './components/HUDOverlay'
import { AnimationTimeline, PHASES } from './timeline/AnimationTimeline'

export default function IntroAnimation({
  onComplete,
  isFirstTime = true,
  showSkip = false,
  onExploreClick
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [animationStarted, setAnimationStarted] = useState(false)
  const [showExploreButton, setShowExploreButton] = useState(false)
  const [showHUD, setShowHUD] = useState(false)
  const [phase, setPhase] = useState(PHASES.DARKNESS)
  const [showTitle, setShowTitle] = useState(false)
  const timelineRef = useRef(null)

  // 初始化动画时间轴（34秒）
  useEffect(() => {
    timelineRef.current = new AnimationTimeline(34000)

    // 模拟加载过程
    let progress = 0
    const loadInterval = setInterval(() => {
      progress += Math.random() * 10 + 3
      if (progress >= 100) {
        progress = 100
        setIsLoading(false)
        clearInterval(loadInterval)

        setTimeout(() => {
          setAnimationStarted(true)
        }, 500)
      }
      setLoadProgress(Math.min(progress, 100))
    }, 150)

    return () => clearInterval(loadInterval)
  }, [])

  // 动画阶段变化
  useEffect(() => {
    if (!timelineRef.current || !animationStarted) return

    const timeline = timelineRef.current

    timeline.onPhaseChange = (newPhase) => {
      setPhase(newPhase)

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
      }
    }

    timeline.onComplete = () => {
      setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 1000)
    }
  }, [animationStarted, onComplete])

  // 启动动画
  useEffect(() => {
    if (animationStarted && timelineRef.current) {
      timelineRef.current.start()
    }
  }, [animationStarted])

  // 处理"开始探索"按钮点击
  const handleExploreClick = useCallback(() => {
    setShowExploreButton(false)
    if (onExploreClick) {
      onExploreClick()
    }
    if (timelineRef.current) {
      timelineRef.current.continueAfterUserAction()
    }
  }, [onExploreClick])

  // 跳过动画
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

      {/* 动画画布 */}
      {!isLoading && (
        <AnimationCanvas
          timeline={timelineRef.current}
        />
      )}

      {/* 标题显示 */}
      {!isLoading && showTitle && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4" style={{
              textShadow: '0 0 40px rgba(0, 255, 255, 0.6), 0 0 80px rgba(0, 191, 255, 0.3)',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.2em'
            }}>
              嘎宇宙
            </h1>
            <p className="text-cyan-300 text-lg tracking-widest opacity-80" style={{
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              GAGA UNIVERSE
            </p>
            <p className="text-gray-400 text-sm mt-2 tracking-widest">
              初始化宇宙创生协议
            </p>
          </div>
        </div>
      )}

      {/* HUD覆盖层 */}
      {!isLoading && showHUD && (
        <HUDOverlay visible={showHUD} />
      )}

      {/* "开始探索" 按钮 */}
      {!isLoading && showExploreButton && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="text-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #00bfff 30%, #e0ffff 60%, #9370db 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.15em'
            }}>
              宇宙探索者
            </h2>
            <p className="text-cyan-300 text-sm tracking-widest mb-8" style={{
              fontFamily: 'JetBrains Mono, monospace'
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

      {/* 跳过按钮（仅老用户登录后显示） */}
      {!isLoading && showSkip && !showExploreButton && (
        <SkipButton visible={true} onSkip={handleSkip} />
      )}
    </div>
  )
}
