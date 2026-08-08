import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取所有帖子
    fetchPosts()

    // 订阅新帖子和删除帖子的实时更新
    const subscription = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有事件（INSERT, UPDATE, DELETE）
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          // 数据变化，重新获取列表
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('获取帖子失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post.id !== postId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">最新帖子</h1>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            还没有帖子，快来发第一个帖子吧！
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
