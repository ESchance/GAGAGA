import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkIsSuperAdmin } from '../lib/admin'
import { useEffect, useState } from 'react'
import Avatar from './Avatar'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        checkIsSuperAdmin(session.user.id).then(setIsSuperAdmin)
      }
    })

    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
          checkIsSuperAdmin(session.user.id).then(setIsSuperAdmin)
        } else {
          setProfile(null)
          setIsSuperAdmin(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      alert('退出失败，请重试')
    }
  }

  return (
    <nav className="navbar sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
            🚀 嘎宇宙
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/worldbuilding"
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded-full transition-all duration-200 font-medium text-sm hidden sm:inline-block"
                >
                  🌌 创作
                </Link>
                <Link
                  to="/create"
                  className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate"
                >
                  ✏️ 发帖
                </Link>
                {isSuperAdmin && (
                  <Link
                    to="/admin/users"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-full transition-all duration-200 font-medium text-sm hidden sm:inline-block"
                  >
                    👥 用户管理
                  </Link>
                )}
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Avatar
                    url={profile?.avatar_url}
                    username={profile?.username}
                    size="sm"
                  />
                  <span className="hidden sm:inline text-gray-700 font-medium">{profile?.username || '我的主页'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 font-medium"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
