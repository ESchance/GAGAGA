import { supabase } from './supabase'

// 检查用户是否是管理员
export const checkIsAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.role === 'admin'
  } catch (error) {
    console.error('检查管理员身份失败:', error)
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
