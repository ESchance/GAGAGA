import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import Avatar from '../components/Avatar'
import AvatarUpload from '../components/AvatarUpload'

export default function Profile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // 获取当前登录用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
    })

    fetchProfile()
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
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, avatar_url)')
        .eq('user_id', id)
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

  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile({ ...profile, avatar_url: newAvatarUrl })
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
                />
              )}
            </div>

            {/* 用户信息 */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {profile?.username || '匿名用户'}
              </h1>
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

        {/* 用户帖子列表 */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                  <PostCard post={post} onDelete={handleDeletePost} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
