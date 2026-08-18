import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkIsAdmin } from '../lib/admin'
import { getUserWorldInfo, updateCustomBackstory } from '../lib/worldbuilding'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'
import AvatarUpload from '../components/AvatarUpload'
import RaceSelector from '../components/RaceSelector'
import WorldInfo from '../components/WorldInfo'
import { useToast } from '../components/Toast'
import { Crown, FileText, PenLine, Save, BarChart3, Lightbulb } from 'lucide-react'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [profile, setProfile] = useState(null)
  const [worldInfo, setWorldInfo] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showRaceSelector, setShowRaceSelector] = useState(false)
  const [editingBackstory, setEditingBackstory] = useState(false)
  const [backstoryText, setBackstoryText] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchProfile = useCallback(async () => {
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
  }, [id])

  const fetchWorldInfo = useCallback(async () => {
    try {
      const info = await getUserWorldInfo(id)
      setWorldInfo(info)
    } catch (error) {
      console.error('获取世界观信息失败:', error)
    }
  }, [id])

  const fetchUserPosts = useCallback(async () => {
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
  }, [id])

  useEffect(() => {
    // 获取当前登录用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin)
      }
    })

    fetchProfile()
    fetchWorldInfo()
    fetchUserPosts()
  }, [id, fetchProfile, fetchWorldInfo, fetchUserPosts])

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
      // 跳转到首页
      navigate('/')
      return
    }

    const { selectRace } = await import('../lib/worldbuilding')
    const result = await selectRace(currentUser.id, race)

    if (result.success) {
      setShowRaceSelector(false)
      // 跳转到首页
      navigate('/')
    } else {
      showToast('选择种族失败：' + result.error, 'error')
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
      showToast('保存失败', 'error')
    }
  }

  if (loading) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* 用户信息卡骨架 */}
          <div className="glass-effect p-8 rounded-2xl shadow-lg mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1 text-center sm:text-left space-y-3">
                <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-64 max-w-full mx-auto sm:mx-0" />
                <Skeleton className="h-8 w-24 mx-auto sm:mx-0 rounded-full" />
              </div>
            </div>
          </div>

          {/* 帖子列表骨架 */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="post-card">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
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
                <h1 className="text-3xl font-bold heading-gradient">
                  {profile?.username || '匿名用户'}
                </h1>
                {profile?.role === 'admin' && (
                  <span className="text-sm admin-badge px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                    <Crown size={14} /> 管理员
                  </span>
                )}
              </div>

              {/* 世界观信息 */}
              {worldInfo && (
                <div className="mb-4">
                  <div className="flex items-center justify-center sm:justify-start space-x-3 text-sm">
                    {worldInfo.member_code ? (
                      <>
                        <span className="font-mono text-[var(--color-secondary)] font-bold">{worldInfo.member_code}</span>
                        <span className="text-(--color-text-secondary)">
                          {worldInfo.raceInfo?.icon} {worldInfo.raceInfo?.name}
                        </span>
                        {worldInfo.title && (
                          <span className="text-(--color-warning)">· {worldInfo.title}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-(--color-text-tertiary) italic">种族和编号待选择</span>
                    )}
                  </div>
                  {/* 自己的主页且未选择种族时，显示选择按钮 */}
                  {isOwnProfile && !worldInfo.member_code && (
                    <button
                      onClick={() => setShowRaceSelector(true)}
                      className="mt-2 text-sm text-[var(--color-info)] hover:text-[var(--color-primary)] underline"
                    >
                      选择种族
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center sm:justify-start space-x-4 mb-4">
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5">
                  <FileText size={14} /> {posts.length} 个帖子
                </div>
              </div>

              {isOwnProfile && (
                <p className="text-sm text-(--color-text-tertiary) flex items-center justify-center sm:justify-start">
                  <Lightbulb size={14} className="mr-1.5" /> 点击头像可以更换
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
            <div className="bg-(--color-success)/10 rounded-2xl p-4 border border-(--color-success)/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-(--color-text-secondary) flex items-center">
                  <PenLine size={16} className="mr-2" /> 我的故事
                  <span className="ml-2 text-xs text-(--color-text-tertiary) font-normal">（可编辑）</span>
                </h4>
                {!editingBackstory && (
                  <button
                    onClick={() => {
                      setBackstoryText(profile?.custom_backstory || '')
                      setEditingBackstory(true)
                    }}
                    className="text-xs text-[var(--color-info)] hover:text-[var(--color-primary)] inline-flex items-center gap-1"
                  >
                    <PenLine size={14} /> 编辑
                  </button>
                )}
              </div>

              {editingBackstory ? (
                <div>
                  <textarea
                    value={backstoryText}
                    onChange={(e) => setBackstoryText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-(--color-success)/30 rounded-xl focus:border-[var(--color-primary)] focus:outline-none resize-none"
                    placeholder="在这里写下你的个人故事..."
                  />
                  <div className="flex justify-end space-x-3 mt-3">
                    <button
                      onClick={() => setEditingBackstory(false)}
                      className="px-4 py-2 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-tertiary) rounded-full transition-all duration-200 text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveBackstory}
                      disabled={saving}
                      className="px-4 py-2 bg-(--color-success) text-white rounded-full text-sm font-medium hover:bg-(--color-success-hover) transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {saving ? '保存中...' : (<><Save size={16} /> 保存</>)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-(--color-surface) bg-opacity-60 rounded-xl p-4">
                  {profile?.custom_backstory ? (
                    <p className="text-(--color-text-secondary) text-sm leading-relaxed">{profile.custom_backstory}</p>
                  ) : (
                    <p className="text-(--color-text-tertiary) text-sm text-center">还没有添加个人故事</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 数据统计 */}
        {worldInfo && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] rounded-2xl p-4 border border-[var(--color-border)]">
              <h4 className="text-sm font-semibold text-(--color-text-secondary) mb-3 flex items-center">
                <BarChart3 size={16} className="mr-2" /> 数据统计
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[var(--color-info)]">{posts.length}</div>
                  <div className="text-xs text-(--color-text-tertiary)">帖子</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-(--color-success)">{worldInfo.achievements?.length || 0}</div>
                  <div className="text-xs text-(--color-text-tertiary)">成就</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-secondary)]">
                    {worldInfo.member_code ? worldInfo.member_code.replace('GZ-', '#') : '#0000'}
                  </div>
                  <div className="text-xs text-(--color-text-tertiary)">编号</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户帖子列表 */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold heading-gradient mb-6">
            发布的帖子
          </h2>

          {posts.length === 0 ? (
            <div className="glass-effect rounded-2xl">
              <EmptyState
                icon={<FileText size={28} />}
                title="还没有帖子"
                description="去发布第一个帖子吧！"
                className="py-10"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div key={post.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <PostCard
                    post={post}
                    onDelete={handleDeletePost}
                    onPinChange={handlePinChange}
                    isAdmin={isAdmin}
                    currentUserId={currentUser?.id}
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
