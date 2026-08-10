import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from './Avatar'

export default function CommentList({ postId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [currentUserProfile, setCurrentUserProfile] = useState(null)

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchCurrentUserProfile(session.user.id)
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
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          // 新评论到来，重新获取列表
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
        .select('username, avatar_url')
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
        .select('*, profiles(username, avatar_url)')
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
    if (!newComment.trim()) return

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        评论 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-start space-x-3">
            <Avatar
              url={currentUserProfile?.avatar_url}
              username={currentUserProfile?.username}
              size="md"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="写下你的评论..."
                required
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '发送中...' : '发表评论'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-md text-center text-gray-500">
          请先<a href="/login" className="text-blue-500 hover:underline">登录</a>后再发表评论
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            暂无评论，快来发表第一条评论吧！
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <Avatar
                  url={comment.profiles?.avatar_url}
                  username={comment.profiles?.username}
                  size="md"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-800">
                      {comment.profiles?.username || '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
