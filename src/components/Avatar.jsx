import { memo, useMemo } from 'react'
import { Crown } from 'lucide-react'

// 常量移到组件外部
const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-lg',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-32 h-32 text-4xl'
}

const BADGE_SIZES = {
  sm: 'w-4 h-4 text-xs',
  md: 'w-5 h-5 text-xs',
  lg: 'w-6 h-6 text-sm',
  xl: 'w-8 h-8 text-base'
}

const GRADIENTS = [
  'from-blue-500 to-purple-500',
  'from-green-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-pink-500 to-red-500',
  'from-indigo-500 to-blue-500',
  'from-yellow-500 to-orange-500',
  'from-red-500 to-pink-500',
  'from-teal-500 to-cyan-500'
]

// 根据用户名生成渐变颜色（纯函数）
const getGradient = (username) => {
  if (!username) return GRADIENTS[0]

  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % GRADIENTS.length
  return GRADIENTS[index]
}

const Avatar = memo(function Avatar({ url, username, size = 'md', role = 'user' }) {
  // 使用 useMemo 缓存计算结果
  const gradient = useMemo(() => getGradient(username), [username])
  const initial = useMemo(() => username?.charAt(0).toUpperCase() || '?', [username])

  return (
    <div className="relative inline-block">
      <div className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden flex-shrink-0 shadow-lg`}>
        {url ? (
          <img
            src={url}
            alt={`${username}的头像`}
            className="w-full h-full object-cover"
            loading="lazy"  // 懒加载
            decoding="async"  // 异步解码
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-inner`}>
            {initial}
          </div>
        )}
      </div>

      {/* 管理员徽章 */}
      {role === 'admin' && (
        <div className={`absolute -bottom-1 -right-1 ${BADGE_SIZES[size]} admin-badge rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
          <Crown className="w-3/5 h-3/5" />
        </div>
      )}
    </div>
  )
})

export default Avatar
