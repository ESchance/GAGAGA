import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// SPA 路由切换时回到页面顶部（浏览器默认不会复位滚动位置）
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
