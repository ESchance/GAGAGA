import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getWorldbuildingDetail,
  getWorldbuildingComments,
  addWorldbuildingComment,
  toggleLike,
  checkLiked,
  deleteWorldbuilding,
  RACES
} from '../lib/worldbuilding'
import { checkIsAdmin } from '../lib/admin'
import { validateComment } from '../lib/validation'
import { useToast } from '../components/Toast'
import Avatar from '../components/Avatar'

export default function WorldbuildingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [liked, setLiked] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkLiked(session.user.id, id).then(setLiked)
        checkIsAdmin(session.user.id).then(setIsAdmin)
        fetchUserProfile(session.user.id)
      }
    })

    fetchPost()
    fetchComments()
  }, [id, fetchPost, fetchComments, fetchUserProfile])

  const fetchPost = useCallback(async () => {
    const data = await getWorldbuildingDetail(id)
    setPost(data)
    setLoading(false)
  }, [id])

  const fetchComments = useCallback(async () => {
    const data = await getWorldbuildingComments(id)
    setComments(data)
  }, [id])

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, role, race_selected')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }, [])

  const handleLike = async () => {
    if (!user) {
      showToast('请先登录', 'info')
      return
    }

    const result = await toggleLike(user.id, id)
    if (result !== null) {
      setLiked(result.isLiked)
      // 乐观更新点赞数，避免整篇重新拉取
      setPost(prev => prev ? { ...prev, likes_count: result.count } : prev)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setDeleting(true)
    const success = await deleteWorldbuilding(id, user.id, isAdmin)
    setDeleting(false)

    if (success) {
      navigate('/worldbuilding')
    } else {
      showToast('删除失败，请重试', 'error')
    }
    setShowDeleteModal(false)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) return

    // 输入校验
    const commentCheck = validateComment(newComment)
    if (!commentCheck.valid) {
      showToast(commentCheck.message, 'error')
      return
    }

    setSubmitting(true)
    const result = await addWorldbuildingComment(user.id, id, newComment)
    setSubmitting(false)

    if (result) {
      setNewComment('')
      fetchComments()
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getTypeIcon = (type) => {
    const icons = {
      story: '📖',
      character: '🎭',
      setting: '🌍',
      idea: '💡'
    }
    return icons[type] || '📝'
  }

  const getTypeName = (type) => {
    const names = {
      story: '故事',
      character: '角色',
      setting: '设定',
      idea: '点子'
    }
    return names[type] || '创作'
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-(--color-text-tertiary)">加载中...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/worldbuilding')}
            className="inline-flex items-center text-(--color-text-secondary) hover:text-purple-600 mb-6 transition-colors"
          >
            ← 返回创作列表
          </button>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">内容不存在</h3>
            <p className="text-(--color-text-tertiary)">该内容可能已被删除</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/worldbuilding')}
          className="inline-flex items-center text-(--color-text-secondary) hover:text-purple-600 mb-6 transition-colors"
        >
          ← 返回创作列表
        </button>

        {/* 文章内容 */}
        <div className="glass-effect p-8 rounded-2xl shadow-lg mb-6 animate-fade-in-up">
          {/* 类型标签 */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">{getTypeIcon(post.type)}</span>
            <span className="text-sm text-(--color-text-tertiary) bg-(--color-bg-tertiary) px-3 py-1 rounded-full">
              {getTypeName(post.type)}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-bold text-(--color-text-primary) mb-6">{post.title}</h1>

          {/* 作者信息 */}
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-(--color-border)">
            <Avatar
              url={post.profiles?.avatar_url}
              username={post.profiles?.username}
              size="md"
              role={post.profiles?.role}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-(--color-text-primary)">{post.profiles?.username || '匿名用户'}</span>
                {post.profiles?.role === 'admin' && (
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                    管理员
                  </span>
                )}
              </div>
              {post.profiles?.member_code && (
                <div className="flex items-center space-x-2 text-xs text-(--color-text-tertiary)">
                  <span>{RACES[post.profiles?.race]?.icon || '🧑'}</span>
                  <span className="font-mono">{post.profiles.member_code}</span>
                  <span>{RACES[post.profiles?.race]?.name || '人类'}</span>
                </div>
              )}
            </div>
            <span className="text-sm text-(--color-text-tertiary) ml-auto">{formatDate(post.created_at)}</span>
          </div>

          {/* 内容 */}
          <div className="text-(--color-text-secondary) whitespace-pre-wrap leading-relaxed text-lg mb-6">
            {post.content}
          </div>

          {/* 操作栏 */}
          <div className="flex items-center justify-between pt-4 border-t border-(--color-border)">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  liked
                    ? 'bg-(--color-error)/10 text-red-500'
                    : 'text-(--color-text-tertiary) hover:bg-(--color-bg-tertiary)'
                }`}
              >
                <span>{liked ? '❤️' : '🤍'}</span>
                <span>{post.likes_count || 0}</span>
              </button>

              <div className="flex items-center space-x-2 text-(--color-text-tertiary)">
                <span>💬</span>
                <span>{comments.length}</span>
              </div>
            </div>

            {/* 作者操作按钮 */}
            {user && (user.id === post.user_id || isAdmin) && (
              <div className="flex items-center space-x-3">
                {/* 只有作者可以编辑 */}
                {user.id === post.user_id && (
                  <button
                    onClick={() => navigate(`/worldbuilding/${id}/edit`)}
                    className="px-4 py-2 text-purple-500 hover:text-white hover:bg-purple-500 rounded-full transition-all duration-200 text-sm font-medium"
                  >
                    ✏️ 编辑
                  </button>
                )}
                {/* 作者和管理员都可以删除 */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-red-500 hover:text-white hover:bg-(--color-error)/100 rounded-full transition-all duration-200 text-sm font-medium"
                >
                  🗑️ 删除
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 评论区 */}
        <div className="glass-effect p-6 rounded-2xl shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xl font-bold text-(--color-text-primary) mb-6">
            💬 评论 ({comments.length})
          </h3>

          {/* 评论输入框 */}
          {!user ? (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl text-center">
              <p className="text-(--color-text-secondary) mb-3">请先登录后再发表评论</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate"
              >
                👋 登录
              </button>
            </div>
          ) : !userProfile?.race_selected ? (
            <div className="mb-6 p-4 bg-(--color-warning)/10 border border-(--color-warning)/30 rounded-xl text-center">
              <p className="text-(--color-warning) text-sm">
                ⚠️ 你还没有选择种族，无法发表评论。
                <a href={`/profile/${user.id}`} className="ml-2 text-(--color-warning) underline">
                  去选择种族
                </a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-(--color-border) rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                placeholder="写下你的评论..."
                required
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate disabled:opacity-50"
                >
                  {submitting ? '发送中...' : '✨ 发表评论'}
                </button>
              </div>
            </form>
          )}

          {/* 评论列表 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💭</div>
                <p className="text-(--color-text-tertiary)">暂无评论，快来发表第一条评论吧！</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className="p-4 bg-gradient-to-r from-(--color-bg-secondary) to-(--color-bg-tertiary) rounded-xl animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <Avatar
                      url={comment.profiles?.avatar_url}
                      username={comment.profiles?.username}
                      size="md"
                      role={comment.profiles?.role}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-(--color-text-primary)">
                          {comment.profiles?.username || '匿名用户'}
                        </span>
                        {comment.profiles?.member_code && (
                          <span className="text-xs text-(--color-text-tertiary)">
                            {RACES[comment.profiles?.race]?.icon || '🧑'} {comment.profiles.member_code}
                          </span>
                        )}
                        <span className="text-xs text-(--color-text-tertiary)">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-(--color-text-secondary) whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-(--color-text-primary) mb-2">确认删除</h3>
                <p className="text-(--color-text-tertiary)">确定要删除这个创作吗？此操作不可撤销。</p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-tertiary) rounded-xl transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-(--color-error)/100 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
                >
                  {deleting ? '删除中...' : '🗑️ 确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
