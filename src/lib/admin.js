import { supabase } from './supabase'

// 检查用户是否是管理员（admin 或 superadmin）
export const checkIsAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.role === 'admin' || data?.role === 'superadmin'
  } catch {
    return false
  }
}

// 检查用户是否是超级管理员
export const checkIsSuperAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.role === 'superadmin'
  } catch {
    return false
  }
}

// 获取用户角色
export const getUserRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.role || 'user'
  } catch {
    return 'user'
  }
}

// 获取用户列表（仅超级管理员可用）
export const getUsersList = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url, race, member_code, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

// 赋予/撤销管理员身份（仅超级管理员可用）
export const toggleAdmin = async (userId, currentRole) => {
  try {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error
    return { success: true, newRole }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 删除用户（仅超级管理员可用）
// 检查清单：
// 1. SQL 函数 delete_user 必须按正确顺序删除外键关联数据
// 2. RLS 策略必须允许超级管理员删除 profiles
// 3. 前端调用 RPC 必须正确传递参数
export const deleteUser = async (userId) => {
  try {
    // 关联数据、profiles 和 auth.users 统一交给 SQL 函数 delete_user 删除；
    // 该函数为 SECURITY DEFINER，并在内部校验调用者必须是超级管理员。
    const { data, error } = await supabase.rpc('delete_user', {
      target_user_id: userId
    })

    if (error) throw error
    if (data === false) throw new Error('删除失败：SQL 函数执行失败')

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 置顶/取消置顶帖子
export const togglePinPost = async (postId, isPinned) => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ is_pinned: !isPinned })
      .eq('id', postId)

    if (error) throw error
    return true
  } catch {
    return false
  }
}

// 删除帖子（作者或管理员均可调用，最终权限由 RLS 控制）
export const deletePost = async (postId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error
    return true
  } catch {
    return false
  }
}

// 删除评论（作者或管理员均可调用，最终权限由 RLS 控制）
export const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    return true
  } catch {
    return false
  }
}
