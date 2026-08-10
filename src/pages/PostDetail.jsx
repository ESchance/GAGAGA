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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">帖子不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 帖子内容 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>
          <p className="text-gray-600 whitespace-pre-wrap mb-4">{post.content}</p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <Link to={`/profile/${post.user_id}`} className="flex items-center space-x-2 hover:text-blue-600">
              <Avatar
                url={post.profiles?.avatar_url}
                username={post.profiles?.username}
                size="sm"
              />
              <span>{post.profiles?.username || '匿名用户'}</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span>{new Date(post.created_at).toLocaleString('zh-CN')}</span>
              {user && user.id === post.user_id && (
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
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
