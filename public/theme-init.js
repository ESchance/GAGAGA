// 渲染前设置主题，避免暗色模式用户刷新时先闪浅色（FOUC）
// 外链 render-blocking 脚本，符合 script-src 'self' 的 CSP 约束。
(function () {
  try {
    var saved = localStorage.getItem('gagaga_theme')
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    document.documentElement.setAttribute('data-theme', saved)
    var themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', saved === 'dark' ? '#070B14' : '#5E6AD2')
  } catch {}
})()
