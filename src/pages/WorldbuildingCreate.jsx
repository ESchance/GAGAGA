import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { createWorldbuilding, checkRaceSelected } from '../lib/worldbuilding'
import { validateTitle, validateContent } from '../lib/validation'
import { BookIcon, MaskIcon, GlobeIcon, LightbulbIcon, GalaxyIcon } from '../components/Icons'
import { FolderOpen, Pin, FileText, Lightbulb, Rocket, CheckCircle2, AlertCircle } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'story', label: '故事', Icon: BookIcon, description: '创作嘎宇宙中的故事' },
  { value: 'character', label: '角色', Icon: MaskIcon, description: '设定你的角色背景' },
  { value: 'setting', label: '设定', Icon: GlobeIcon, description: '补充世界观设定' },
  { value: 'idea', label: '点子', Icon: LightbulbIcon, description: '提出新的创意想法' }
]

export default function WorldbuildingCreate() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [type, setType] = useState('story')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [raceSelected, setRaceSelected] = useState(false)
  const [raceLoading, setRaceLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
        return
      }
      setUser(session.user)

      // 检查是否已选择种族
      checkRaceSelected(session.user.id).then((selected) => {
        setRaceSelected(selected)
        setRaceLoading(false)
      })
    })
  }, [navigate])

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
      const result = await createWorldbuilding(user.id, type, title, content)

      if (result) {
        setMessage('发布成功！')
        setTimeout(() => {
          navigate(`/worldbuilding/${result.id}`)
        }, 1000)
      } else {
        setMessage('发布失败，请重试')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/worldbuilding')}
          className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors"
        >
          ← 返回创作列表
        </button>

        <div className="glass-effect p-8 rounded-2xl shadow-lg animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold heading-gradient">
              创作新内容
            </h2>
            <p className="text-(--color-text-tertiary) mt-2">在嘎宇宙中留下你的印记</p>
          </div>

          {raceLoading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-(--color-text-tertiary)">加载中...</p>
            </div>
          ) : !raceSelected ? (
            <div className="text-center py-8">
              <GalaxyIcon className="w-20 h-20 mx-auto mb-4 text-[var(--color-primary)]" />
              <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">请先选择种族</h3>
              <p className="text-(--color-text-tertiary) mb-6">在开始创作之前，你需要先在个人主页选择种族</p>
              <button
                onClick={() => navigate(`/profile/${user?.id}`)}
                className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate"
              >
                前往选择种族
              </button>
            </div>
          ) : (
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

              {/* 创作提示 */}
              <div className="bg-[var(--color-primary-light)] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[var(--color-primary)] mb-2 flex items-center gap-1.5"><Lightbulb size={16} /> 创作提示</h4>
                <ul className="text-xs text-[var(--color-secondary)] space-y-1">
                  <li>• 故事类：可以描写你在嘎宇宙中的冒险经历</li>
                  <li>• 角色类：可以设定你角色的背景故事和性格</li>
                  <li>• 设定类：可以补充嘎宇宙的世界观设定</li>
                  <li>• 点子类：可以提出新的创意和想法</li>
                </ul>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/worldbuilding')}
                  className="px-6 py-3 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-tertiary) rounded-xl transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="btn-gradient text-white px-6 py-3 rounded-xl font-medium btn-animate disabled:opacity-50 inline-flex items-center"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="loading-spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      发布中...
                    </span>
                  ) : (
                    <><Rocket size={16} className="mr-1.5" /> 发布</>
                  )}
                </button>
              </div>
            </form>
          )}

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
