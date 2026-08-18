import { useState, useEffect, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { supabase } from '../lib/supabase'
import { checkIsAdmin } from '../lib/admin'
import { useToast } from './Toast'
import { PenLine, FileText, Save } from 'lucide-react'

export default function AnnouncementBar() {
  const { showToast } = useToast()
  const [announcement, setAnnouncement] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const editModalRef = useRef(null)

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
        .maybeSingle()

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
        const { error } = await supabase
          .from('announcements')
          .update({
            content: editContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', announcement.id)

        if (error) throw error
      } else {
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

      await fetchAnnouncement()
      setShowEditModal(false)
    } catch (error) {
      console.error('保存公告失败:', error)
      showToast('保存失败：' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = () => {
    setEditContent(announcement?.content || '')
    setShowEditModal(true)
  }

  useFocusTrap(showEditModal, () => setShowEditModal(false), editModalRef)

  if (!announcement) {
    return null
  }

  return (
    <>
      {/* 公告栏 - 滚动显示 */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white py-2.5 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center">
            {/* 滚动内容 */}
            <div className="overflow-hidden flex-1 relative">
              <div className="announcement-scroll whitespace-nowrap text-sm opacity-95">
                {announcement.content}
              </div>
            </div>

            {/* 管理员编辑按钮 */}
            {isAdmin && (
              <button
                onClick={openEditModal}
                className="flex-shrink-0 ml-4 px-3 py-1 text-white text-opacity-80 hover:text-opacity-100 hover:bg-(--color-surface) hover:bg-opacity-20 rounded-full text-xs transition-all duration-200 inline-flex items-center"
              >
                <PenLine size={14} className="mr-1" /> 编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false) }}
        >
          <div ref={editModalRef} className="bg-(--color-surface) rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileText size={20} /> 编辑公告</h3>
            </div>

            <div className="p-6">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-[var(--color-border)] rounded-xl input-animate focus:border-[var(--color-primary)] focus:outline-none resize-none"
                placeholder="输入公告内容..."
              />

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editContent.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {saving ? '保存中...' : (<><Save size={16} className="mr-1.5" /> 保存</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
