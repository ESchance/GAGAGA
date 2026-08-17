import { RACES } from '../lib/worldbuilding'

export default function WorldInfo({ profile, showStory = false, compact = false }) {
  if (!profile) return null

  const raceInfo = RACES[profile.race] || RACES.human

  // 紧凑模式 - 用于帖子/评论
  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        <span>{raceInfo.icon}</span>
        <span className="text-(--color-text-tertiary)">{raceInfo.name}</span>
        {profile.member_code && (
          <span className="text-(--color-text-tertiary)">{profile.member_code}</span>
        )}
      </div>
    )
  }

  // 完整模式 - 用于个人主页
  return (
    <div className="space-y-4">
      {/* 身份信息卡片 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
        <h4 className="text-sm font-semibold text-(--color-text-secondary) mb-3 flex items-center">
          <span className="mr-2">📋</span> 身份信息
        </h4>
        <div className="space-y-2">
          {profile.member_code && (
            <div className="flex items-center justify-between">
              <span className="text-(--color-text-secondary) text-sm">编号</span>
              <span className="font-mono font-bold text-purple-600">{profile.member_code}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-(--color-text-secondary) text-sm">种族</span>
            <span className="font-medium text-(--color-text-primary)">
              {raceInfo.icon} {raceInfo.name}
            </span>
          </div>
          {profile.title && (
            <div className="flex items-center justify-between">
              <span className="text-(--color-text-secondary) text-sm">称号</span>
              <span className="font-medium text-(--color-warning)">{profile.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* 默认背景故事 */}
      {showStory && profile.defaultStory && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
          <h4 className="text-sm font-semibold text-(--color-text-secondary) mb-3 flex items-center">
            <span className="mr-2">📖</span> 我的起源故事
            <span className="ml-2 text-xs text-(--color-text-tertiary) font-normal">（不可编辑）</span>
          </h4>
          <div className="bg-(--color-surface) bg-opacity-60 rounded-xl p-4">
            <h5 className="font-medium text-(--color-text-primary) mb-2">{profile.defaultStory.title}</h5>
            <p className="text-(--color-text-secondary) text-sm leading-relaxed">{profile.defaultStory.content}</p>
          </div>
        </div>
      )}
    </div>
  )
}
