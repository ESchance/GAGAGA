/**
 * 入场动画 Hook
 * 管理动画状态和逻辑
 */

import { useState, useEffect, useCallback } from 'react'

const INTRO_ANIMATION_KEY = 'gagaga_intro_animation_seen'

export function useIntroAnimation() {
  const [showAnimation, setShowAnimation] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 检查是否是首次访问
    const hasSeenAnimation = localStorage.getItem(INTRO_ANIMATION_KEY)
    setIsFirstTime(!hasSeenAnimation)
    setIsReady(true)
  }, [])

  const startAnimation = useCallback(() => {
    setShowAnimation(true)
  }, [])

  const completeAnimation = useCallback(() => {
    // 标记已看过动画
    localStorage.setItem(INTRO_ANIMATION_KEY, 'true')
    setShowAnimation(false)
  }, [])

  const skipAnimation = useCallback(() => {
    // 跳过也标记为已看过
    localStorage.setItem(INTRO_ANIMATION_KEY, 'true')
    setShowAnimation(false)
  }, [])

  const resetAnimation = useCallback(() => {
    // 重置动画状态（用于测试）
    localStorage.removeItem(INTRO_ANIMATION_KEY)
    setIsFirstTime(true)
  }, [])

  return {
    showAnimation,
    isFirstTime,
    isReady,
    startAnimation,
    completeAnimation,
    skipAnimation,
    resetAnimation
  }
}
