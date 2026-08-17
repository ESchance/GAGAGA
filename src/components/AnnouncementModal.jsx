import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

// 弹出公告（网站更新说明）
// 内容从数据库 site_announcements 表读取，管理员在首页"管理公告"中维护
const ANNOUNCEMENT_KEY = 'gagaga_announcement_dismissed'

export default function AnnouncementModal() {
  const [show, setShow] = useState(false)
  const [announcement, setAnnouncement] = useState(null)
  const location = useLocation()

  // 监听路由变化，在首页时检查是否需要弹出公告
  useEffect(() => {
    let timer = null

    const checkAndShow = async () => {
      // 只在首页（/）时检查
      if (location.pathname !== '/') return

      const { supabase } = await import('../lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      // 只有登录用户才显示公告
      if (!session?.user) return

      // 读取数据库中最新的启用公告
      const { data, error } = await supabase
        .from('site_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) return
      setAnnouncement(data)

      // 检查是否已读过当前版本
      const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY)
      if (dismissed !== data.version) {
        // 延迟500ms后显示公告（让页面加载完成）
        timer = setTimeout(() => {
          setShow(true)
        }, 500)
      }
    }

    checkAndShow()

    // 组件卸载或路由变化时清除定时器
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [location.pathname])

  const handleClose = useCallback(() => {
    setShow(false)
  }, [])

  const handleDismiss = useCallback(() => {
    // 记住当前版本，下次不再显示
    if (announcement) {
      localStorage.setItem(ANNOUNCEMENT_KEY, announcement.version)
    }
    setShow(false)
  }, [announcement])

  if (!show || !announcement) return null

  const sections = Array.isArray(announcement.sections) ? announcement.sections : []

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-(--color-surface) rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-fade-in-up">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{announcement.title}</h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {sections.length === 0 ? (
            <p className="text-center text-(--color-text-tertiary) text-sm py-6">暂无公告内容</p>
          ) : (
            sections.map((section, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <h3 className="flex items-center text-lg font-semibold text-(--color-text-primary) mb-3">
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {(section.items || []).map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start text-(--color-text-secondary) text-sm">
                      <span className="mr-2 text-(--color-text-tertiary)">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-(--color-border) bg-(--color-bg-secondary)">
          <div className="flex justify-between items-center">
            <button
              onClick={handleDismiss}
              className="text-sm text-(--color-text-tertiary) hover:text-(--color-text-secondary) transition-colors"
            >
              不再显示
            </button>
            <button
              onClick={handleClose}
              className="btn-gradient text-white px-6 py-2 rounded-full font-medium text-sm btn-animate"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
