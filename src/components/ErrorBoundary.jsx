import { Component } from 'react'
import { AlertCircle } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-(--color-bg-secondary) flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertCircle size={64} className="mx-auto mb-4 text-(--color-error)" />
            <h2 className="text-2xl font-bold text-(--color-text-primary) mb-2">信号中断</h2>
            <p className="text-(--color-text-secondary) mb-4">
              页面遇到了未知干扰，请尝试重新建立连接。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient text-white px-6 py-2 rounded-full font-medium"
            >
              重新连接
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
