import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { validateTitle, validateContent } from '../lib/validation'
import { Pin, FileText, Rocket, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CreatePost() {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    // 输入校验
    const titleCheck = validateTitle(title)
    if (!titleCheck.valid) {
      setMessage(titleCheck.message)
      return
    }
    const contentCheck = validateContent(content)
    if (!contentCheck.valid) {
      setMessage(contentCheck.message)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('posts')
        .insert([
          {
            title,
            content,
            user_id: user.id
          }
        ])

      if (error) throw error

      setMessage('发帖成功！')
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container py-12 px-4">
      <div className="max-w-2xl mx-auto glass-effect p-8 rounded-2xl shadow-lg animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold heading-gradient">
            发表新帖子
          </h2>
          <p className="text-(--color-text-tertiary) mt-2">分享你的想法和见解</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-semibold text-(--color-text-secondary) mb-2">
              <span className="inline-flex items-center gap-1.5"><Pin size={16} /> 标题</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-(--color-border) rounded-xl input-animate focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="请输入帖子标题"
              required
            />
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-semibold text-(--color-text-secondary) mb-2">
              <span className="inline-flex items-center gap-1.5"><FileText size={16} /> 内容</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border-2 border-(--color-border) rounded-xl input-animate focus:border-[var(--color-primary)] focus:outline-none resize-none"
              placeholder="请输入帖子内容..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient text-white py-3 px-4 rounded-xl font-medium btn-animate disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="loading-spinner mr-2" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                正在点火…
              </span>
            ) : (
              <><Rocket size={16} className="mr-1.5" /> 发布帖子</>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-center animate-fade-in-up ${
            message.includes('成功')
              ? 'bg-(--color-success)/10 text-(--color-success) border border-(--color-success)/30'
              : 'bg-(--color-error)/10 text-(--color-error) border border-(--color-error)/30'
          }`}>
            <span className="mr-2">{message.includes('成功') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</span>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
