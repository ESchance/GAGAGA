/**
 * 跳过按钮组件
 * 仅在后续登录时显示
 */

import { useCallback } from 'react'

export default function SkipButton({ onSkip, visible }) {
  const handleClick = useCallback(() => {
    if (onSkip) {
      onSkip()
    }
  }, [onSkip])

  if (!visible) return null

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-8 right-8 px-6 py-3 bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20 hover:text-white rounded-full text-sm font-medium transition-all duration-300 z-50"
    >
      跳过动画 →
    </button>
  )
}
