import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import AnnouncementBar from '../components/AnnouncementBar'

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
        .select('*, profiles(username, avatar_url, role)')
        .order('is_pinned', { ascending: false })
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
    setPosts(prev => prev.filter(post => post.id !== postId))
  }

  const handlePinChange = (postId, isPinned) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, is_pinned: isPinned } : post
    ))
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

  return (
    <div className="page-container">
      {/* 公告栏 */}
      <AnnouncementBar />

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🌟 最新帖子
            </h1>
            <p className="text-gray-500">发现精彩内容，参与讨论</p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="empty-state-icon mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">还没有帖子</h3>
              <p className="text-gray-500 mb-6">快来发第一个帖子吧！</p>
              <a
                href="/create"
                className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate inline-block"
              >
                ✏️ 发帖
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div key={post.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <PostCard
                    post={post}
                    onDelete={handleDeletePost}
                    onPinChange={handlePinChange}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
