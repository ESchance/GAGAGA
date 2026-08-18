import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'

export default function Login() {
  return (
    <div className="page-container py-12 px-4">
      <AuthForm type="login" />

      <p className="text-center mt-6 text-(--color-text-secondary) animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        还没有账号？{' '}
        <Link to="/register" className="font-semibold heading-gradient hover:opacity-80 transition-opacity duration-300">
          点击注册
        </Link>
      </p>
    </div>
  )
}
