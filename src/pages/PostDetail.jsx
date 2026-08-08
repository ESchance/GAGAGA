import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CommentList from '../components/CommentList'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [id])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username)')
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
            <Link to={`/profile/${post.user_id}`} className="hover:text-blue-600">
              {post.profiles?.username || '匿名用户'}
            </Link>
            <span>{new Date(post.created_at).toLocaleString('zh-CN')}</span>
          </div>
        </div>

        {/* 评论区 */}
        <CommentList postId={id} />
      </div>
    </div>
  )
}
