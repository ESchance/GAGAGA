import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getWorldbuildingList, RACES } from '../lib/worldbuilding'
import Avatar from '../components/Avatar'
import { GalaxyIcon, BookIcon, MaskIcon, GlobeIcon, LightbulbIcon, StarIcon } from '../components/Icons'

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    fetchPosts()
  }, [activeFilter])

  const fetchPosts = async () => {
    setLoading(true)
    const data = await getWorldbuildingList(activeFilter)
    setPosts(data)
    setLoading(false)
  }

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
            <GalaxyIcon className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              嘎宇宙创作
            </h1>
          </div>
          <p className="text-gray-500">在这里创作属于你的嘎宇宙故事</p>
        </div>

        {/* 类型筛选 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key || 'all'}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === filter.key
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
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
            <a
              href="/worldbuilding/create"
              className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate inline-block"
            >
              ✏️ 开始创作
            </a>
          </div>
        )}

        {/* 创作列表 */}
        {loading ? (
          <div className="text-center py-16">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">还没有创作</h3>
            <p className="text-gray-500">成为第一个创作者吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="glass-effect p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => window.location.href = `/worldbuilding/${post.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-purple-600">{getTypeIcon(post.type, "w-6 h-6")}</div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {getTypeName(post.type)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-purple-600 transition-colors">
                  {post.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      url={post.profiles?.avatar_url}
                      username={post.profiles?.username}
                      size="sm"
                      role={post.profiles?.role}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          {post.profiles?.username || '匿名用户'}
                        </span>
                        {post.profiles?.role === 'admin' && (
                          <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                            管理员
                          </span>
                        )}
                      </div>
                      {post.profiles?.member_code && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{RACES[post.profiles?.race]?.icon || '🧑'}</span>
                          <span className="font-mono">{post.profiles.member_code}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span>{post.likes_count || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>💬</span>
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
