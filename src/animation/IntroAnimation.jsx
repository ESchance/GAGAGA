/**
 * 入场动画主组件
 * 管理整个入场动画流程
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import AnimationCanvas from './core/AnimationCanvas'
import SkipButton from './components/SkipButton'
import MuteButton from './components/MuteButton'
import { AnimationTimeline, PHASES } from './timeline/AnimationTimeline'
import { soundManager } from './audio/SoundManager'

export default function IntroAnimation({ onComplete, isFirstTime = true }) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showSkip, setShowSkip] = useState(!isFirstTime)
  const [animationStarted, setAnimationStarted] = useState(false)
  const timelineRef = useRef(null)

  // 初始化动画时间轴
  useEffect(() => {
    timelineRef.current = new AnimationTimeline(5000)

    // 模拟加载过程
    let progress = 0
    const loadInterval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        setIsLoading(false)
        clearInterval(loadInterval)

        // 延迟启动动画
        setTimeout(() => {
          setAnimationStarted(true)
        }, 300)
      }
      setLoadProgress(Math.min(progress, 100))
    }, 100)

    return () => clearInterval(loadInterval)
  }, [])

  // 初始化音效
  useEffect(() => {
    const initAudio = async () => {
      await soundManager.init()
    }
    initAudio()
  }, [])

  // 动画阶段变化时播放音效
  useEffect(() => {
    if (!timelineRef.current || !animationStarted) return

    const timeline = timelineRef.current

    timeline.onPhaseChange = (phase) => {
      if (isMuted) return

      switch (phase) {
        case 'star_form':
          soundManager.playBurst(0.5)
          soundManager.playAmbient(4)
          break
        case 'traverse':
          soundManager.playWhoosh(0.8)
          break
        case 'core':
          soundManager.playGlow(1)
          break
        case 'crack':
          soundManager.playWhoosh(0.6)
          break
        case 'complete':
          soundManager.playComplete()
          break
      }
    }

    timeline.onComplete = () => {
      setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 500)
    }
  }, [animationStarted, isMuted, onComplete])

  // 启动动画
  useEffect(() => {
    if (animationStarted && timelineRef.current) {
      // 播放初始音效
      if (!isMuted) {
        soundManager.playDrone(1, 0, 0.2)
      }

      timelineRef.current.start()
    }
  }, [animationStarted, isMuted])

  // 切换音效
  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev
      if (newMuted) {
        soundManager.disable()
      } else {
        soundManager.enable()
      }
      return newMuted
    })
  }, [])

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
          isMuted={isMuted}
        />
      )}

      {/* 音量控制按钮 */}
      {!isLoading && (
        <MuteButton isMuted={isMuted} onToggle={handleToggleMute} />
      )}

      {/* 跳过按钮（仅后续登录显示） */}
      {!isLoading && (
        <SkipButton visible={showSkip} onSkip={handleSkip} />
      )}
    </div>
  )
}
