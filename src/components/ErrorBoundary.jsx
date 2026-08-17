import { Component } from 'react'

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
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-(--color-text-primary) mb-2">出错了</h2>
            <p className="text-(--color-text-secondary) mb-4">
              页面遇到了一个错误，请尝试刷新页面。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient text-white px-6 py-2 rounded-full font-medium"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
