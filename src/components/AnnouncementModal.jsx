import { useState, useEffect, useCallback } from 'react'

const ANNOUNCEMENT_KEY = 'gagaga_announcement_dismissed'
const ANNOUNCEMENT_VERSION = '1.0'

const announcementContent = {
  version: ANNOUNCEMENT_VERSION,
  title: '📢 网站公告',
  sections: [
    {
      icon: '🎉',
      title: '最新更新',
      items: [
        '新增用户管理功能（超级管理员）',
        '新增嘎宇宙种族系统和编号',
        '新增嘎宇宙创作板块',
        '优化移动端体验',
        '修复点赞计数问题',
        '修复删除用户问题'
      ]
    },
    {
      icon: '📖',
      title: '使用说明',
      items: [
        '注册后可选择种族，获得唯一编号',
        '嘎宇宙创作需要选择种族才能参与',
        '首页发帖无需选择种族',
        '超级管理员可以管理用户'
      ]
    },
    {
      icon: '⚠️',
      title: '注意事项',
      items: [
        '种族选择后不可更改',
        '编号中的 4 和 44 已跳过（不吉利）',
        '删除用户操作不可撤销'
      ]
    }
  ]
}

export default function AnnouncementModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // 检查是否已关闭过公告
    const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY)
    if (dismissed !== ANNOUNCEMENT_VERSION) {
      // 延迟显示，让页面先加载
      const timer = setTimeout(() => {
        setShow(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = useCallback(() => {
    setShow(false)
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(ANNOUNCEMENT_KEY, ANNOUNCEMENT_VERSION)
    setShow(false)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
