import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkIsSuperAdmin } from '../lib/admin'
import { useEffect, useState, useCallback } from 'react'
import Avatar from './Avatar'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        checkIsSuperAdmin(session.user.id).then(setIsSuperAdmin)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
          const superAdminStatus = await checkIsSuperAdmin(session.user.id)
          setIsSuperAdmin(superAdminStatus)
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

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setMobileMenuOpen(false)
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }, [navigate])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  return (
    <nav className="navbar sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚀 嘎宇宙
          </Link>

          {/* PC端导航 */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/worldbuilding"
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded-full transition-all duration-200 font-medium text-sm"
                >
                  🌌 创作
                </Link>
                <Link
                  to="/create"
                  className="btn-gradient text-white px-4 py-2 rounded-full font-medium text-sm btn-animate"
                >
                  ✏️ 发帖
                </Link>
                {isSuperAdmin && (
                  <Link
                    to="/admin/users"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-full transition-all duration-200 font-medium text-sm"
                  >
                    👥 用户管理
                  </Link>
                )}
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Avatar url={profile?.avatar_url} username={profile?.username} size="sm" />
                  <span className="text-gray-700 font-medium text-sm">{profile?.username || '我的主页'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 text-sm"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 font-medium text-sm">
                  登录
                </Link>
                <Link to="/register" className="btn-gradient text-white px-4 py-2 rounded-full font-medium text-sm btn-animate">
                  注册
                </Link>
              </>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="菜单"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-gray-200 pt-3 animate-fade-in-up">
            {user ? (
              <div className="space-y-2">
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Avatar url={profile?.avatar_url} username={profile?.username} size="sm" />
                  <span className="text-gray-700 font-medium">{profile?.username || '我的主页'}</span>
                </Link>
                <Link
                  to="/worldbuilding"
                  className="block px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🌌 嘎宇宙创作
                </Link>
                <Link
                  to="/create"
                  className="block px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ✏️ 发帖
                </Link>
                {isSuperAdmin && (
                  <Link
                    to="/admin/users"
                    className="block px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    👥 用户管理
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
