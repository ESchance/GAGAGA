/**
 * 入场动画主组件 - 宇宙大爆发叙事体验
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import AnimationCanvas from './core/AnimationCanvas'
import SkipButton from './components/SkipButton'
import { AnimationTimeline, PHASES } from './timeline/AnimationTimeline'

export default function IntroAnimation({
  onComplete,
  isFirstTime = true,
  showSkip = false,
  onPhaseChange,
  onExploreClick
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [animationStarted, setAnimationStarted] = useState(false)
  const [showExploreButton, setShowExploreButton] = useState(false)
  const timelineRef = useRef(null)

  // 初始化动画时间轴（26秒）
  useEffect(() => {
    timelineRef.current = new AnimationTimeline(26000)

    // 模拟加载过程
    let progress = 0
    const loadInterval = setInterval(() => {
      progress += Math.random() * 10 + 3
      if (progress >= 100) {
        progress = 100
        setIsLoading(false)
        clearInterval(loadInterval)

        // 延迟启动动画
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

    timeline.onPhaseChange = (phase) => {
      // 通知父组件阶段变化
      if (onPhaseChange) {
        onPhaseChange(phase)
      }

      // 在按钮阶段显示"开始探索"按钮
      if (phase === PHASES.BUTTON) {
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
  }, [animationStarted, onComplete, onPhaseChange])

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
    // 继续动画
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
    <div className="fixed inset-0 z-50 bg-black">
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

      {/* "开始探索" 按钮 */}
      {!isLoading && showExploreButton && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <button
            onClick={handleExploreClick}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-full text-lg font-medium hover:bg-white/20 hover:border-white/40 transition-all duration-300 animate-fade-in"
          >
            开始探索
          </button>
        </div>
      )}

      {/* 跳过按钮（仅老用户登录后显示） */}
      {!isLoading && showSkip && !showExploreButton && (
        <SkipButton visible={true} onSkip={handleSkip} />
      )}
    </div>
  )
}
