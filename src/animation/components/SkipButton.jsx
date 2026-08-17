// 跳过按钮：仅回放/非新用户时显示（右上角）

export default function SkipButton({ onClick }) {
  return (
    <button
      className="intro-skip-btn"
      onClick={onClick}
      aria-label="跳过动画"
    >
      跳过动画 →
    </button>
  )
}
