import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isEmailAllowed, allowedEmails } from '../lib/allowedEmails'
import { validateEmail, validateUsername, validatePassword, isDangerous } from '../lib/validation'

export default function AuthForm({ type = 'login' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [emailRegistered, setEmailRegistered] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const navigate = useNavigate()

  // 检查邮箱是否已注册
  const checkEmailRegistered = async (emailToCheck) => {
    if (!emailToCheck || !isEmailAllowed(emailToCheck)) {
      setEmailRegistered(false)
      return
    }

    setCheckingEmail(true)
    try {
      // 查询 auth.users 表看是否有这个邮箱
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      // 如果查询失败或有数据，说明可能已注册
      // 由于无法直接查询 auth.users，我们在提交时检查
      setEmailRegistered(false)
    } catch (error) {
      console.error('检查邮箱失败:', error)
    } finally {
      setCheckingEmail(false)
    }
  }

  // 密码验证
  const validatePassword = (pwd) => {
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    return hasUpperCase && hasLowerCase && hasNumber
  }

  // 密码强度提示
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, text: '', color: '' }

    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    const hasMinLength = pwd.length >= 6

    const score = [hasUpperCase, hasLowerCase, hasNumber, hasMinLength].filter(Boolean).length

    if (score < 3) return { level: 1, text: '密码强度：弱', color: 'text-red-500' }
    if (score < 4) return { level: 2, text: '密码强度：中', color: 'text-yellow-500' }
    return { level: 3, text: '密码强度：强', color: 'text-green-500' }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    console.log('开始注册流程', { email, username })

    try {
      if (type === 'register') {
        // 简化的输入验证
        if (!email || email.length < 5) {
          throw new Error('请输入有效的邮箱地址')
        }

        if (!username || username.length < 2) {
          throw new Error('用户名至少需要2个字符')
        }

        if (!password || password.length < 6) {
          throw new Error('密码至少需要6个字符')
        }

        // 检查邮箱是否在白名单中
        console.log('检查邮箱白名单...')
        if (!isEmailAllowed(email)) {
          throw new Error('该邮箱未被授权注册，请使用指定的邮箱地址')
        }

        // 注册新用户
        console.log('开始注册...')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        })

        console.log('注册结果:', { data, error })

        if (error) {
          console.error('注册错误:', error)
          if (error.message.includes('already registered')) {
            throw new Error('该邮箱已被注册，请直接登录')
          }
          throw error
        }

        // 注册成功（profile 由数据库触发器自动创建）
        setMessage('注册成功！')
        // 显示入场动画，动画结束后跳转到种族选择
        navigate('/?showIntro=true&newUser=true')
      } else {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        // 登录成功，显示入场动画
        navigate('/?showIntro=true')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="max-w-md mx-auto mt-10 p-8 glass-effect rounded-2xl shadow-xl animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {type === 'register' ? '🚀 注册' : '👋 登录'}
        </h2>
        <p className="text-gray-500 mt-2">
          {type === 'register' ? '加入嘎宇宙，开始你的旅程' : '欢迎回来！'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {type === 'register' && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl input-animate focus:border-blue-500 focus:outline-none"
              placeholder="请输入用户名"
              required
            />
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📧 邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailRegistered(false)
            }}
            onBlur={() => checkEmailRegistered(email)}
            className={`w-full px-4 py-3 border-2 rounded-xl input-animate focus:outline-none ${
              emailRegistered
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="请输入邮箱"
            required
          />
          {emailRegistered && (
            <p className="mt-2 text-sm text-red-500 line-through flex items-center">
              <span className="mr-1">⚠️</span> 该邮箱已注册，请直接登录
            </p>
          )}
          {type === 'register' && !emailRegistered && (
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <span className="mr-1">💡</span> 只能使用指定的邮箱注册
            </p>
          )}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔒 密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl input-animate focus:border-blue-500 focus:outline-none"
            placeholder="请输入密码"
            required
            minLength={6}
          />
          {type === 'register' && password && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <p className={`text-sm font-medium ${passwordStrength.color} mb-2`}>
                {passwordStrength.text}
              </p>
              <div className="flex gap-2 mb-3">
                <div className={`password-strength flex-1 ${passwordStrength.level >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                <div className={`password-strength flex-1 ${passwordStrength.level >= 2 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                <div className={`password-strength flex-1 ${passwordStrength.level >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[A-Z]/.test(password) ? '✅' : '⬜'}</span>
                  包含大写字母
                </li>
                <li className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[a-z]/.test(password) ? '✅' : '⬜'}</span>
                  包含小写字母
                </li>
                <li className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[0-9]/.test(password) ? '✅' : '⬜'}</span>
                  包含数字
                </li>
                <li className={`flex items-center ${password.length >= 6 ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{password.length >= 6 ? '✅' : '⬜'}</span>
                  至少6位
                </li>
              </ul>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-gradient text-white py-3 px-4 rounded-xl font-medium btn-animate disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="loading-spinner mr-2" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              处理中...
            </span>
          ) : (
            type === 'register' ? '🚀 注册' : '👋 登录'
          )}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-xl flex items-center animate-fade-in-up ${
          message.includes('成功')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span className="mr-2">{message.includes('成功') ? '✅' : '❌'}</span>
          {message}
        </div>
      )}
    </div>
  )
}
