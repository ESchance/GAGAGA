/* eslint-disable react/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

// 轻量提示条（Toast）系统
// 用法：const { showToast } = useToast(); showToast('操作成功', 'success')
// type: success / error / warning / info（默认 info）
// 自动消失：error 4.5 秒，其余 3 秒

const ToastContext = createContext(null)

// 在组件中获取 showToast
export function useToast() {
  return useContext(ToastContext)
}

let toastId = 0

const ICONS = {
  success: <CheckCircle2 size={20} className="text-(--color-success)" />,
  error: <XCircle size={20} className="text-(--color-error)" />,
  warning: <AlertTriangle size={20} className="text-(--color-warning)" />,
  info: <Info size={20} className="text-(--color-info)" />
}

const BORDER_COLORS = {
  success: 'border-(--color-success)/40',
  error: 'border-(--color-error)/40',
  warning: 'border-(--color-warning)/40',
  info: 'border-[var(--color-border)]'
}

function ToastItem({ toast, onClose }) {
  const { message, type } = toast
  return (
    <div
      className={`pointer-events-auto w-full max-w-sm flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg bg-[var(--color-surface)] border ${BORDER_COLORS[type] || BORDER_COLORS.info} animate-fade-in-up`}
    >
      <div className="flex items-center space-x-2 min-w-0">
        <span className="flex-shrink-0">{ICONS[type] || ICONS.info}</span>
        <span className="text-sm text-[var(--color-text-primary)] break-words">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="关闭提示"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type }])
      const duration = type === 'error' ? 4500 : 3000
      setTimeout(() => removeToast(id), duration)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast 容器：屏幕底部居中，不拦截点击 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col items-center space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
