import { useEffect, useRef } from 'react'

// 弹窗焦点圈闭：打开时把 Tab 焦点限制在弹窗内，支持 ESC 关闭，关闭后焦点还原
// 用法：const ref = useRef(null); useFocusTrap(active, onClose, ref)
export function useFocusTrap(active, onClose, containerRef) {
  const lastFocusedRef = useRef(null)

  useEffect(() => {
    if (!active) return
    lastFocusedRef.current = document.activeElement

    const container = containerRef?.current
    if (!container) return

    const getFocusable = () => [...container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.disabled && el.offsetParent !== null)

    // 初始焦点放到弹窗内第一个可聚焦元素
    const first = getFocusable()[0]
    first?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      lastFocusedRef.current?.focus?.()
    }
  }, [active, onClose, containerRef])
}
