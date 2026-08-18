import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkIsSuperAdmin } from '../lib/admin'
import { useEffect, useState, useCallback } from 'react'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'

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
        <div className="flex justify-between items-center h-14">
          {/* Logo - 更简洁 */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-xs">嘎</span>
            </div>
            <span className="text-base font-semibold text-[var(--color-text-primary)] hidden sm:block">
              嘎宇宙
            </span>
          </Link>

          {/* PC端导航 - 更简洁 */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <NavLink
                  to="/worldbuilding"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md transition-all duration-150 text-sm ${
                      isActive
                        ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`
                  }
                >
                  创作
                </NavLink>
                <Link
                  to="/create"
                  className="btn btn-primary btn-sm"
                >
                  发帖
                </Link>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md transition-all duration-150 text-sm ${
                      isActive
                        ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`
                  }
                >
                  {isSuperAdmin ? '管理' : '住户'}
                </NavLink>
                <div className="w-px h-4 bg-[var(--color-border)] mx-2"></div>
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors duration-150"
                >
                  <Avatar url={profile?.avatar_url} username={profile?.username} size="sm" />
                  <span className="text-[var(--color-text-primary)] text-sm">{profile?.username}</span>
                </Link>
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] rounded-md transition-all duration-150 text-sm"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
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
          <div className="md:hidden py-3 border-t border-[var(--color-border)] animate-fade-in">
            {user ? (
              <div className="space-y-1">
                <Link
                  to={`/profile/${user.id}`}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Avatar url={profile?.avatar_url} username={profile?.username} size="sm" />
                  <span className="text-[var(--color-text-primary)] text-sm">{profile?.username}</span>
                </Link>
                <NavLink
                  to="/worldbuilding"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md transition-colors text-sm ${
                      isActive
                        ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  创作
                </NavLink>
                <Link
                  to="/create"
                  className="block px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  发帖
                </Link>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md transition-colors text-sm ${
                      isActive
                        ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isSuperAdmin ? '管理' : '住户'}
                </NavLink>
                <div className="border-t border-[var(--color-border)] my-1"></div>
                <div className="flex items-center px-3 py-2">
                  <ThemeToggle />
                  <span className="ml-2 text-sm text-[var(--color-text-secondary)]">切换主题</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-[var(--color-error)] hover:bg-(--color-error)/10 rounded-md transition-colors text-sm"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] rounded-md transition-colors text-sm font-medium"
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
