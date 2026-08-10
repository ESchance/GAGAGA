export default function Avatar({ url, username, size = 'md' }) {
  // 根据尺寸设置样式
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-32 h-32 text-4xl'
  }

  // 获取用户名首字母
  const getInitial = () => {
    if (username) {
      return username.charAt(0).toUpperCase()
    }
    return '?'
  }

  // 根据用户名生成随机颜色
  const getColor = () => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500'
    ]

    if (!username) return colors[0]

    // 根据用户名生成确定的颜色
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}>
      {url ? (
        <img
          src={url}
          alt={`${username}的头像`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={`w-full h-full ${getColor()} flex items-center justify-center text-white font-bold`}>
          {getInitial()}
        </div>
      )}
    </div>
  )
}
