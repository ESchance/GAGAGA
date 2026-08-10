import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { checkIsAdmin, adminDeleteComment } from '../lib/admin'
import Avatar from './Avatar'

export default function CommentList({ postId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchCurrentUserProfile(session.user.id)
        checkIsAdmin(session.user.id).then(setIsAdmin)
      }
    })

    // 获取评论列表
    fetchComments()

    // 订阅新评论的实时更新
    const subscription = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          // 数据变化，重新获取列表
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [postId])

  const fetchCurrentUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, role')
        .eq('id', userId)
        .single()

      if (error) throw error
      setCurrentUserProfile(data)
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url, role)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('获取评论失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            content: newComment,
            post_id: postId,
            user_id: user.id
          }
        ])

      if (error) throw error
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

    const success = await adminDeleteComment(commentId)
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  return (
    <div className="glass-effect p-6 rounded-2xl shadow-lg animate-fade-in-up">
      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
        💬 评论 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start space-x-4">
            <Avatar
              url={currentUserProfile?.avatar_url}
              username={currentUserProfile?.username}
              size="md"
              role={currentUserProfile?.role}
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
                className="mt-3 btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="loading-spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    发送中...
                  </span>
                ) : (
                  '✨ 发表评论'
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl text-center">
          <p className="text-gray-600 mb-3">请先登录后再发表评论</p>
          <a
            href="/login"
            className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate inline-block"
          >
            👋 登录
          </a>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💭</div>
            <p className="text-gray-500">暂无评论，快来发表第一条评论吧！</p>
          </div>
        ) : (
          comments.map((comment, index) => {
            const canDeleteComment = user && (user.id === comment.user_id || isAdmin)

            return (
              <div
                key={comment.id}
                className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start space-x-4">
                  <Avatar
                    url={comment.profiles?.avatar_url}
                    username={comment.profiles?.username}
                    size="md"
                    role={comment.profiles?.role}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">
                          {comment.profiles?.username || '匿名用户'}
                        </span>
                        {comment.profiles?.role === 'admin' && (
                          <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                            管理员
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                          🕐 {new Date(comment.created_at).toLocaleString('zh-CN')}
                        </span>
                        {canDeleteComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                            className="text-xs text-red-500 hover:text-white hover:bg-red-500 px-2 py-1 rounded-full transition-all duration-200"
                          >
                            🗑️ 删除
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
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
