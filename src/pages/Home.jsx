import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import PostCard from '../components/PostCard'
import AnnouncementBar from '../components/AnnouncementBar'
import SiteAnnouncementAdmin from '../components/SiteAnnouncementAdmin'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Megaphone, FileText, PenLine, Sparkles } from 'lucide-react'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pinned', label: '置顶' },
  { key: 'latest', label: '最新' }
]

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [showAnnouncementAdmin, setShowAnnouncementAdmin] = useState(false)
  const { user, isAdmin, isSuperAdmin } = useAuth()

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at, is_pinned, user_id, comments_count, profiles(username, avatar_url, role, race, member_code)')
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

  const filteredPosts = activeFilter === 'pinned'
    ? posts.filter(p => p.is_pinned)
    : activeFilter === 'latest'
      ? [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      : posts

  const emptyTitle = activeFilter === 'pinned' ? '暂无置顶帖子' : '还没有帖子'
  const emptyDescription = activeFilter === 'pinned' ? '管理员可以将重要帖子置顶' : '这片星域还很安静，发出第一个信号吧'

  if (loading) {
    return (
      <div className="page-container">
        <AnnouncementBar />

        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* 欢迎区骨架 */}
            <div className="text-center mb-8">
              <Skeleton className="h-8 w-56 mx-auto mb-3" />
              <Skeleton className="h-4 w-80 max-w-full mx-auto mb-6" />
              <div className="flex items-center justify-center gap-3">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </div>

            {/* 帖子列表骨架 */}
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="post-card">
                  <Skeleton className="h-5 w-2/3 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          {/* 欢迎区 */}
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-bold heading-gradient mb-3">
              欢迎来到嘎宇宙
            </h1>
            <p className="text-(--color-text-tertiary) mb-7">发现精彩内容，参与讨论，创作属于你的宇宙故事</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/create"
                className="btn btn-primary btn-lg"
              >
                <PenLine size={18} className="mr-1.5" /> 发帖
              </Link>
              <Link
                to="/worldbuilding"
                className="btn btn-secondary btn-lg"
              >
                <Sparkles size={18} className="mr-1.5" /> 去创作
              </Link>
            </div>
          </div>

          {/* 帖子区块标题 + 筛选 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-(--color-text-primary)">最新帖子</h2>
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <button
                  onClick={() => setShowAnnouncementAdmin(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                  title="管理更新公告"
                >
                  <Megaphone size={16} />
                  <span>管理公告</span>
                </button>
              )}
              <div className="flex items-center gap-1 bg-(--color-bg-tertiary) rounded-full p-1">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`filter-tab ${activeFilter === filter.key ? 'filter-tab-active' : ''}`}
                    aria-pressed={activeFilter === filter.key}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} />}
              title={emptyTitle}
              description={emptyDescription}
            >
              {activeFilter !== 'pinned' && (
                <Link
                  to="/create"
                  className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate inline-flex items-center"
                >
                  <PenLine size={18} className="mr-1.5" /> 发帖
                </Link>
              )}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, index) => (
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
