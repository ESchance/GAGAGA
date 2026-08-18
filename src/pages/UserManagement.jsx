import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUsersList, toggleAdmin, deleteUser, checkIsSuperAdmin } from '../lib/admin'
import Avatar from '../components/Avatar'
import { useToast } from '../components/Toast'
import { AlertTriangle, Trash2, Search } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function UserManagement() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
        return
      }
      setUser(session.user)

      // 检查是否是超级管理员
      checkIsSuperAdmin(session.user.id).then((isAdmin) => {
        setIsSuperAdmin(isAdmin)
      })

      // 所有登录用户都可以访问，获取用户列表
      fetchUsers()
    })
  }, [navigate])

  const fetchUsers = async () => {
    setLoading(true)
    const data = await getUsersList()
    setUsers(data)
    setLoading(false)
  }

  const handleToggleAdmin = useCallback(async (userId, currentRole) => {
    if (currentRole === 'superadmin') {
      showToast('不能撤销超级管理员的身份', 'warning')
      return
    }

    const result = await toggleAdmin(userId, currentRole)
    if (result.success) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: result.newRole } : u
      ))
    } else {
      showToast('操作失败：' + result.error, 'error')
    }
  }, [showToast])

  const handleDeleteClick = useCallback((userData) => {
    if (userData.role === 'superadmin') {
      showToast('不能删除超级管理员', 'warning')
      return
    }
    setSelectedUser(userData)
    setShowDeleteModal(true)
  }, [showToast])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedUser) return

    setDeleting(true)
    const result = await deleteUser(selectedUser.id)
    setDeleting(false)

    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
      setShowDeleteModal(false)
      setSelectedUser(null)
    } else {
      showToast('删除失败：' + result.error, 'error')
    }
  }, [selectedUser, showToast])

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.member_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleDisplay = (role) => {
    // 如果不是超级管理员视角，不显示超级管理员的特殊标识
    if (!isSuperAdmin && role === 'superadmin') {
      return { text: '普通用户', color: 'text-(--color-text-secondary) bg-(--color-bg-secondary)' }
    }

    switch (role) {
      case 'superadmin': return { text: '超级管理员', color: 'text-(--color-error) bg-(--color-error)/10' }
      case 'admin': return { text: '管理员', color: 'text-(--color-warning) bg-(--color-warning)/10' }
      default: return { text: '普通用户', color: 'text-(--color-text-secondary) bg-(--color-bg-secondary)' }
    }
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-(--color-text-tertiary)">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-(--color-text-secondary) hover:text-[var(--color-primary)] mb-6 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 页面标题 */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold heading-gradient">
            {isSuperAdmin ? '用户管理' : '嘎宇宙住户'}
          </h1>
          <p className="text-(--color-text-tertiary) mt-1">共 {users.length} 位用户</p>
          {!isSuperAdmin && (
            <p className="text-sm text-(--color-text-tertiary) mt-1">你只能查看用户列表，无法进行管理操作</p>
          )}
        </div>

        {/* 搜索框 */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-(--color-border) rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="搜索用户名或编号..."
          />
        </div>

        {/* PC端：表格布局 */}
        <div className="hidden md:block glass-effect rounded-2xl shadow-lg overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* 表头 - 根据权限显示不同列 */}
          <div className={`grid gap-4 p-4 bg-(--color-bg-secondary) border-b border-(--color-border) text-sm font-medium text-(--color-text-secondary) ${isSuperAdmin ? 'grid-cols-12' : 'grid-cols-10'}`}>
            <div className={isSuperAdmin ? 'col-span-1' : 'col-span-1'}></div>
            <div className={isSuperAdmin ? 'col-span-2' : 'col-span-3'}>用户名</div>
            <div className={isSuperAdmin ? 'col-span-3' : 'col-span-3'}>编号</div>
            <div className={isSuperAdmin ? 'col-span-2' : 'col-span-3'}>角色</div>
            {isSuperAdmin && <div className="col-span-4 text-right">操作</div>}
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState icon={<Search size={28} />} title="没有找到匹配的用户" className="py-10" />
          ) : (
            filteredUsers.map((userData) => {
              const roleDisplay = getRoleDisplay(userData.role)
              const isCurrentUser = userData.id === user?.id

              return (
                <div key={userData.id} className={`grid gap-4 p-4 border-b border-(--color-border-light) hover:bg-(--color-bg-secondary) transition-colors items-center ${isSuperAdmin ? 'grid-cols-12' : 'grid-cols-10'}`}>
                  <div className={isSuperAdmin ? 'col-span-1' : 'col-span-1'}>
                    <Avatar url={userData.avatar_url} username={userData.username} size="sm" role={userData.role} race={userData.race} />
                  </div>
                  <div className={isSuperAdmin ? 'col-span-2' : 'col-span-3'}>
                    <span className="font-medium text-(--color-text-primary)">{userData.username}</span>
                    {isCurrentUser && <span className="ml-2 text-xs text-[var(--color-info)]">(我)</span>}
                  </div>
                  <div className={`${isSuperAdmin ? 'col-span-3' : 'col-span-3'} text-sm text-(--color-text-tertiary) member-code`}>{userData.member_code || '-'}</div>
                  <div className={isSuperAdmin ? 'col-span-2' : 'col-span-3'}>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleDisplay.color}`}>{roleDisplay.text}</span>
                  </div>
                  {isSuperAdmin && (
                    <div className="col-span-4 text-right">
                      {userData.role !== 'superadmin' && !isCurrentUser && (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleToggleAdmin(userData.id, userData.role)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${userData.role === 'admin' ? 'text-[var(--color-warning)] hover:bg-(--color-warning)/10' : 'text-[var(--color-info)] hover:bg-(--color-info)/10'}`}>
                            {userData.role === 'admin' ? '撤销管理' : '设为管理员'}
                          </button>
                          <button onClick={() => handleDeleteClick(userData)} className="px-3 py-1 text-(--color-error) hover:bg-(--color-error)/10 rounded-full text-xs font-medium transition-colors">删除</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 移动端：卡片布局 */}
        <div className="md:hidden space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {filteredUsers.length === 0 ? (
            <div className="glass-effect rounded-2xl">
              <EmptyState icon={<Search size={28} />} title="没有找到匹配的用户" className="py-10" />
            </div>
          ) : (
            filteredUsers.map((userData) => {
              const roleDisplay = getRoleDisplay(userData.role)
              const isCurrentUser = userData.id === user?.id

              return (
                <div key={userData.id} className="glass-effect rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar url={userData.avatar_url} username={userData.username} size="md" role={userData.role} race={userData.race} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-(--color-text-primary) truncate">{userData.username}</span>
                        {isCurrentUser && <span className="text-xs text-[var(--color-info)]">(我)</span>}
                      </div>
                      <div className="text-xs text-(--color-text-tertiary) member-code">{userData.member_code || '未分配编号'}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleDisplay.color}`}>{roleDisplay.text}</span>
                  </div>
                  {/* 只有超级管理员才能看到操作按钮 */}
                  {isSuperAdmin && userData.role !== 'superadmin' && !isCurrentUser && (
                    <div className="flex space-x-2 pt-2 border-t border-(--color-border-light)">
                      <button onClick={() => handleToggleAdmin(userData.id, userData.role)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${userData.role === 'admin' ? 'text-[var(--color-warning)] bg-(--color-warning)/10 hover:bg-(--color-warning)/15' : 'text-[var(--color-info)] bg-(--color-info)/10 hover:bg-(--color-info)/15'}`}>
                        {userData.role === 'admin' ? '撤销管理' : '设为管理员'}
                      </button>
                      <button onClick={() => handleDeleteClick(userData)} className="flex-1 px-3 py-2 text-(--color-error) bg-(--color-error)/10 hover:bg-(--color-error)/15 rounded-lg text-xs font-medium transition-colors">删除</button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gradient-to-br from-(--color-primary)/30 to-(--color-secondary)/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
            <div className="p-6">
              <div className="text-center mb-6">
                <AlertTriangle size={56} className="mx-auto mb-4 text-(--color-warning)" />
                <h3 className="text-xl font-bold text-(--color-text-primary) mb-2">确认删除用户</h3>
                <p className="text-(--color-text-tertiary)">确定要删除用户 <span className="font-medium text-(--color-error)">"{selectedUser.username}"</span> 吗？</p>
              </div>
              <div className="bg-(--color-error)/10 rounded-xl p-4 mb-6">
                <p className="text-sm text-(--color-error) font-medium mb-2">该操作将删除：</p>
                <ul className="text-sm text-(--color-error) space-y-1">
                  <li>• 用户账号和登录信息</li>
                  <li>• 用户发布的所有帖子</li>
                  <li>• 用户发表的所有评论</li>
                  <li>• 用户的所有创作</li>
                  <li>• 用户的嘎宇宙身份信息</li>
                </ul>
                <p className="text-sm text-(--color-error) font-medium mt-2">此操作不可撤销！</p>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} disabled={deleting} className="flex-1 px-6 py-3 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-tertiary) rounded-xl transition-all duration-200 font-medium">取消</button>
                <button onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 px-6 py-3 bg-(--color-error) text-white rounded-xl font-medium hover:bg-(--color-error-hover) transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-1.5">{deleting ? '删除中...' : (<><Trash2 size={16} /> 确认删除</>)}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
