import { Link } from 'react-router-dom'
import { memo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { togglePinPost } from '../lib/admin'
import { useToast } from './Toast'
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

const PostCard = memo(function PostCard({ post, onDelete, onPinChange, isAdmin = false, currentUserId = null }) {
  const { showToast } = useToast()
  const handleDelete = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) return

    const confirmMessage = isAdmin && currentUserId !== post.user_id
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
      showToast('删除失败：' + error.message, 'error')
    }
  }, [currentUserId, isAdmin, post.id, post.user_id, onDelete, showToast])

  const handlePin = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const success = await togglePinPost(post.id, post.is_pinned)
    if (success && onPinChange) {
      onPinChange(post.id, !post.is_pinned)
    }
  }, [post.id, post.is_pinned, onPinChange])

  const canDelete = currentUserId && (currentUserId === post.user_id || isAdmin)

  return (
    <article className={`post-card card-hover animate-fade-in-up ${post.is_pinned ? 'ring-1 ring-yellow-400/50' : ''}`}>
      <Link to={`/post/${post.id}`} className="block">
        {/* 置顶标记 */}
        {post.is_pinned && (
          <div className="inline-flex items-center mb-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
            📌 置顶
          </div>
        )}

        {/* 标题 - 第一层级 */}
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1.5 hover:text-[var(--color-primary)] transition-colors duration-150 line-clamp-2">
          {post.title}
        </h3>

        {/* 内容预览 - 第二层级 */}
        <p className="text-[var(--color-text-secondary)] text-sm mb-3 line-clamp-2 leading-relaxed">
          {post.content}
        </p>

        {/* 元信息 - 第三层级 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar
              url={post.profiles?.avatar_url}
              username={post.profiles?.username}
              size="sm"
              role={post.profiles?.role}
            />
            <div className="flex items-center space-x-1.5">
              <span className="text-sm text-[var(--color-text-primary)]">
                {post.profiles?.username || '匿名用户'}
              </span>
              {post.profiles?.role === 'admin' && (
                <span className="hidden sm:inline text-xs bg-[var(--color-primary-light)] text-[var(--color-primary)] px-1.5 py-0.5 rounded font-medium">
                  管理
                </span>
              )}
              {post.profiles?.role === 'admin' && (
                <span className="sm:hidden text-xs" title="管理员">👑</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {formatDate(post.created_at)}
            </span>

            {isAdmin && (
              <button
                onClick={handlePin}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors p-1"
                title={post.is_pinned ? '取消置顶' : '置顶'}
              >
                {post.is_pinned ? '📌' : '📍'}
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors p-1"
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
