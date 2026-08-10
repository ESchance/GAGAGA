export default function Avatar({ url, username, size = 'md', role = 'user' }) {
  // 根据尺寸设置样式
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  }

  // 徽章尺寸
  const badgeSizes = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
    xl: 'w-8 h-8 text-base'
  }

  // 获取用户名首字母
  const getInitial = () => {
    if (username) {
      return username.charAt(0).toUpperCase()
    }
    return '?'
  }

  // 根据用户名生成渐变颜色
  const getGradient = () => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-pink-500 to-red-500',
      'from-indigo-500 to-blue-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-teal-500 to-cyan-500'
    ]

    if (!username) return gradients[0]

    // 根据用户名生成确定的渐变
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % gradients.length
    return gradients[index]
  }

  return (
    <div className="relative inline-block">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 shadow-lg`}>
        {url ? (
          <img
            src={url}
            alt={`${username}的头像`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white font-bold shadow-inner`}>
            {getInitial()}
          </div>
        )}
      </div>

      {/* 管理员徽章 */}
      {role === 'admin' && (
        <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
          👑
        </div>
      )}
    </div>
  )
}
