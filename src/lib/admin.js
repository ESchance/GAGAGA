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
  } catch (error) {
    console.error('检查管理员身份失败:', error)
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
  } catch (error) {
    console.error('检查超级管理员身份失败:', error)
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
  } catch (error) {
    console.error('获取用户角色失败:', error)
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
  } catch (error) {
    console.error('获取用户列表失败:', error)
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
    console.error('切换管理员身份失败:', error)
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
    // 1. 删除所有关联数据（按外键依赖顺序）
    await supabase.from('worldbuilding_comments').delete().eq('user_id', userId)
    await supabase.from('worldbuilding_likes').delete().eq('user_id', userId)
    await supabase.from('worldbuilding').delete().eq('user_id', userId)
    await supabase.from('member_codes').delete().eq('user_id', userId)
    await supabase.from('comments').delete().eq('user_id', userId)
    await supabase.from('posts').delete().eq('user_id', userId)

    // 2. 调用 SQL 函数删除 profiles 和 auth.users
    const { data, error } = await supabase.rpc('delete_user', {
      target_user_id: userId
    })

    if (error) {
      console.error('❌ RPC 错误:', error)
      throw error
    }

    if (data === false) {
      console.error('❌ SQL 函数返回 false，可能存在外键约束问题')
      throw new Error('删除失败：SQL 函数执行失败')
    }

    return { success: true }
  } catch (error) {
    console.error('删除用户失败:', error)
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
  } catch (error) {
    console.error('置顶帖子失败:', error)
    return false
  }
}

// 管理员删除任意帖子
export const adminDeletePost = async (postId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('删除帖子失败:', error)
    return false
  }
}

// 管理员删除任意评论
export const adminDeleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('删除评论失败:', error)
    return false
  }
}
