import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// 弹出公告（更新说明）管理界面
// 管理员可编辑公告内容，保存后写入 site_announcements 表
export default function SiteAnnouncementAdmin({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('📢 嘎宇宙公告')
  const [sections, setSections] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 读取当前启用的公告，用于填充表单
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const { data } = await supabase
          .from('site_announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          setVersion(data.version)
          setTitle(data.title)
          setSections(
            (data.sections || []).map((s) => ({
              icon: s.icon || '📝',
              title: s.title || '',
              itemsText: (s.items || []).join('\n')
            }))
          )
        }
      } catch (error) {
        console.error('读取公告失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCurrent()
  }, [])

  const updateSection = (index, field, value) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const addSection = () => {
    setSections((prev) => [...prev, { icon: '📝', title: '', itemsText: '' }])
  }

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!version.trim() || !title.trim()) {
      setMessage('请填写版本号和标题')
      return
    }

    const normalizedSections = sections
      .filter((s) => s.title.trim())
      .map((s) => ({
        icon: s.icon || '📝',
        title: s.title.trim(),
        items: (s.itemsText || '')
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
      }))

    setSaving(true)
    setMessage('')
    try {
      // 先停用其他版本，保证只有一条启用公告
      await supabase
        .from('site_announcements')
        .update({ is_active: false })
        .not('version', 'eq', version.trim())

      const { data, error } = await supabase
        .from('site_announcements')
        .upsert(
          {
            version: version.trim(),
            title: title.trim(),
            sections: normalizedSections,
            is_active: true
          },
          { onConflict: 'version' }
        )
        .select()
        .single()

      if (error) throw error

      setMessage('保存成功！')
      if (onSaved) onSaved(data)
      setTimeout(() => {
        if (onClose) onClose()
      }, 800)
    } catch (error) {
      console.error('保存公告失败:', error)
      setMessage('保存失败：' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden animate-fade-in-up">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">📣 管理更新公告</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="关闭"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-500 text-sm">加载中...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 版本号与标题 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="如 3.0"
                  />
                  <p className="mt-1 text-xs text-gray-400">版本号变化后，所有用户会重新看到公告</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 板块列表 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">公告板块</label>
                  <button
                    onClick={addSection}
                    className="text-sm text-blue-500 hover:text-blue-700 font-medium"
                  >
                    + 添加板块
                  </button>
                </div>

                {sections.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
                    暂无板块，点击"添加板块"创建
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">板块 {index + 1}</span>
                          <button
                            onClick={() => removeSection(index)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            删除板块
                          </button>
                        </div>
                        <div className="grid grid-cols-5 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">图标</label>
                            <input
                              type="text"
                              value={section.icon}
                              onChange={(e) => updateSection(index, 'icon', e.target.value)}
                              className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                              placeholder="🎉"
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="block text-xs text-gray-500 mb-1">板块标题</label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSection(index, 'title', e.target.value)}
                              className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                              placeholder="如：最新更新"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            内容条目（每行一条）
                          </label>
                          <textarea
                            value={section.itemsText}
                            onChange={(e) => updateSection(index, 'itemsText', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                            placeholder="第一条内容&#10;第二条内容"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 提示 */}
              <p className="text-xs text-gray-400 bg-blue-50 rounded-lg p-3">
                💡 保存后，版本号如有变化，所有用户下次打开首页都会看到这份公告。
              </p>

              {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  message.includes('成功')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-gradient text-white px-6 py-2 rounded-lg font-medium btn-animate disabled:opacity-50"
          >
            {saving ? '保存中...' : '💾 保存公告'}
          </button>
        </div>
      </div>
    </div>
  )
}
