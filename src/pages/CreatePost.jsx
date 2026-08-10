import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function CreatePost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // 检查用户是否已登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
        return
      }
      setUser(session.user)
    })
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ✏️ 发表新帖子
          </h2>
          <p className="text-gray-500 mt-2">分享你的想法和见解</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📌 标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl input-animate focus:border-blue-500 focus:outline-none"
              placeholder="请输入帖子标题"
              required
            />
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📝 内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl input-animate focus:border-blue-500 focus:outline-none resize-none"
              placeholder="请输入帖子内容..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient text-white py-3 px-4 rounded-xl font-medium btn-animate disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="loading-spinner mr-2" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                发布中...
              </span>
            ) : (
              '🚀 发布帖子'
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
    </div>
  )
}
