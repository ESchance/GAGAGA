import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { GalaxyIcon } from '../components/Icons'

export default function NotFound() {
  return (
    <div className="page-container flex items-center justify-center">
      <div className="text-center px-4">
        <GalaxyIcon className="w-20 h-20 mx-auto mb-4 text-[var(--color-primary)]" />
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">页面不存在</h1>
        <p className="text-[var(--color-text-tertiary)] mb-6">你访问的页面可能已被移动或删除。</p>
        <Link to="/" className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate inline-flex items-center">
          <Home size={16} className="mr-1.5" /> 返回首页
        </Link>
      </div>
    </div>
  )
}
