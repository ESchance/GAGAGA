import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'

export default function Login() {
  return (
    <div className="page-container py-12 px-4">
      <AuthForm type="login" />

      <p className="text-center mt-6 text-(--color-text-secondary) animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        还没有账号？{' '}
        <Link to="/register" className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
          点击注册
        </Link>
      </p>
    </div>
  )
}
