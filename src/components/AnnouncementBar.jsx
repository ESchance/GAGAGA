import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { checkIsAdmin } from '../lib/admin'

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAnnouncement()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin)
      }
    })
  }, [])

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      setAnnouncement(data)
    } catch (error) {
      console.error('获取公告失败:', error)
    }
  }

  const handleSave = async () => {
    if (!editContent.trim()) return

    setSaving(true)
    try {
      if (announcement) {
        // 更新现有公告
        const { error } = await supabase
          .from('announcements')
          .update({
            content: editContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', announcement.id)

        if (error) throw error
      } else {
        // 创建新公告
        const { error } = await supabase
          .from('announcements')
          .insert([
            {
              content: editContent,
              is_active: true,
              created_by: user.id
            }
          ])

        if (error) throw error
      }

      // 重新获取公告
      await fetchAnnouncement()
      setShowEditModal(false)
    } catch (error) {
      console.error('保存公告失败:', error)
      alert('保存失败：' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = () => {
    setEditContent(announcement?.content || '')
    setShowEditModal(true)
  }

  if (!announcement) {
    return null
  }

  return (
    <>
      {/* 公告栏 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2.5 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center">
            {/* 固定的标题 - 极简风格 */}
            <div className="flex-shrink-0 font-medium mr-3 text-sm opacity-90">
              📢
            </div>

            {/* 滚动内容 */}
            <div className="overflow-hidden flex-1 relative">
              <div className="announcement-scroll whitespace-nowrap text-sm opacity-95">
                {announcement.content}
              </div>
            </div>

            {/* 管理员编辑按钮 - 柔和样式 */}
            {isAdmin && (
              <button
                onClick={openEditModal}
                className="flex-shrink-0 ml-3 px-3 py-1 text-white text-opacity-80 hover:text-opacity-100 hover:bg-white hover:bg-opacity-20 rounded-full text-xs transition-all duration-300"
              >
                ✏️ 编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-fade-in-up overflow-hidden">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">📝</span> 编辑公告
              </h3>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl input-animate focus:border-blue-500 focus:outline-none resize-none"
                placeholder="输入公告内容..."
              />

              <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 flex items-center">
                  <span className="mr-2">💡</span>
                  用 · 分隔不同内容，将自动滚动显示
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editContent.trim()}
                  className="btn-gradient text-white px-6 py-2.5 rounded-full font-medium btn-animate disabled:opacity-50 hover:shadow-lg"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <div className="loading-spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      保存中...
                    </span>
                  ) : (
                    '💾 保存'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
