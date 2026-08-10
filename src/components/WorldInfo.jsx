import { RACES } from '../lib/worldbuilding'

export default function WorldInfo({ profile, showStory = false, compact = false }) {
  if (!profile) return null

  const raceInfo = RACES[profile.race] || RACES.human

  // 紧凑模式 - 用于帖子/评论
  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        <span>{raceInfo.icon}</span>
        <span className="text-gray-500">{raceInfo.name}</span>
        {profile.member_code && (
          <span className="text-gray-400">{profile.member_code}</span>
        )}
      </div>
    )
  }

  // 完整模式 - 用于个人主页
  return (
    <div className="space-y-4">
      {/* 身份信息卡片 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <span className="mr-2">📋</span> 身份信息
        </h4>
        <div className="space-y-2">
          {profile.member_code && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">编号</span>
              <span className="font-mono font-bold text-purple-600">{profile.member_code}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">种族</span>
            <span className="font-medium text-gray-800">
              {raceInfo.icon} {raceInfo.name}
            </span>
          </div>
          {profile.title && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">称号</span>
              <span className="font-medium text-yellow-600">{profile.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* 默认背景故事 */}
      {showStory && profile.defaultStory && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="mr-2">📖</span> 我的起源故事
            <span className="ml-2 text-xs text-gray-400 font-normal">（不可编辑）</span>
          </h4>
          <div className="bg-white bg-opacity-60 rounded-xl p-4">
            <h5 className="font-medium text-gray-800 mb-2">{profile.defaultStory.title}</h5>
            <p className="text-gray-600 text-sm leading-relaxed">{profile.defaultStory.content}</p>
          </div>
        </div>
      )}

      {/* 自定义背景故事 */}
      {showStory && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="mr-2">✍️</span> 我的故事
            <span className="ml-2 text-xs text-gray-400 font-normal">（可编辑）</span>
          </h4>
          {profile.custom_backstory ? (
            <div className="bg-white bg-opacity-60 rounded-xl p-4">
              <p className="text-gray-600 text-sm leading-relaxed">{profile.custom_backstory}</p>
            </div>
          ) : (
            <div className="bg-white bg-opacity-60 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm">还没有添加个人故事</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
