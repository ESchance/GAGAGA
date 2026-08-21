import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { deleteComment } from '../lib/admin'
import { validateComment } from '../lib/validation'
import { useToast } from './Toast'
import Avatar from './Avatar'
import { LogIn, AlertTriangle, Send, MessageSquare, Clock, Crown } from 'lucide-react'
import EmptyState from './EmptyState'
import { RaceAvatar } from './RaceBadge'

export default function CommentList({ postId, requireRace = false }) {
  const { showToast } = useToast()
  const { user, profile: currentUserProfile, isAdmin } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url, role, race, member_code)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('获取评论失败:', error)
    }
  }, [postId])

  useEffect(() => {
    // 获取评论列表
    fetchComments()

    // 订阅新评论的实时更新
    const subscription = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          // 新评论需要作者信息，重新获取列表
          fetchComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          // 本地移除被删除的评论
          setComments(prev => prev.filter(c => c.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [postId, fetchComments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    // 输入校验
    const commentCheck = validateComment(newComment)
    if (!commentCheck.valid) {
      showToast(commentCheck.message, 'error')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            content: newComment,
            post_id: postId,
            user_id: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error
      // 乐观插入本地，评论立即上屏（附带当前用户资料）
      setComments(prev => [
        ...prev,
        {
          ...data,
          profiles: {
            username: currentUserProfile?.username,
            avatar_url: currentUserProfile?.avatar_url,
            role: currentUserProfile?.role
          }
        }
      ])
      setNewComment('')
    } catch (error) {
      console.error('发表评论失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId, commentUserId) => {
    if (!user) return

    const confirmMessage = isAdmin && user.id !== commentUserId
      ? '你是管理员，确定要删除这条评论吗？'
      : '确定要删除这条评论吗？'

    if (!confirm(confirmMessage)) return

    const success = await deleteComment(commentId)
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  return (
    <div className="glass-effect p-6 rounded-2xl shadow-lg animate-fade-in-up">
      <h3 className="text-xl font-bold heading-gradient mb-6">
        评论 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      {!user ? (
        // 未登录
        <div className="mb-6 p-6 bg-gradient-to-r from-(--color-bg-secondary) to-(--color-bg-tertiary) rounded-xl text-center">
          <p className="text-(--color-text-secondary) mb-3">请先登录后再发表评论</p>
          <Link
            to="/login"
            className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate inline-flex items-center"
          >
            <LogIn size={16} className="mr-1.5" /> 登录
          </Link>
        </div>
      ) : requireRace && !currentUserProfile?.race_selected ? (
        // 需要种族选择但未选择（仅嘎宇宙创作）
        <div className="mb-6 p-4 bg-(--color-warning)/10 border border-(--color-warning)/30 rounded-xl text-center">
          <p className="text-(--color-warning) text-sm">
            <AlertTriangle size={16} className="mr-1.5" /> 你还没有选择种族，无法发表评论。
            <Link to={`/profile/${user.id}`} className="ml-2 text-(--color-warning) underline">
              去选择种族
            </Link>
          </p>
        </div>
      ) : (
        // 已登录且符合条件
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start space-x-4">
            <Avatar
              url={currentUserProfile?.avatar_url}
              username={currentUserProfile?.username}
              size="md"
              role={currentUserProfile?.role}
              race={currentUserProfile?.race}
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 comment-input focus:outline-none"
                placeholder="写下你的评论..."
                required
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="mt-3 btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="loading-spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    正在发射…
                  </span>
                ) : (
                  <><Send size={16} className="mr-1.5" /> 发表评论</>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={28} />}
            title="还没有回波"
            description="发出第一条回波吧"
            className="py-10"
          />
        ) : (
          comments.map((comment, index) => {
            const canDeleteComment = user && (user.id === comment.user_id || isAdmin)

            return (
              <div
                key={comment.id}
                className="p-4 bg-gradient-to-r from-(--color-bg-secondary) to-(--color-bg-tertiary) rounded-xl animate-fade-in-up"
                style={{ animationDelay: `${Math.min(index, 8) * 0.03}s` }}
              >
                <div className="flex items-start space-x-4">
                  <Avatar
                    url={comment.profiles?.avatar_url}
                    username={comment.profiles?.username}
                    size="md"
                    role={comment.profiles?.role}
                    race={comment.profiles?.race}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-(--color-text-primary)">
                          {comment.profiles?.username || '匿名用户'}
                        </span>
                        {comment.profiles?.role === 'admin' && (
                          <span className="hidden sm:inline text-xs admin-badge px-2 py-0.5 rounded-full font-medium">
                            管理员
                          </span>
                        )}
                        {comment.profiles?.role === 'admin' && (
                          <span className="sm:hidden text-xs" title="管理员"><Crown size={14} /></span>
                        )}
                       {comment.profiles?.member_code && (
                         <span className="text-xs text-(--color-text-tertiary) inline-flex items-center space-x-1">
                            <RaceAvatar
                              race={comment.profiles?.race}
                              size="sm"
                              fallbackClassName="w-3.5 h-3.5"
                              style={{ filter: `drop-shadow(0 0 5px rgba(255,255,255,0.3))` }}
                            />
                            <span className="member-code">{comment.profiles.member_code}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-(--color-text-tertiary) bg-(--color-surface) px-2 py-1 rounded-full inline-flex items-center">
                          <Clock size={14} className="mr-1" /> {new Date(comment.created_at).toLocaleString('zh-CN')}
                        </span>
                        {canDeleteComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                            className="text-(--color-error) hover:text-white hover:bg-(--color-error)/100 p-1 rounded-full transition-all duration-200"
                            title="删除评论"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-(--color-text-secondary) whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
