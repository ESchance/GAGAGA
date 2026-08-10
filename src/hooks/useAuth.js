import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { checkIsAdmin, checkIsSuperAdmin } from '../lib/admin'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        checkIsAdmin(session.user.id).then(setIsAdmin)
        checkIsSuperAdmin(session.user.id).then(setIsSuperAdmin)
      }
      setLoading(false)
    })

    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
          const adminStatus = await checkIsAdmin(session.user.id)
          const superAdminStatus = await checkIsSuperAdmin(session.user.id)
          setIsAdmin(adminStatus)
          setIsSuperAdmin(superAdminStatus)
        } else {
          setProfile(null)
          setIsAdmin(false)
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
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  return {
    user,
    profile,
    isAdmin,
    isSuperAdmin,
    loading,
    refreshProfile
  }
}
