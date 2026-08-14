import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import AnnouncementModal from './components/AnnouncementModal'
import IntroAnimation from './animation/IntroAnimation'
import { supabase } from './lib/supabase'
import './index.css'

// 代码分割 - 只加载当前路由需要的组件
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const CreatePost = lazy(() => import('./pages/CreatePost'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Worldbuilding = lazy(() => import('./pages/Worldbuilding'))
const WorldbuildingCreate = lazy(() => import('./pages/WorldbuildingCreate'))
const WorldbuildingDetail = lazy(() => import('./pages/WorldbuildingDetail'))
const WorldbuildingEdit = lazy(() => import('./pages/WorldbuildingEdit'))
const UserManagement = lazy(() => import('./pages/UserManagement'))

// 加载状态组件
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-[var(--color-text-secondary)] text-sm">加载中...</p>
      </div>
    </div>
  )
}

// 动画状态管理
function AnimationManager({ children }) {
  const [showIntro, setShowIntro] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // 检查是否是登录/注册后的跳转
    const params = new URLSearchParams(location.search)
    const showIntroParam = params.get('showIntro')
    const newUserParam = params.get('newUser')

    if (showIntroParam === 'true') {
      setShowIntro(true)
      setIsNewUser(newUserParam === 'true')
      // 清除 URL 参数
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location])

  const handleIntroComplete = () => {
    setShowIntro(false)
    // 动画结束后，如果是新用户，跳转到种族选择
    if (isNewUser) {
      // 获取当前用户 ID 并跳转到个人主页
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          navigate(`/profile/${session.user.id}`)
        }
      })
    }
  }

  return (
    <>
      {showIntro && (
        <IntroAnimation
          onComplete={handleIntroComplete}
          isFirstTime={!isNewUser}
        />
      )}
      {children}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AnimationManager>
          <AnnouncementModal />
          <div className="min-h-screen">
            <Navbar />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/worldbuilding" element={<Worldbuilding />} />
                <Route path="/worldbuilding/create" element={<WorldbuildingCreate />} />
                <Route path="/worldbuilding/:id" element={<WorldbuildingDetail />} />
                <Route path="/worldbuilding/:id/edit" element={<WorldbuildingEdit />} />
                <Route path="/admin/users" element={<UserManagement />} />
              </Routes>
            </Suspense>
          </div>
        </AnimationManager>
      </Router>
    </ErrorBoundary>
  )
}

export default App
