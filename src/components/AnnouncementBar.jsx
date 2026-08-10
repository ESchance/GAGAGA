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
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center">
            {/* 固定的标题 */}
            <div className="flex-shrink-0 font-bold mr-4 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              📢 公告
            </div>

            {/* 滚动内容 */}
            <div className="overflow-hidden flex-1 relative">
              <div className="announcement-scroll whitespace-nowrap text-sm">
                {announcement.content}
              </div>
            </div>

            {/* 管理员编辑按钮 */}
            {isAdmin && (
              <button
                onClick={openEditModal}
                className="flex-shrink-0 ml-4 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-sm transition-all duration-200"
              >
                ✏️ 编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full animate-fade-in-up">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📝 编辑公告
              </h3>

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl input-animate focus:border-blue-500 focus:outline-none resize-none"
                placeholder="输入公告内容..."
              />

              <p className="text-xs text-gray-500 mt-2">
                💡 用 · 分隔不同内容，将自动滚动显示
              </p>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editContent.trim()}
                  className="btn-gradient text-white px-5 py-2 rounded-full font-medium btn-animate disabled:opacity-50"
                >
                  {saving ? '保存中...' : '💾 保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
