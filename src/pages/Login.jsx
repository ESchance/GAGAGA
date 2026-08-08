import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <AuthForm type="login" />

      <p className="text-center mt-4 text-gray-600">
        还没有账号？{' '}
        <Link to="/register" className="text-blue-500 hover:underline">
          点击注册
        </Link>
      </p>
    </div>
  )
}
