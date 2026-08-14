/**
 * 入场动画主组件 - 电影级叙事体验
 * 管理整个入场动画流程
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import AnimationCanvas from './core/AnimationCanvas'
import SkipButton from './components/SkipButton'
import { AnimationTimeline, PHASES } from './timeline/AnimationTimeline'

export default function IntroAnimation({ onComplete, isFirstTime = true }) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [showSkip, setShowSkip] = useState(!isFirstTime)
  const [animationStarted, setAnimationStarted] = useState(false)
  const timelineRef = useRef(null)

  // 初始化动画时间轴（30秒）
  useEffect(() => {
    timelineRef.current = new AnimationTimeline(30000)

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

  // 动画完成回调
  useEffect(() => {
    if (!timelineRef.current || !animationStarted) return

    const timeline = timelineRef.current

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
          onComplete={onComplete}
        />
      )}

      {/* 跳过按钮（仅后续登录显示） */}
      {!isLoading && (
        <SkipButton visible={showSkip} onSkip={handleSkip} />
      )}
    </div>
  )
}
