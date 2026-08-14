/**
 * 入场动画主组件 - 电影级叙事体验
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
        case 'nebula_form':
          // 星云凝聚 - 轻微嗡鸣
          soundManager.playDrone(4, 0, 0.15)
          break
        case 'traverse':
          // 穿越 - whoosh音效
          soundManager.playWhoosh(1)
          break
        case 'discovery':
          // 发现星球 - 共鸣声
          soundManager.playGlow(2)
          break
        case 'transition':
          // 进入世界 - 裂开音效
          soundManager.playWhoosh(0.8)
          break
        case 'complete':
          // 完成 - 和弦音
          soundManager.playComplete()
          break
      }
    }

    timeline.onComplete = () => {
      setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 1000)
    }
  }, [animationStarted, isMuted, onComplete])

  // 启动动画
  useEffect(() => {
    if (animationStarted && timelineRef.current) {
      // 播放初始音效（低沉的嗡鸣）
      if (!isMuted) {
        soundManager.playDrone(2, 0, 0.1)
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
