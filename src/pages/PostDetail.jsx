import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkIsAdmin, togglePinPost } from '../lib/admin'
import { RACES } from '../lib/worldbuilding'
import CommentList from '../components/CommentList'
import Avatar from '../components/Avatar'
import { useToast } from '../components/Toast'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url, role)')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setError('帖子不存在或已被删除')
        return
      }
      setPost(data)
    } catch (error) {
      console.error('获取帖子失败:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin)
      }
    }).catch(err => {
      console.error('获取会话失败:', err)
    })

    fetchPost()
  }, [id, fetchPost])

  const handleDelete = async () => {
    if (!post || !user) return

    const confirmMessage = isAdmin && user.id !== post.user_id
      ? '你是管理员，确定要删除这个帖子吗？'
      : '确定要删除这个帖子吗？'

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      navigate('/')
    } catch (error) {
      console.error('删除帖子失败:', error)
      showToast('删除失败：' + error.message, 'error')
    }
  }

  const handlePin = async () => {
    if (!post) return
    const success = await togglePinPost(id, post.is_pinned)
    if (success) {
      setPost({ ...post, is_pinned: !post.is_pinned })
    }
  }

  if (loading) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-blue-600 mb-6 transition-colors">
            ← 返回首页
          </Link>
          <div className="text-center py-16">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-(--color-text-tertiary)">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-blue-600 mb-6 transition-colors">
            ← 返回首页
          </Link>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">加载失败</h3>
            <p className="text-(--color-text-tertiary) mb-4">{error}</p>
            <button
              onClick={fetchPost}
              className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate mr-4"
            >
              🔄 重试
            </button>
            <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-blue-600">
              🏠 返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-blue-600 mb-6 transition-colors">
            ← 返回首页
          </Link>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">帖子不存在</h3>
            <p className="text-(--color-text-tertiary) mb-4">该帖子可能已被删除</p>
            <Link to="/" className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate inline-block">
              🏠 返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // post 不为 null，安全访问
  const canDelete = user && (user.id === post.user_id || isAdmin)

  return (
    <div className="page-container py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors text-sm">
          ← 返回
        </Link>

        <article className={`glass-effect p-8 rounded-2xl shadow-lg mb-6 animate-fade-in-up ${post.is_pinned ? 'ring-1 ring-yellow-400/50' : ''}`}>
          {post.is_pinned && (
            <div className="inline-flex items-center mb-4 px-3 py-1 bg-(--color-warning)/15 text-(--color-warning) text-sm font-medium rounded-full">
              📌 置顶
            </div>
          )}

          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight">{post.title}</h1>

          {/* 作者信息 */}
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-[var(--color-border)]">
            <Link to={`/profile/${post.user_id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Avatar
                url={post.profiles?.avatar_url}
                username={post.profiles?.username}
                size="md"
                role={post.profiles?.role}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-[var(--color-text-primary)]">{post.profiles?.username || '匿名用户'}</span>
                  {post.profiles?.role === 'admin' && (
                    <span className="text-xs bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-0.5 rounded font-medium">
                      管理员
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {new Date(post.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
            </Link>
          </div>

          {/* 内容 - 使用阅读内容样式 */}
          <div className="reading-content mb-6">{post.content}</div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-(--color-border) gap-4">
            <Link
              to={`/profile/${post.user_id}`}
              className="flex items-center space-x-3 hover:bg-(--color-bg-tertiary) px-4 py-2 rounded-full transition-colors duration-200"
            >
              <Avatar
                url={post.profiles?.avatar_url}
                username={post.profiles?.username}
                size="md"
                role={post.profiles?.role}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-(--color-text-primary)">{post.profiles?.username || '匿名用户'}</span>
                  {post.profiles?.role === 'admin' && (
                    <span className="hidden sm:inline text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                      管理员
                    </span>
                  )}
                  {post.profiles?.role === 'admin' && (
                    <span className="sm:hidden text-xs" title="管理员">👑</span>
                  )}
                </div>
                {post.profiles?.member_code ? (
                  <div className="flex items-center space-x-2 text-xs text-(--color-text-tertiary)">
                    <span>{RACES[post.profiles?.race]?.icon || '🧑'}</span>
                    <span className="font-mono">{post.profiles.member_code}</span>
                    <span>{RACES[post.profiles?.race]?.name || '人类'}</span>
                  </div>
                ) : (
                  <span className="text-xs text-(--color-text-tertiary)">作者</span>
                )}
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-(--color-text-tertiary) bg-(--color-bg-tertiary) px-3 py-1 rounded-full">
                🕐 {new Date(post.created_at).toLocaleString('zh-CN')}
              </span>

              {isAdmin && (
                <button
                  onClick={handlePin}
                  className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
                    post.is_pinned
                      ? 'text-(--color-warning) hover:text-white hover:bg-(--color-warning)/100 bg-(--color-warning)/10'
                      : 'text-yellow-500 hover:text-white hover:bg-(--color-warning)/100'
                  }`}
                >
                  {post.is_pinned ? '📌 取消置顶' : '📌 置顶'}
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-500 hover:text-white hover:bg-(--color-error)/100 rounded-full transition-all duration-200 font-medium"
                >
                  🗑️ 删除
                </button>
              )}
            </div>
          </div>
        </article>

        {/* 评论区 */}
        <CommentList postId={id} />
      </div>
    </div>
  )
}
