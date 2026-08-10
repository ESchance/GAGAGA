import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUserWorldInfo, checkRaceSelected, updateCustomBackstory } from '../lib/worldbuilding'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'
import AvatarUpload from '../components/AvatarUpload'
import RaceSelector from '../components/RaceSelector'
import WorldInfo from '../components/WorldInfo'

export default function Profile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [worldInfo, setWorldInfo] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showRaceSelector, setShowRaceSelector] = useState(false)
  const [editingBackstory, setEditingBackstory] = useState(false)
  const [backstoryText, setBackstoryText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // 获取当前登录用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
    })

    fetchProfile()
    fetchWorldInfo()
    fetchUserPosts()
  }, [id])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setProfile(data)

      // 检查是否是自己的主页且未选择种族
      const session = await supabase.auth.getSession()
      if (session.data.session?.user?.id === id && !data.race_selected) {
        setShowRaceSelector(true)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const fetchWorldInfo = async () => {
    try {
      const info = await getUserWorldInfo(id)
      setWorldInfo(info)
    } catch (error) {
      console.error('获取世界观信息失败:', error)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url, role, race, member_code)')
        .eq('user_id', id)
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

  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }))
  }

  const handleRaceSelect = async (race) => {
    // 如果是跳过（race 为 null）
    if (race === null) {
      setShowRaceSelector(false)
      return
    }

    const { selectRace } = await import('../lib/worldbuilding')
    const result = await selectRace(currentUser.id, race)

    if (result.success) {
      setShowRaceSelector(false)
      // 重新获取数据
      await fetchProfile()
      await fetchWorldInfo()
    } else {
      alert('选择种族失败：' + result.error)
    }
  }

  const handleSaveBackstory = async () => {
    setSaving(true)
    const success = await updateCustomBackstory(id, backstoryText)
    setSaving(false)

    if (success) {
      setEditingBackstory(false)
      setProfile(prev => ({ ...prev, custom_backstory: backstoryText }))
    } else {
      alert('保存失败')
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

  const isOwnProfile = currentUser && currentUser.id === id

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 用户信息卡片 */}
        <div className="glass-effect p-8 rounded-2xl shadow-lg mb-8 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* 头像 */}
            <div className="relative">
              {isOwnProfile ? (
                <AvatarUpload
                  userId={id}
                  currentAvatarUrl={profile?.avatar_url}
                  onAvatarUpdate={handleAvatarUpdate}
                />
              ) : (
                <Avatar
                  url={profile?.avatar_url}
                  username={profile?.username}
                  size="xl"
                  role={profile?.role}
                />
              )}
            </div>

            {/* 用户信息 */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start space-x-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {profile?.username || '匿名用户'}
                </h1>
                {profile?.role === 'admin' && (
                  <span className="text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-medium">
                    👑 管理员
                  </span>
                )}
              </div>

              {/* 世界观信息 */}
              {worldInfo && (
                <div className="mb-4">
                  <div className="flex items-center justify-center sm:justify-start space-x-3 text-sm">
                    {worldInfo.member_code ? (
                      <>
                        <span className="font-mono text-purple-600 font-bold">{worldInfo.member_code}</span>
                        <span className="text-gray-600">
                          {worldInfo.raceInfo?.icon} {worldInfo.raceInfo?.name}
                        </span>
                        {worldInfo.title && (
                          <span className="text-yellow-600">· {worldInfo.title}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 italic">种族和编号待选择</span>
                    )}
                  </div>
                  {/* 自己的主页且未选择种族时，显示选择按钮 */}
                  {isOwnProfile && !worldInfo.member_code && (
                    <button
                      onClick={() => setShowRaceSelector(true)}
                      className="mt-2 text-sm text-blue-500 hover:text-blue-700 underline"
                    >
                      选择种族
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center sm:justify-start space-x-4 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                  📝 {posts.length} 个帖子
                </div>
              </div>

              {isOwnProfile && (
                <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                  <span className="mr-2">💡</span> 点击头像可以更换
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 世界观信息 */}
        {worldInfo && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <WorldInfo profile={worldInfo} showStory={true} />
          </div>
        )}

        {/* 自定义背景故事编辑 */}
        {isOwnProfile && worldInfo && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="mr-2">✍️</span> 我的故事
                  <span className="ml-2 text-xs text-gray-400 font-normal">（可编辑）</span>
                </h4>
                {!editingBackstory && (
                  <button
                    onClick={() => {
                      setBackstoryText(profile?.custom_backstory || '')
                      setEditingBackstory(true)
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    ✏️ 编辑
                  </button>
                )}
              </div>

              {editingBackstory ? (
                <div>
                  <textarea
                    value={backstoryText}
                    onChange={(e) => setBackstoryText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                    placeholder="在这里写下你的个人故事..."
                  />
                  <div className="flex justify-end space-x-3 mt-3">
                    <button
                      onClick={() => setEditingBackstory(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200 text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveBackstory}
                      disabled={saving}
                      className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '💾 保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white bg-opacity-60 rounded-xl p-4">
                  {profile?.custom_backstory ? (
                    <p className="text-gray-600 text-sm leading-relaxed">{profile.custom_backstory}</p>
                  ) : (
                    <p className="text-gray-400 text-sm text-center">还没有添加个人故事</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 数据统计 */}
        {worldInfo && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span className="mr-2">📊</span> 数据统计
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
                  <div className="text-xs text-gray-500">帖子</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{worldInfo.achievements?.length || 0}</div>
                  <div className="text-xs text-gray-500">成就</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {worldInfo.member_code ? worldInfo.member_code.replace('GZ-', '#') : '#0000'}
                  </div>
                  <div className="text-xs text-gray-500">编号</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户帖子列表 */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            📚 发布的帖子
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-12 glass-effect rounded-2xl">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">还没有帖子</h3>
              <p className="text-gray-500">去发布第一个帖子吧！</p>
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

      {/* 种族选择弹窗 */}
      {showRaceSelector && (
        <RaceSelector onSelect={handleRaceSelect} />
      )}
    </div>
  )
}
