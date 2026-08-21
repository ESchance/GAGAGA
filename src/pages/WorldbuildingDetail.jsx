import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getWorldbuildingDetail,
  getWorldbuildingComments,
  addWorldbuildingComment,
  toggleLike,
  checkLiked,
  deleteWorldbuilding,
  RACES
} from '../lib/worldbuilding'
import { useAuth } from '../hooks/useAuth'
import { validateComment } from '../lib/validation'
import { useToast } from '../components/Toast'
import Avatar from '../components/Avatar'
import { BookIcon, MaskIcon, GlobeIcon, LightbulbIcon } from '../components/Icons'
import { RaceAvatar } from '../components/RaceBadge'
import { TYPE_COLORS } from '../lib/typeVisuals'
import { Heart, MessageCircle, PenLine, Trash2, LogIn, AlertTriangle, Send, MessageSquare, Inbox, FileText } from 'lucide-react'
import Skeleton from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function WorldbuildingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, profile: userProfile, isAdmin } = useAuth()
  const [liked, setLiked] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchPost = useCallback(async () => {
    const data = await getWorldbuildingDetail(id)
    setPost(data)
    setLoading(false)
  }, [id])

  const fetchComments = useCallback(async () => {
    const data = await getWorldbuildingComments(id)
    setComments(data)
  }, [id])

  useEffect(() => {
    if (user) {
      checkLiked(user.id, id).then(setLiked)
    }

    fetchPost()
    fetchComments()
  }, [id, user, fetchPost, fetchComments])

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
      story: BookIcon,
      character: MaskIcon,
      setting: GlobeIcon,
      idea: LightbulbIcon
    }
    const Icon = icons[type] || FileText
    return <Icon className="w-7 h-7" style={{ color: TYPE_COLORS[type] || 'var(--color-primary)' }} />
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
      <div className="page-container py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass-effect p-8 rounded-2xl shadow-lg mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 mb-6" />
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-(--color-border)">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-11/12 mb-3" />
            <Skeleton className="h-4 w-4/5 mb-3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-40 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
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
            className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors"
          >
            ← 返回创作列表
          </button>
          <EmptyState
            icon={<Inbox size={28} />}
            title="星域档案不存在"
            description="这份档案可能已被撤销或删除"
          />
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
          className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors"
        >
          ← 返回创作列表
        </button>

        {/* 文章内容 */}
        <div className="glass-effect p-8 rounded-2xl shadow-lg mb-6 animate-fade-in-up">
          {/* 类型标签 */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">{getTypeIcon(post.type)}</span>
            <span className="text-sm bg-(--color-bg-tertiary) px-3 py-1 rounded-full" style={{ color: TYPE_COLORS[post.type] || 'var(--color-text-tertiary)' }}>
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
              race={post.profiles?.race}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-(--color-text-primary)">{post.profiles?.username || '匿名用户'}</span>
                {post.profiles?.role === 'admin' && (
                  <span className="text-xs admin-badge px-2 py-0.5 rounded-full font-medium">
                    管理员
                  </span>
                )}
              </div>
             {post.profiles?.member_code && (
               <div className="flex items-center space-x-2 text-xs text-(--color-text-tertiary)">
                  <RaceAvatar
                    race={post.profiles?.race}
                    size="sm"
                    fallbackClassName="w-3.5 h-3.5"
                    style={{ filter: `drop-shadow(0 0 5px rgba(255,255,255,0.3))` }}
                  />
                  <span className="member-code">{post.profiles.member_code}</span>
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
                    ? 'bg-(--color-error)/10 text-(--color-error)'
                    : 'text-(--color-text-tertiary) hover:bg-(--color-bg-tertiary)'
                }`}
              >
                <Heart size={18} className={liked ? 'fill-current' : ''} />
                <span>{post.likes_count || 0}</span>
              </button>

              <div className="flex items-center space-x-2 text-(--color-text-tertiary)">
                <MessageCircle size={18} />
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
                    className="px-4 py-2 text-[var(--color-secondary)] hover:text-white hover:bg-[var(--color-secondary)] rounded-full transition-all duration-200 text-sm font-medium inline-flex items-center gap-1.5"
                  >
                    <PenLine size={16} /> 编辑
                  </button>
                )}
                {/* 作者和管理员都可以删除 */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-(--color-error) hover:text-white hover:bg-(--color-error) rounded-full transition-all duration-200 text-sm font-medium inline-flex items-center gap-1.5"
                >
                  <Trash2 size={16} /> 删除
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 评论区 */}
        <div className="glass-effect p-6 rounded-2xl shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xl font-bold text-(--color-text-primary) mb-6 flex items-center gap-2">
            <MessageCircle size={20} /> 评论 ({comments.length})
          </h3>

          {/* 评论输入框 */}
          {!user ? (
            <div className="mb-6 p-6 bg-gradient-to-r from-(--color-bg-secondary) to-(--color-bg-tertiary) rounded-xl text-center">
              <p className="text-(--color-text-secondary) mb-3">请先登录后再发表评论</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate inline-flex items-center"
              >
                <LogIn size={16} className="mr-1.5" /> 登录
              </button>
            </div>
          ) : !userProfile?.race_selected ? (
            <div className="mb-6 p-4 bg-(--color-warning)/10 border border-(--color-warning)/30 rounded-xl text-center">
              <p className="text-(--color-warning) text-sm">
                <AlertTriangle size={16} className="mr-1.5" /> 你还没有选择种族，无法发表评论。
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
                className="w-full px-4 py-3 border-2 border-(--color-border) rounded-xl focus:border-[var(--color-primary)] focus:outline-none resize-none"
                placeholder="写下你的评论..."
                required
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate disabled:opacity-50 inline-flex items-center"
                >
                  {submitting ? '正在发射…' : (<><Send size={16} className="mr-1.5" /> 发表评论</>)}
                </button>
              </div>
            </form>
          )}

          {/* 评论列表 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={48} className="mx-auto mb-3 text-(--color-text-tertiary)" />
                <p className="text-(--color-text-tertiary)">还没有回波，发出第一条回波吧</p>
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
                      race={comment.profiles?.race}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-(--color-text-primary)">
                          {comment.profiles?.username || '匿名用户'}
                        </span>
                       {comment.profiles?.member_code && (
                         <span className="text-xs text-(--color-text-tertiary) inline-flex items-center space-x-1">
                            <RaceAvatar
                              race={comment.profiles?.race}
                              size="sm"
                              fallbackClassName="w-3.5 h-3.5"
                              style={{ filter: `drop-shadow(0 0 5px rgba(255,255,255,0.3))` }}
                            />
                           <span className="member-code">{comment.profiles.member_code}</span>
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
                <AlertTriangle size={56} className="mx-auto mb-4 text-(--color-warning)" />
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
                  className="flex-1 px-6 py-3 bg-(--color-error) text-white rounded-xl font-medium hover:bg-(--color-error-hover) transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  {deleting ? '删除中...' : (<><Trash2 size={16} /> 确认删除</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
