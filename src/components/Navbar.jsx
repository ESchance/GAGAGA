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
    <nav className="navbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">嘎</span>
            </div>
            <span className="text-lg font-semibold text-[var(--color-text-primary)] hidden sm:block">
              嘎宇宙
            </span>
          </Link>

          {/* PC端导航 */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Link
                  to="/worldbuilding"
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  🌌 创作
                </Link>
                <Link
                  to="/create"
                  className="btn-primary btn-sm"
                >
                  ✏️ 发帖
                </Link>
                <Link
                  to="/admin/users"
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  {isSuperAdmin ? '👥 管理' : '🏠 住户'}
                </Link>
                <div className="w-px h-6 bg-[var(--color-border)] mx-2"></div>
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors duration-200"
                >
                  <Avatar url={profile?.avatar_url} username={profile?.username} size="sm" />
                  <span className="text-[var(--color-text-primary)] font-medium text-sm">{profile?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-red-50 rounded-lg transition-all duration-200 text-sm"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium text-sm"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="btn-primary btn-sm"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            aria-label="菜单"
          >
            <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="md:hidden py-4 border-t border-[var(--color-border)] animate-fade-in-down">
            {user ? (
              <div className="space-y-1">
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Avatar url={profile?.avatar_url} username={profile?.username} size="sm" />
                  <span className="text-[var(--color-text-primary)] font-medium">{profile?.username}</span>
                </Link>
                <Link
                  to="/worldbuilding"
                  className="block px-3 py-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🌌 嘎宇宙创作
                </Link>
                <Link
                  to="/create"
                  className="block px-3 py-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ✏️ 发帖
                </Link>
                <Link
                  to="/admin/users"
                  className="block px-3 py-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isSuperAdmin ? '👥 用户管理' : '🏠 嘎宇宙住户'}
                </Link>
                <div className="border-t border-[var(--color-border)] my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-[var(--color-error)] hover:bg-red-50 rounded-lg transition-colors"
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2.5 text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-lg transition-colors font-medium"
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
