import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

const ANNOUNCEMENT_KEY = 'gagaga_announcement_dismissed'
const ANNOUNCEMENT_VERSION = '2.0'

const announcementContent = {
  version: ANNOUNCEMENT_VERSION,
  title: '📢 嘎宇宙公告',
  sections: [
    {
      icon: '🎉',
      title: '最新更新',
      items: [
        '全新宇宙大爆发入场动画（30秒沉浸式体验）',
        '支持暗色/浅色模式手动切换',
        '新增嘎宇宙创作板块（故事、角色、设定、点子）',
        '新增用户管理功能（超级管理员专属）',
        '新增嘎宇宙种族系统（6种种族+独特编号）',
        '优化移动端和PC端视觉体验',
        '修复点赞计数和删除用户等问题'
      ]
    },
    {
      icon: '📖',
      title: '功能说明',
      items: [
        '注册后可选择种族，获得唯一编号（GZ-XXXX）',
        '首页发帖无需选择种族，所有用户可参与',
        '嘎宇宙创作需要选择种族才能参与',
        '所有用户可查看嘎宇宙住户',
        '超级管理员可管理用户和删除内容',
        '支持暗色/浅色模式切换'
      ]
    },
    {
      icon: '⚠️',
      title: '注意事项',
      items: [
        '种族选择后不可更改，请慎重选择',
        '编号中的 4 和 44 已跳过（不吉利）',
        '删除用户操作不可撤销',
        '请遵守社区规则，文明交流'
      ]
    }
  ]
}

export default function AnnouncementModal() {
  const [show, setShow] = useState(false)
  const location = useLocation()

  // 监听路由变化，在首页时检查是否需要弹出公告
  useEffect(() => {
    const checkAndShow = async () => {
      // 只在首页（/）时检查
      if (location.pathname !== '/') return

      // 检查动画是否正在进行
      const introComplete = localStorage.getItem('gagaga_intro_complete')
      if (!introComplete) {
        return
      }

      const { supabase } = await import('../lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      // 只有登录用户才显示公告
      if (session?.user) {
        // 检查是否已关闭过当前版本的公告
        const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY)
        if (dismissed !== ANNOUNCEMENT_VERSION) {
          // 延迟500ms后显示公告（让页面加载完成）
          const timer = setTimeout(() => {
            setShow(true)
          }, 500)
          return () => clearTimeout(timer)
        }
      }
    }

    checkAndShow()
  }, [location.pathname])

  const handleClose = useCallback(() => {
    setShow(false)
  }, [])

  const handleDismiss = useCallback(() => {
    // 记住当前版本，下次登录不再显示
    localStorage.setItem(ANNOUNCEMENT_KEY, ANNOUNCEMENT_VERSION)
    setShow(false)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-fade-in-up">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{announcementContent.title}</h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {announcementContent.sections.map((section, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-3">
                <span className="mr-2">{section.icon}</span>
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start text-gray-600 text-sm">
                    <span className="mr-2 text-gray-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
