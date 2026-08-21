import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { togglePinPost } from '../lib/admin'
import { RACES } from '../lib/worldbuilding'
import CommentList from '../components/CommentList'
import { Pin, Crown, Clock, Trash2, RefreshCw, Home, Inbox, AlertCircle } from 'lucide-react'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import { useToast } from '../components/Toast'
import { RaceAvatar } from '../components/RaceBadge'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, isAdmin } = useAuth()

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url, role, race, member_code)')
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
          <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors">
            ← 返回首页
          </Link>
          <div className="glass-effect p-8 rounded-2xl shadow-lg mb-6">
            <Skeleton className="h-8 w-3/4 mb-5" />
            <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-(--color-border)">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-11/12 mb-3" />
            <Skeleton className="h-4 w-4/5 mb-3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-40 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors">
            ← 返回首页
          </Link>
          <EmptyState
            icon={<AlertCircle size={28} className="text-(--color-error)" />}
            title="加载失败"
            description={error}
          >
            <button
              onClick={fetchPost}
              className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate mr-4 inline-flex items-center"
            >
              <RefreshCw size={16} className="mr-1.5" /> 重试
            </button>
            <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)]">
              <Home size={16} className="mr-1.5" /> 返回首页
            </Link>
          </EmptyState>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors">
            ← 返回首页
          </Link>
          <EmptyState
            icon={<Inbox size={28} />}
            title="信号已丢失"
            description="这个信号可能已被撤销或删除"
          >
            <Link to="/" className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate inline-flex items-center">
              <Home size={16} className="mr-1.5" /> 返回首页
            </Link>
          </EmptyState>
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

        <article className={`glass-effect p-8 rounded-2xl shadow-lg mb-6 animate-fade-in-up ${post.is_pinned ? 'ring-1 ring-(--color-warning)/50' : ''}`}>
          {post.is_pinned && (
            <div className="inline-flex items-center mb-4 px-3 py-1 bg-(--color-warning)/15 text-(--color-warning) text-sm font-medium rounded-full">
              <Pin size={16} className="mr-1.5" /> 置顶
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
                race={post.profiles?.race}
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
                race={post.profiles?.race}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-(--color-text-primary)">{post.profiles?.username || '匿名用户'}</span>
                  {post.profiles?.role === 'admin' && (
                    <span className="hidden sm:inline text-xs admin-badge px-2 py-0.5 rounded-full font-medium">
                      管理员
                    </span>
                  )}
                  {post.profiles?.role === 'admin' && (
                    <span className="sm:hidden text-xs" title="管理员"><Crown size={14} /></span>
                  )}
                </div>
               {post.profiles?.member_code ? (
                 <div className="flex items-center space-x-2 text-xs text-(--color-text-tertiary)">
                    <RaceAvatar
                      race={post.profiles?.race}
                      size="sm"
                      fallbackClassName="w-3.5 h-3.5"
                      style={{ filter: `drop-shadow(0 0 5px rgba(255,255,255,0.3))` }}
                    />
                    <span className="member-code">{post.profiles.member_code}</span>
                    <span>{RACES[post.profiles?.race]?.name || '人类'}</span>
                  </div>
                ) : (
                  <span className="text-xs text-(--color-text-tertiary)">作者</span>
                )}
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-(--color-text-tertiary) bg-(--color-bg-tertiary) px-3 py-1 rounded-full">
                <Clock size={14} className="mr-1.5" /> {new Date(post.created_at).toLocaleString('zh-CN')}
              </span>

              {isAdmin && (
                <button
                  onClick={handlePin}
                  className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
                    post.is_pinned
                      ? 'text-(--color-warning) hover:text-white hover:bg-(--color-warning)/100 bg-(--color-warning)/10'
                      : 'text-(--color-warning) hover:text-white hover:bg-(--color-warning)'
                  }`}
                >
                  <><Pin size={16} /> {post.is_pinned ? '取消置顶' : '置顶'}</>
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-(--color-error) hover:text-white hover:bg-(--color-error) rounded-full transition-all duration-200 font-medium"
                >
                  <Trash2 size={16} className="mr-1.5" /> 删除
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
