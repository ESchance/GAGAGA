import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getWorldbuildingDetail, updateWorldbuilding } from '../lib/worldbuilding'
import { validateTitle, validateContent } from '../lib/validation'
import { BookIcon, MaskIcon, GlobeIcon, LightbulbIcon } from '../components/Icons'
import { FolderOpen, Pin, FileText, Save, Inbox, Ban, CheckCircle2, AlertCircle } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'story', label: '故事', Icon: BookIcon, description: '创作嘎宇宙中的故事' },
  { value: 'character', label: '角色', Icon: MaskIcon, description: '设定你的角色背景' },
  { value: 'setting', label: '设定', Icon: GlobeIcon, description: '补充世界观设定' },
  { value: 'idea', label: '点子', Icon: LightbulbIcon, description: '提出新的创意想法' }
]

export default function WorldbuildingEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [post, setPost] = useState(null)
  const [type, setType] = useState('story')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchPost = useCallback(async () => {
    const data = await getWorldbuildingDetail(id)
    if (!data) {
      setMessage('内容不存在')
      setLoading(false)
      return
    }

    setPost(data)
    setType(data.type)
    setTitle(data.title)
    setContent(data.content)
    setLoading(false)
  }, [id])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
        return
      }
      setUser(session.user)
    })

    fetchPost()
  }, [id, navigate, fetchPost])

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

    setSaving(true)
    setMessage('')

    try {
      const result = await updateWorldbuilding(id, user.id, type, title, content)

      if (result) {
        setMessage('保存成功！')
        setTimeout(() => {
          navigate(`/worldbuilding/${id}`)
        }, 1000)
      } else {
        setMessage('保存失败，请重试')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-(--color-text-tertiary)">加载中...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page-container py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate('/worldbuilding')}
            className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors"
          >
            ← 返回创作列表
          </button>
          <div className="text-center py-16">
            <Inbox size={64} className="mx-auto mb-4 text-(--color-text-tertiary)" />
            <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">内容不存在</h3>
            <p className="text-(--color-text-tertiary)">该内容可能已被删除</p>
          </div>
        </div>
      </div>
    )
  }

  // 检查是否是作者
  if (user && user.id !== post.user_id) {
    return (
      <div className="page-container py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate(`/worldbuilding/${id}`)}
            className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors"
          >
            ← 返回详情
          </button>
          <div className="text-center py-16">
            <Ban size={64} className="mx-auto mb-4 text-(--color-error)" />
            <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">无权编辑</h3>
            <p className="text-(--color-text-tertiary)">只有作者可以编辑自己的创作</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(`/worldbuilding/${id}`)}
          className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors"
        >
          ← 返回详情
        </button>

        <div className="glass-effect p-8 rounded-2xl shadow-lg animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold heading-gradient">
              编辑创作
            </h2>
            <p className="text-(--color-text-tertiary) mt-2">修改你的嘎宇宙创作</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 类型选择 */}
            <div>
              <label className="block text-sm font-semibold text-(--color-text-secondary) mb-3 flex items-center gap-1.5">
                <FolderOpen size={16} /> 类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      type === option.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                        : 'border-(--color-border) hover:border-(--color-border)'
                    }`}
                  >
                    <div className="font-medium text-(--color-text-primary) flex items-center gap-1.5"><option.Icon className="w-4 h-4 text-[var(--color-primary)]" /> {option.label}</div>
                    <div className="text-xs text-(--color-text-tertiary) mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-semibold text-(--color-text-secondary) mb-2 flex items-center gap-1.5">
                <Pin size={16} /> 标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-(--color-border) rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="请输入标题"
                required
              />
            </div>

            {/* 内容 */}
            <div>
              <label className="block text-sm font-semibold text-(--color-text-secondary) mb-2 flex items-center gap-1.5">
                <FileText size={16} /> 内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border-2 border-(--color-border) rounded-xl focus:border-[var(--color-primary)] focus:outline-none resize-none"
                placeholder="在这里写下你的创作..."
                required
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/worldbuilding/${id}`)}
                className="px-6 py-3 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-tertiary) rounded-xl transition-all duration-200 font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim() || !content.trim()}
                className="btn-gradient text-white px-6 py-3 rounded-xl font-medium btn-animate disabled:opacity-50 inline-flex items-center"
              >
                {saving ? (
                  <span className="flex items-center">
                    <div className="loading-spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    保存中...
                  </span>
                ) : (
                  <><Save size={16} className="mr-1.5" /> 保存修改</>
                )}
              </button>
            </div>
          </form>

          {/* 消息提示 */}
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
    </div>
  )
}
