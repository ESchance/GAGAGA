import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CommentList from '../components/CommentList'
import Avatar from '../components/Avatar'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    fetchPost()
  }, [id])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('id', id)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('获取帖子失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个帖子吗？')) return

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

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">帖子不存在</h3>
          <p className="text-gray-500 mb-4">该帖子可能已被删除</p>
          <a
            href="/"
            className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate inline-block"
          >
            🏠 返回首页
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 帖子内容 */}
        <div className="glass-effect p-8 rounded-2xl shadow-lg mb-6 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
          <p className="text-gray-700 whitespace-pre-wrap mb-6 leading-relaxed text-lg">{post.content}</p>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <Link
              to={`/profile/${post.user_id}`}
              className="flex items-center space-x-3 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors duration-200"
            >
              <Avatar
                url={post.profiles?.avatar_url}
                username={post.profiles?.username}
                size="md"
              />
              <div>
                <span className="font-semibold text-gray-800 block">{post.profiles?.username || '匿名用户'}</span>
                <span className="text-xs text-gray-500">作者</span>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                🕐 {new Date(post.created_at).toLocaleString('zh-CN')}
              </span>
              {user && user.id === post.user_id && (
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

        {/* 评论区 */}
        <CommentList postId={id} />
      </div>
    </div>
  )
}
