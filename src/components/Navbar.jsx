import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import Avatar from './Avatar'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
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
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            噶宇宙
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/create"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  发帖
                </Link>
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <Avatar
                    url={profile?.avatar_url}
                    username={profile?.username}
                    size="sm"
                  />
                  <span className="hidden sm:inline">{profile?.username || '我的主页'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
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
