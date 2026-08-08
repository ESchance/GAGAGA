import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { allowedEmails } from '../lib/allowedEmails'

export default function Register() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <AuthForm type="register" />

      <div className="max-w-md mx-auto mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          📧 可用的注册邮箱：
        </h3>
        <div className="max-h-40 overflow-y-auto text-xs text-blue-700">
          {allowedEmails.map((email, index) => (
            <div key={index} className="py-1 border-b border-blue-100 last:border-0">
              {email}
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          请使用以上邮箱进行注册，密码可自行设置（6位以上）
        </p>
      </div>

      <p className="text-center mt-4 text-gray-600">
        已有账号？{' '}
        <Link to="/login" className="text-blue-500 hover:underline">
          点击登录
        </Link>
      </p>
    </div>
  )
}
