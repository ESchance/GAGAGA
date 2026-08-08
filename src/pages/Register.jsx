import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AuthForm from '../components/AuthForm'
import { allowedEmails } from '../lib/allowedEmails'

export default function Register() {
  const [registeredEmails, setRegisteredEmails] = useState([])

  useEffect(() => {
    fetchRegisteredEmails()
  }, [])

  const fetchRegisteredEmails = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_registered_emails')

      if (error) throw error
      setRegisteredEmails(data?.map(item => item.email) || [])
    } catch (error) {
      console.error('获取已注册邮箱失败:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <AuthForm type="register" />

      <div className="max-w-md mx-auto mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          📧 可用的注册邮箱：
        </h3>
        <div className="max-h-40 overflow-y-auto text-xs">
          {allowedEmails.map((email, index) => {
            const isRegistered = registeredEmails.includes(email)
            return (
              <div
                key={index}
                className={`py-1 border-b border-blue-100 last:border-0 ${
                  isRegistered ? 'text-red-500 line-through' : 'text-blue-700'
                }`}
              >
                {email}
                {isRegistered && ' (已注册)'}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          红色删除线表示已注册，密码需包含大小写字母和数字
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
