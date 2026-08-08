import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'

export default function Register() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <AuthForm type="register" />

      <p className="text-center mt-4 text-gray-600">
        已有账号？{' '}
        <Link to="/login" className="text-blue-500 hover:underline">
          点击登录
        </Link>
      </p>
    </div>
  )
}
