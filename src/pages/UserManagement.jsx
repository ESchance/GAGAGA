import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUsersList, toggleAdmin, deleteUser, checkIsSuperAdmin } from '../lib/admin'
import { RACES } from '../lib/worldbuilding'
import Avatar from '../components/Avatar'

export default function UserManagement() {
  const navigate = useNavigate()
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
      alert('不能撤销超级管理员的身份')
      return
    }

    const result = await toggleAdmin(userId, currentRole)
    if (result.success) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: result.newRole } : u
      ))
    } else {
      alert('操作失败：' + result.error)
    }
  }, [])

  const handleDeleteClick = useCallback((userData) => {
    if (userData.role === 'superadmin') {
      alert('不能删除超级管理员')
      return
    }
    setSelectedUser(userData)
    setShowDeleteModal(true)
  }, [])

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
      alert('删除失败：' + result.error)
    }
  }, [selectedUser])

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.member_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleDisplay = (role) => {
    // 如果不是超级管理员视角，不显示超级管理员的特殊标识
    if (!isSuperAdmin && role === 'superadmin') {
      return { text: '普通用户', color: 'text-gray-600 bg-gray-50' }
    }

    switch (role) {
      case 'superadmin': return { text: '超级管理员', color: 'text-red-600 bg-red-50' }
      case 'admin': return { text: '管理员', color: 'text-yellow-600 bg-yellow-50' }
      default: return { text: '普通用户', color: 'text-gray-600 bg-gray-50' }
    }
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
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
          className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 页面标题 */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isSuperAdmin ? '👥 用户管理' : '🏠 嘎宇宙住户'}
          </h1>
          <p className="text-gray-500 mt-1">共 {users.length} 位用户</p>
          {!isSuperAdmin && (
            <p className="text-sm text-gray-400 mt-1">你只能查看用户列表，无法进行管理操作</p>
          )}
        </div>

        {/* 搜索框 */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            placeholder="搜索用户名或编号..."
          />
        </div>

        {/* PC端：表格布局 */}
        <div className="hidden md:block glass-effect rounded-2xl shadow-lg overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-1"></div>
            <div className="col-span-2">用户名</div>
            <div className="col-span-3">编号</div>
            <div className="col-span-2">角色</div>
            <div className="col-span-4 text-right">操作</div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">没有找到匹配的用户</div>
          ) : (
            filteredUsers.map((userData) => {
              const roleDisplay = getRoleDisplay(userData.role)
              const isCurrentUser = userData.id === user?.id

              return (
                <div key={userData.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center">
                  <div className="col-span-1">
                    <Avatar url={userData.avatar_url} username={userData.username} size="sm" role={userData.role} />
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-800">{userData.username}</span>
                    {isCurrentUser && <span className="ml-2 text-xs text-blue-500">(我)</span>}
                  </div>
                  <div className="col-span-3 text-sm text-gray-500 font-mono">{userData.member_code || '-'}</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleDisplay.color}`}>{roleDisplay.text}</span>
                  </div>
                  <div className="col-span-4 text-right">
                    {/* 只有超级管理员才能看到操作按钮 */}
                    {isSuperAdmin && userData.role !== 'superadmin' && !isCurrentUser && (
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleToggleAdmin(userData.id, userData.role)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${userData.role === 'admin' ? 'text-orange-600 hover:bg-orange-50' : 'text-blue-600 hover:bg-blue-50'}`}>
                          {userData.role === 'admin' ? '撤销管理' : '设为管理员'}
                        </button>
                        <button onClick={() => handleDeleteClick(userData)} className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-full text-xs font-medium transition-colors">删除</button>
                      </div>
                    )}
                    {(userData.role === 'superadmin' || isCurrentUser || !isSuperAdmin) && <span className="text-xs text-gray-400">-</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 移动端：卡片布局 */}
        <div className="md:hidden space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 glass-effect rounded-2xl">没有找到匹配的用户</div>
          ) : (
            filteredUsers.map((userData) => {
              const roleDisplay = getRoleDisplay(userData.role)
              const isCurrentUser = userData.id === user?.id

              return (
                <div key={userData.id} className="glass-effect rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar url={userData.avatar_url} username={userData.username} size="md" role={userData.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800 truncate">{userData.username}</span>
                        {isCurrentUser && <span className="text-xs text-blue-500">(我)</span>}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{userData.member_code || '未分配编号'}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleDisplay.color}`}>{roleDisplay.text}</span>
                  </div>
                  {/* 只有超级管理员才能看到操作按钮 */}
                  {isSuperAdmin && userData.role !== 'superadmin' && !isCurrentUser && (
                    <div className="flex space-x-2 pt-2 border-t border-gray-100">
                      <button onClick={() => handleToggleAdmin(userData.id, userData.role)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${userData.role === 'admin' ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
                        {userData.role === 'admin' ? '撤销管理' : '设为管理员'}
                      </button>
                      <button onClick={() => handleDeleteClick(userData)} className="flex-1 px-3 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors">删除</button>
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
        <div className="fixed inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">确认删除用户</h3>
                <p className="text-gray-500">确定要删除用户 <span className="font-medium text-red-500">"{selectedUser.username}"</span> 吗？</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-600 font-medium mb-2">该操作将删除：</p>
                <ul className="text-sm text-red-500 space-y-1">
                  <li>• 用户账号和登录信息</li>
                  <li>• 用户发布的所有帖子</li>
                  <li>• 用户发表的所有评论</li>
                  <li>• 用户的所有创作</li>
                  <li>• 用户的嘎宇宙身份信息</li>
                </ul>
                <p className="text-sm text-red-600 font-medium mt-2">此操作不可撤销！</p>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} disabled={deleting} className="flex-1 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium">取消</button>
                <button onClick={handleDeleteConfirm} disabled={deleting} className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200 disabled:opacity-50">{deleting ? '删除中...' : '🗑️ 确认删除'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
