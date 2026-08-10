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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const isOwnProfile = currentUser && currentUser.id === id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 用户信息 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* 头像 */}
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

            {/* 用户信息 */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {profile?.username || '匿名用户'}
              </h1>
              <p className="text-gray-500">
                发布了 {posts.length} 个帖子
              </p>
              {isOwnProfile && (
                <p className="text-sm text-blue-500 mt-2">
                  点击头像可以更换
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 用户帖子列表 */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">发布的帖子</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            还没有发布任何帖子
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
