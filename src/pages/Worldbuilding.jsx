import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getWorldbuildingList } from '../lib/worldbuilding'
import Avatar from '../components/Avatar'
import { GalaxyIcon, BookIcon, MaskIcon, GlobeIcon, LightbulbIcon, StarIcon } from '../components/Icons'
import { RaceAvatar } from '../components/RaceBadge'
import { TYPE_COLORS } from '../lib/typeVisuals'
import { PenLine, Heart, MessageCircle, FileText } from 'lucide-react'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const TYPE_FILTERS = [
  { key: null, label: '全部', Icon: GalaxyIcon },
  { key: 'story', label: '故事', Icon: BookIcon },
  { key: 'character', label: '角色', Icon: MaskIcon },
  { key: 'setting', label: '设定', Icon: GlobeIcon },
  { key: 'idea', label: '点子', Icon: LightbulbIcon }
]

export default function Worldbuilding() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const data = await getWorldbuildingList(activeFilter)
    setPosts(data)
    setLoading(false)
  }, [activeFilter])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    fetchPosts()
  }, [activeFilter, fetchPosts])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    return date.toLocaleDateString('zh-CN')
  }

  const getTypeIcon = (type, className = "w-5 h-5") => {
    const icons = {
      story: <BookIcon className={className} />,
      character: <MaskIcon className={className} />,
      setting: <GlobeIcon className={className} />,
      idea: <LightbulbIcon className={className} />
    }
    return icons[type] || <StarIcon className={className} />
  }

  const getTypeName = (type) => {
    const names = {
      story: '故事',
      character: '角色',
      setting: '设定',
      idea: '点子'
    }
    return names[type] || '创作'
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <GalaxyIcon className="w-8 h-8 text-[var(--color-primary)]" />
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
              嘎宇宙创作
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">在这里创作属于你的嘎宇宙故事</p>
        </div>

        {/* 类型筛选 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key || 'all'}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeFilter === filter.key
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              <filter.Icon className="w-4 h-4" />
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* 创作按钮 */}
        {user && (
          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <Link
              to="/worldbuilding/create"
              className="btn btn-primary"
            >
              <PenLine size={16} className="mr-1.5" /> 开始创作
            </Link>
          </div>
        )}

        {/* 创作列表 */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="post-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-2/3 mb-2" />
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
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title="还没有创作"
            description="星域的记录还是一片空白，写下第一篇吧"
          >
            {user && (
              <Link
                to="/worldbuilding/create"
                className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate inline-flex items-center"
              >
                <PenLine size={16} className="mr-1.5" /> 开始创作
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="post-card card-hover animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/worldbuilding/${post.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div style={{ color: TYPE_COLORS[post.type] || 'var(--color-primary)' }}>{getTypeIcon(post.type, "w-5 h-5")}</div>
                    <span className="text-xs bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-full" style={{ color: TYPE_COLORS[post.type] || 'var(--color-text-secondary)' }}>
                      {getTypeName(post.type)}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-tertiary)]">{formatDate(post.created_at)}</span>
                </div>

                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 hover:text-[var(--color-primary)] transition-colors">
                  {post.title}
                </h3>

                <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      url={post.profiles?.avatar_url}
                      username={post.profiles?.username}
                      size="sm"
                      role={post.profiles?.role}
                      race={post.profiles?.race}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {post.profiles?.username || '匿名用户'}
                        </span>
                        {post.profiles?.role === 'admin' && (
                          <span className="text-xs bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-0.5 rounded-full font-medium">
                            管理员
                          </span>
                        )}
                      </div>
                     {post.profiles?.member_code && (
                       <div className="flex items-center space-x-2 text-xs text-[var(--color-text-tertiary)]">
                          <RaceAvatar
                            race={post.profiles?.race}
                            size="sm"
                            fallbackClassName="w-4 h-4"
                            style={{ filter: `drop-shadow(0 0 4px rgba(255,255,255,0.25))` }}
                          />
                          <span className="member-code">{post.profiles.member_code}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center space-x-1 text-[var(--color-text-tertiary)]">
                      <Heart size={14} />
                      <span>{post.likes_count || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-[var(--color-text-tertiary)]">
                      <MessageCircle size={14} />
                      <span>{post.comments_count || 0}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
