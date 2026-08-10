import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AvatarUpload({ userId, currentAvatarUrl, onAvatarUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setAvatarUrl(currentAvatarUrl)
  }, [currentAvatarUrl])

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)
      setMessage('')

      const file = event.target.files[0]
      if (!file) return

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传图片文件')
      }

      // 检查文件大小（最大 2MB）
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('图片大小不能超过 2MB')
      }

      // 生成文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // 上传文件
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 获取公开 URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const newAvatarUrl = data.publicUrl

      // 更新用户资料
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(newAvatarUrl)
      setMessage('头像更新成功！')

      // 通知父组件
      if (onAvatarUpdate) {
        onAvatarUpdate(newAvatarUrl)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* 头像显示 */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="头像"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
              👤
            </div>
          )}
        </div>

        {/* 上传按钮覆盖层 */}
        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <span className="text-white text-sm font-medium">
            {uploading ? '上传中...' : '更换头像'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* 提示信息 */}
      <p className="mt-2 text-xs text-gray-500">
        支持 JPG、PNG，最大 2MB
      </p>

      {/* 消息提示 */}
      {message && (
        <p className={`mt-2 text-sm ${message.includes('成功') ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
