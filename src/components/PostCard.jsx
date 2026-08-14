import { Link } from 'react-router-dom'
import { useState, useEffect, memo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { checkIsAdmin, togglePinPost } from '../lib/admin'
import { RACES } from '../lib/worldbuilding'
import Avatar from './Avatar'

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return date.toLocaleDateString('zh-CN')
}

const PostCard = memo(function PostCard({ post, onDelete, onPinChange }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin)
      }
    })
  }, [])

  const handleDelete = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    const confirmMessage = isAdmin && user.id !== post.user_id
      ? '你是管理员，确定要删除这个帖子吗？'
      : '确定要删除这个帖子吗？'

    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error
      if (onDelete) onDelete(post.id)
    } catch (error) {
      console.error('删除帖子失败:', error)
      alert('删除失败：' + error.message)
    }
  }, [user, isAdmin, post.id, post.user_id, onDelete])

  const handlePin = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const success = await togglePinPost(post.id, post.is_pinned)
    if (success && onPinChange) {
      onPinChange(post.id, !post.is_pinned)
    }
  }, [post.id, post.is_pinned, onPinChange])

  const canDelete = user && (user.id === post.user_id || isAdmin)

  return (
    <article className={`post-card card-hover animate-fade-in-up ${post.is_pinned ? 'ring-2 ring-yellow-400/50 bg-yellow-50/50' : ''}`}>
      <Link to={`/post/${post.id}`} className="block">
        {/* 置顶标记 */}
        {post.is_pinned && (
          <div className="inline-flex items-center mb-3 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <span className="mr-1">📌</span>
            置顶
          </div>
        )}

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 hover:text-[var(--color-primary)] transition-colors duration-200">
          {post.title}
        </h3>

        {/* 内容预览 */}
        <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2 leading-relaxed">
          {post.content}
        </p>

        {/* 底部信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              url={post.profiles?.avatar_url}
              username={post.profiles?.username}
              size="sm"
              role={post.profiles?.role}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {post.profiles?.username || '匿名用户'}
                </span>
                {post.profiles?.role === 'admin' && (
                  <span className="hidden sm:inline text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                    管理员
                  </span>
                )}
                {post.profiles?.role === 'admin' && (
                  <span className="sm:hidden text-xs" title="管理员">👑</span>
                )}
              </div>
              {post.profiles?.member_code && (
                <div className="flex items-center space-x-1.5 text-xs text-[var(--color-text-tertiary)]">
                  <span>{RACES[post.profiles?.race]?.icon || '🧑'}</span>
                  <span className="font-mono">{post.profiles.member_code}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 时间 */}
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {formatDate(post.created_at)}
            </span>

            {/* 管理员操作按钮 */}
            {isAdmin && (
              <button
                onClick={handlePin}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                title={post.is_pinned ? '取消置顶' : '置顶'}
              >
                {post.is_pinned ? '📌' : '📍'}
              </button>
            )}

            {/* 删除按钮 */}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                title="删除"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
})

export default PostCard
