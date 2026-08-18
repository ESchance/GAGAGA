import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isEmailAllowed } from '../lib/allowedEmails'
import { validateEmail, validateUsername, validatePassword } from '../lib/validation'
import { User, Mail, Lock, Eye, EyeOff, Lightbulb, Check, Circle, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AuthForm({ type = 'login' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({ username: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const clearError = (field) => {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  // 密码强度提示
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, text: '', color: '' }

    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumber = /[0-9]/.test(pwd)
    const hasMinLength = pwd.length >= 6

    const score = [hasUpperCase, hasLowerCase, hasNumber, hasMinLength].filter(Boolean).length

    if (score < 3) return { level: 1, text: '密码强度：弱', color: 'text-(--color-error)' }
    if (score < 4) return { level: 2, text: '密码强度：中', color: 'text-(--color-warning)' }
    return { level: 3, text: '密码强度：强', color: 'text-(--color-success)' }
  }

  // 字段级校验
  const validate = () => {
    const next = { username: '', email: '', password: '' }

    if (type === 'register') {
      const usernameCheck = validateUsername(username)
      if (!usernameCheck.valid) next.username = usernameCheck.message
      const passwordCheck = validatePassword(password)
      if (!passwordCheck.valid) next.password = passwordCheck.message
    } else if (!password) {
      next.password = '请输入密码'
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) next.email = emailCheck.message

    setErrors(next)
    return !next.username && !next.email && !next.password
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setMessage('')

    try {
      if (type === 'register') {
        // 检查邮箱是否在白名单中
        if (!isEmailAllowed(email)) {
          throw new Error('该邮箱未被授权注册，请使用指定的邮箱地址')
        }

        // 注册新用户
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        })

        if (error) {
          console.error('注册错误:', error)
          if (error.message.includes('already registered')) {
            throw new Error('该邮箱已被注册，请直接登录')
          }
          throw error
        }

        // 注册成功（profile 由数据库触发器自动创建），直接进入首页
        setMessage('注册成功！')
        navigate('/')
      } else {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        // 登录成功，直接进入首页
        navigate('/')
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
        <h2 className="text-3xl font-bold heading-gradient">
          {type === 'register' ? '注册' : '登录'}
        </h2>
        <p className="text-(--color-text-tertiary) mt-2">
          {type === 'register' ? '加入嘎宇宙，开始你的旅程' : '欢迎回来！'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {type === 'register' && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="username" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
              <span className="inline-flex items-center gap-1.5"><User size={16} /> 用户名</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError('username') }}
              className={`w-full px-4 py-3 border-2 rounded-xl input-animate focus:outline-none ${errors.username ? 'border-(--color-error)' : 'border-(--color-border) focus:border-[var(--color-primary)]'}`}
              placeholder="请输入用户名"
              required
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'username-error' : undefined}
            />
            {errors.username && (
              <p id="username-error" className="mt-2 text-xs text-(--color-error) flex items-center">
                <AlertCircle size={14} className="mr-1" /> {errors.username}
              </p>
            )}
          </div>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <label htmlFor="email" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
            <span className="inline-flex items-center gap-1.5"><Mail size={16} /> 邮箱</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError('email') }}
            className={`w-full px-4 py-3 border-2 rounded-xl input-animate focus:outline-none ${errors.email ? 'border-(--color-error)' : 'border-(--color-border) focus:border-[var(--color-primary)]'}`}
            placeholder="请输入邮箱"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-2 text-xs text-(--color-error) flex items-center">
              <AlertCircle size={14} className="mr-1" /> {errors.email}
            </p>
          )}
          {type === 'register' && !errors.email && (
            <p className="mt-2 text-xs text-(--color-text-tertiary) flex items-center">
              <Lightbulb size={14} className="mr-1.5" /> 只能使用指定的邮箱注册
            </p>
          )}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <label htmlFor="password" className="block text-sm font-medium text-(--color-text-secondary) mb-2">
            <span className="inline-flex items-center gap-1.5"><Lock size={16} /> 密码</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError('password') }}
              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl input-animate focus:outline-none ${errors.password ? 'border-(--color-error)' : 'border-(--color-border) focus:border-[var(--color-primary)]'}`}
              placeholder="请输入密码"
              required
              minLength={6}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary) hover:text-(--color-text-primary) transition-colors"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-2 text-xs text-(--color-error) flex items-center">
              <AlertCircle size={14} className="mr-1" /> {errors.password}
            </p>
          )}
          {type === 'register' && password && (
            <div className="mt-3 p-3 bg-(--color-bg-secondary) rounded-xl">
              <p className={`text-sm font-medium ${passwordStrength.color} mb-2`}>
                {passwordStrength.text}
              </p>
              <div className="flex gap-2 mb-3">
                <div className={`password-strength flex-1 ${passwordStrength.level >= 1 ? 'bg-(--color-error)' : 'bg-(--color-bg-tertiary)'}`}></div>
                <div className={`password-strength flex-1 ${passwordStrength.level >= 2 ? 'bg-(--color-warning)' : 'bg-(--color-bg-tertiary)'}`}></div>
                <div className={`password-strength flex-1 ${passwordStrength.level >= 3 ? 'bg-(--color-success)' : 'bg-(--color-bg-tertiary)'}`}></div>
              </div>
              <ul className="text-xs text-(--color-text-secondary) space-y-1">
                <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-(--color-success)' : ''}`}>
                  <span className="mr-2">{/[A-Z]/.test(password) ? <Check size={14} /> : <Circle size={14} />}</span>
                  包含大写字母
                </li>
                <li className={`flex items-center ${/[a-z]/.test(password) ? 'text-(--color-success)' : ''}`}>
                  <span className="mr-2">{/[a-z]/.test(password) ? <Check size={14} /> : <Circle size={14} />}</span>
                  包含小写字母
                </li>
                <li className={`flex items-center ${/[0-9]/.test(password) ? 'text-(--color-success)' : ''}`}>
                  <span className="mr-2">{/[0-9]/.test(password) ? <Check size={14} /> : <Circle size={14} />}</span>
                  包含数字
                </li>
                <li className={`flex items-center ${password.length >= 6 ? 'text-(--color-success)' : ''}`}>
                  <span className="mr-2">{password.length >= 6 ? <Check size={14} /> : <Circle size={14} />}</span>
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
            type === 'register' ? '注册' : '登录'
          )}
        </button>
      </form>

      {message && (
        <div role="alert" className={`mt-6 p-4 rounded-xl flex items-center animate-fade-in-up ${message.includes('成功')
            ? 'bg-(--color-success)/10 text-(--color-success) border border-(--color-success)/30'
            : 'bg-(--color-error)/10 text-(--color-error) border border-(--color-error)/30'}`}>
          <span className="mr-2">{message.includes('成功') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</span>
          {message}
        </div>
      )}
    </div>
  )
}
