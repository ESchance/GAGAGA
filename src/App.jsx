import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import AnnouncementModal from './components/AnnouncementModal'
import IntroOverlay from './animation/IntroOverlay'
import RaceSelector from './components/RaceSelector'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import './index.css'

// 代码分割
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

// 应用外壳：读 URL 参数决定是否播入场动画；新用户动画结束弹种族选择
function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [pendingRace, setPendingRace] = useState(false)

  const params = new URLSearchParams(location.search)
  const showIntro = params.get('showIntro') === 'true'
  const newUser = params.get('newUser') === 'true'

  const handleIntroComplete = useCallback(() => {
    navigate('/', { replace: true }) // 清掉 showIntro/newUser，防回退重播
    if (newUser && profile && !profile.race_selected) {
      setPendingRace(true) // 新用户 → 动画后弹种族选择
    }
  }, [navigate, newUser, profile])

  const handleRace = async (race) => {
    if (race === null) {
      // 跳过，稍后选
      setPendingRace(false)
      return
    }
    if (!user) return
    const { selectRace } = await import('./lib/worldbuilding')
    const result = await selectRace(user.id, race)
    if (result.success) {
      setPendingRace(false)
    } else {
      alert('选择种族失败：' + result.error)
    }
  }

  if (showIntro) {
    return <IntroOverlay newUser={newUser} onComplete={handleIntroComplete} />
  }

  return (
    <>
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
      {pendingRace && <RaceSelector onSelect={handleRace} />}
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
