import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import AnnouncementModal from './components/AnnouncementModal'
import { ToastProvider } from './components/Toast'

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
const NotFound = lazy(() => import('./pages/NotFound'))

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

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider>
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
