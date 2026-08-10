import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkIsAdmin, togglePinPost } from '../lib/admin'
import CommentList from '../components/CommentList'
import Avatar from '../components/Avatar'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

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
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url, role)')
        .eq('id', id)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('获取帖子失败:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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
      alert('删除失败：' + error.message)
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
          <a href="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors">
            ← 返回首页
          </a>
          <div className="text-center py-16">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <a href="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors">
            ← 返回首页
          </a>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">加载失败</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchPost}
              className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate mr-4"
            >
              🔄 重试
            </button>
            <a href="/" className="inline-flex items-center text-gray-600 hover:text-blue-600">
              🏠 返回首页
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <a href="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors">
            ← 返回首页
          </a>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">帖子不存在</h3>
            <p className="text-gray-500 mb-4">该帖子可能已被删除</p>
            <a href="/" className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate inline-block">
              🏠 返回首页
            </a>
          </div>
        </div>
      </div>
    )
  }

  // post 不为 null，安全访问
  const canDelete = user && (user.id === post.user_id || isAdmin)

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto px-4">
        <a href="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors">
          ← 返回首页
        </a>

        <div className={`glass-effect p-8 rounded-2xl shadow-lg mb-6 animate-fade-in-up ${post.is_pinned ? 'ring-2 ring-yellow-400' : ''}`}>
          {post.is_pinned && (
            <div className="flex items-center mb-4 text-yellow-600 text-sm font-medium bg-yellow-50 px-4 py-2 rounded-full inline-flex">
              <span className="mr-2">📌</span>
              <span>置顶帖子</span>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
          <p className="text-gray-700 whitespace-pre-wrap mb-6 leading-relaxed text-lg">{post.content}</p>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-200 gap-4">
            <Link
              to={`/profile/${post.user_id}`}
              className="flex items-center space-x-3 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors duration-200"
            >
              <Avatar
                url={post.profiles?.avatar_url}
                username={post.profiles?.username}
                size="md"
                role={post.profiles?.role}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-800">{post.profiles?.username || '匿名用户'}</span>
                  {post.profiles?.role === 'admin' && (
                    <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                      管理员
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">作者</span>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                🕐 {new Date(post.created_at).toLocaleString('zh-CN')}
              </span>

              {isAdmin && (
                <button
                  onClick={handlePin}
                  className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
                    post.is_pinned
                      ? 'text-yellow-600 hover:text-white hover:bg-yellow-500 bg-yellow-50'
                      : 'text-yellow-500 hover:text-white hover:bg-yellow-500'
                  }`}
                >
                  {post.is_pinned ? '📌 取消置顶' : '📌 置顶'}
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 font-medium"
                >
                  🗑️ 删除
                </button>
              )}
            </div>
          </div>
        </div>

        <CommentList postId={id} />
      </div>
    </div>
  )
}
