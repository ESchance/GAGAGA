import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getWorldbuildingDetail,
  getWorldbuildingComments,
  addWorldbuildingComment,
  toggleLike,
  checkLiked,
  RACES
} from '../lib/worldbuilding'
import Avatar from '../components/Avatar'

export default function WorldbuildingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [liked, setLiked] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkLiked(session.user.id, id).then(setLiked)
      }
    })

    fetchPost()
    fetchComments()
  }, [id])

  const fetchPost = async () => {
    const data = await getWorldbuildingDetail(id)
    setPost(data)
    setLoading(false)
  }

  const fetchComments = async () => {
    const data = await getWorldbuildingComments(id)
    setComments(data)
  }

  const handleLike = async () => {
    if (!user) {
      alert('请先登录')
      return
    }

    const result = await toggleLike(user.id, id)
    if (result !== null) {
      setLiked(result)
      setPost(prev => ({
        ...prev,
        likes_count: prev.likes_count + (result ? 1 : -1)
      }))
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

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
          <p className="text-gray-500">加载中...</p>
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
            className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-6 transition-colors"
          >
            ← 返回创作列表
          </button>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">内容不存在</h3>
            <p className="text-gray-500">该内容可能已被删除</p>
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
          className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-6 transition-colors"
        >
          ← 返回创作列表
        </button>

        {/* 文章内容 */}
        <div className="glass-effect p-8 rounded-2xl shadow-lg mb-6 animate-fade-in-up">
          {/* 类型标签 */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">{getTypeIcon(post.type)}</span>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {getTypeName(post.type)}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-800 mb-6">{post.title}</h1>

          {/* 作者信息 */}
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
            <Avatar
              url={post.profiles?.avatar_url}
              username={post.profiles?.username}
              size="md"
              role={post.profiles?.role}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-800">{post.profiles?.username || '匿名用户'}</span>
                {post.profiles?.role === 'admin' && (
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                    管理员
                  </span>
                )}
              </div>
              {post.profiles?.member_code && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{RACES[post.profiles?.race]?.icon || '🧑'}</span>
                  <span className="font-mono">{post.profiles.member_code}</span>
                  <span>{RACES[post.profiles?.race]?.name || '人类'}</span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-400 ml-auto">{formatDate(post.created_at)}</span>
          </div>

          {/* 内容 */}
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg mb-6">
            {post.content}
          </div>

          {/* 操作栏 */}
          <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                liked
                  ? 'bg-red-50 text-red-500'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{post.likes_count || 0}</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-500">
              <span>💬</span>
              <span>{comments.length}</span>
            </div>
          </div>
        </div>

        {/* 评论区 */}
        <div className="glass-effect p-6 rounded-2xl shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            💬 评论 ({comments.length})
          </h3>

          {/* 评论输入框 */}
          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
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
          ) : (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl text-center">
              <p className="text-gray-600 mb-3">请先登录后再发表评论</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate"
              >
                👋 登录
              </button>
            </div>
          )}

          {/* 评论列表 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💭</div>
                <p className="text-gray-500">暂无评论，快来发表第一条评论吧！</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl animate-fade-in-up"
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
                        <span className="font-semibold text-gray-800">
                          {comment.profiles?.username || '匿名用户'}
                        </span>
                        {comment.profiles?.member_code && (
                          <span className="text-xs text-gray-500">
                            {RACES[comment.profiles?.race]?.icon || '🧑'} {comment.profiles.member_code}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
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
    </div>
  )
}
