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
    <div className="page-container py-12 px-4">
      <AuthForm type="register" />

      <div className="max-w-md mx-auto mt-6 glass-effect p-6 rounded-2xl shadow-lg animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
          📧 可用的注册邮箱
        </h3>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
          {allowedEmails.map((email, index) => {
            const isRegistered = registeredEmails.includes(email)
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                  isRegistered
                    ? 'bg-[var(--color-error)] bg-opacity-10 text-[var(--color-error)] line-through'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <span className="text-sm font-medium">{email}</span>
                {isRegistered && (
                  <span className="text-xs bg-[var(--color-error)] bg-opacity-20 text-[var(--color-error)] px-2 py-1 rounded-full">
                    已注册
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-xl">
          <p className="text-xs text-[var(--color-text-secondary)] flex items-center">
            <span className="mr-2">💡</span>
            红色删除线表示已注册，密码需包含大小写字母和数字
          </p>
        </div>
      </div>

      <p className="text-center mt-6 text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        已有账号？{' '}
        <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:underline transition-all duration-300">
          点击登录
        </Link>
      </p>
    </div>
  )
}
