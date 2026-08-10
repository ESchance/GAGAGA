import { Link } from 'react-router-dom'
import { useState, useEffect, memo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { checkIsAdmin, togglePinPost } from '../lib/admin'
import { RACES } from '../lib/worldbuilding'
import Avatar from './Avatar'

// 格式化时间的纯函数（移到组件外部，避免每次渲染重新创建）
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
    <div className={`post-card card-hover animate-fade-in-up ${post.is_pinned ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
      <Link to={`/post/${post.id}`} className="block">
        {/* 置顶标记 */}
        {post.is_pinned && (
          <div className="flex items-center mb-2 text-yellow-600 text-sm font-medium">
            <span className="mr-1">📌</span>
            <span>置顶</span>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors duration-200">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {post.content}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Avatar
              url={post.profiles?.avatar_url}
              username={post.profiles?.username}
              size="sm"
              role={post.profiles?.role}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">{post.profiles?.username || '匿名用户'}</span>
                {post.profiles?.role === 'admin' && (
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                    管理员
                  </span>
                )}
              </div>
              {post.profiles?.member_code && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{RACES[post.profiles?.race]?.icon || '🧑'}</span>
                  <span className="font-mono">{post.profiles.member_code}</span>
                  <span>{RACES[post.profiles?.race]?.name || '人类'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-500 flex items-center space-x-1">
              <span>🕐</span>
              <span>{formatDate(post.created_at)}</span>
            </span>

            {/* 管理员操作按钮 */}
            {isAdmin && (
              <>
                <button
                  onClick={handlePin}
                  className={`px-3 py-1 rounded-full transition-all duration-200 ${
                    post.is_pinned
                      ? 'text-yellow-600 hover:text-white hover:bg-yellow-500'
                      : 'text-yellow-500 hover:text-white hover:bg-yellow-500'
                  }`}
                >
                  {post.is_pinned ? '📌 取消置顶' : '📌 置顶'}
                </button>
              </>
            )}

            {/* 删除按钮（作者或管理员） */}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200"
              >
                🗑️ 删除
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
})

export default PostCard
