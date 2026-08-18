import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--color-border-light)] bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[var(--color-text-tertiary)]">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">嘎</span>
          </div>
          <span>嘎宇宙 · 多人实时在线交流论坛</span>
        </div>
        <div className="flex items-center space-x-5">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">首页</Link>
          <Link to="/worldbuilding" className="hover:text-[var(--color-primary)] transition-colors">创作</Link>
        </div>
        <span>© {year} 嘎宇宙</span>
      </div>
    </footer>
  )
}
