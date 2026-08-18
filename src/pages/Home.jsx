import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import PostCard from '../components/PostCard'
import AnnouncementBar from '../components/AnnouncementBar'
import SiteAnnouncementAdmin from '../components/SiteAnnouncementAdmin'
import { Megaphone, FileText, PenLine } from 'lucide-react'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAnnouncementAdmin, setShowAnnouncementAdmin] = useState(false)
  const { user, isAdmin, isSuperAdmin } = useAuth()

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at, is_pinned, user_id, profiles(username, avatar_url, role)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)  // 限制返回数量

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('获取帖子失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 获取所有帖子
    fetchPosts()

    // 订阅新帖子和删除帖子的实时更新
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        // 新帖子需要作者信息，重新获取列表
        fetchPosts()
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        // 本地移除被删除的帖子，避免整表重刷
        setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
        // 本地更新被修改的帖子（保留 profiles 作者信息）
        setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchPosts])

  const handleDeletePost = useCallback((postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }, [])

  const handlePinChange = useCallback((postId, isPinned) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, is_pinned: isPinned } : post
    ))
  }, [])

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-(--color-text-tertiary)">加载中...</p>
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
            <h1 className="text-4xl font-bold heading-gradient mb-2">
              最新帖子
            </h1>
            <p className="text-(--color-text-tertiary)">发现精彩内容，参与讨论</p>
            <div className="mt-4 flex items-center justify-center space-x-5">
              {isSuperAdmin && (
                <button
                  onClick={() => setShowAnnouncementAdmin(true)}
                  className="inline-flex items-center space-x-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                  title="管理更新公告"
                >
                  <Megaphone size={16} />
                  <span>管理公告</span>
                </button>
              )}
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="empty-state-icon mb-4"><FileText size={28} /></div>
              <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">还没有帖子</h3>
              <p className="text-(--color-text-tertiary) mb-6">快来发第一个帖子吧！</p>
              <Link
                to="/create"
                className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate inline-flex items-center"
              >
                <PenLine size={18} className="mr-1.5" /> 发帖
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div key={post.id} style={{ animationDelay: `${Math.min(index, 10) * 0.03}s` }}>
                  <PostCard
                    post={post}
                    onDelete={handleDeletePost}
                    onPinChange={handlePinChange}
                    isAdmin={isAdmin}
                    currentUserId={user?.id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 管理员管理公告弹窗 */}
      {showAnnouncementAdmin && (
        <SiteAnnouncementAdmin onClose={() => setShowAnnouncementAdmin(false)} />
      )}
    </div>
  )
}
