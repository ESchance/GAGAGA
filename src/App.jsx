import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CreatePost from './pages/CreatePost'
import PostDetail from './pages/PostDetail'
import Profile from './pages/Profile'
import Worldbuilding from './pages/Worldbuilding'
import WorldbuildingCreate from './pages/WorldbuildingCreate'
import WorldbuildingDetail from './pages/WorldbuildingDetail'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
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
        </Routes>
      </div>
    </Router>
  )
}

export default App
