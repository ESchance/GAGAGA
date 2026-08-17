// "开始探索"按钮：travel 阶段出现，点击触发加速

export default function StartButton({ onClick, show }) {
  if (!show) return null

  return (
    <button
      className="intro-start-btn"
      onClick={onClick}
      aria-label="开始探索"
    >
      <span className="intro-start-label">开始探索</span>
      <span className="intro-start-arrow">→</span>
    </button>
  )
}
