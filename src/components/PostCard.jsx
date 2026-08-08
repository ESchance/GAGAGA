import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  // 格式化时间
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <Link to={`/post/${post.id}`} className="block">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {post.content}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{post.profiles?.username || '匿名用户'}</span>
          <span>{formatDate(post.created_at)}</span>
        </div>
      </Link>
    </div>
  )
}
