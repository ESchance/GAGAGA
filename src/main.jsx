import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 注意：不使用 StrictMode。入场动画（IntroOverlay）管理 WebGL 渲染器与 rAF 主循环，
// StrictMode 的开发期双挂载会重复初始化渲染器、干扰画布 WebGL 上下文。
createRoot(document.getElementById('root')).render(
  <App />
)
