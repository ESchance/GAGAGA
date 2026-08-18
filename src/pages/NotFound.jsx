import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { GalaxyIcon } from '../components/Icons'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <div className="page-container flex items-center justify-center">
      <div className="px-4 w-full">
        <EmptyState
          icon={<GalaxyIcon className="w-8 h-8 text-[var(--color-primary)]" />}
          title="页面不存在"
          description="你访问的页面可能已被移动或删除。"
        >
          <Link to="/" className="btn-gradient text-white px-6 py-3 rounded-full font-medium btn-animate inline-flex items-center">
            <Home size={16} className="mr-1.5" /> 返回首页
          </Link>
        </EmptyState>
      </div>
    </div>
  )
}
