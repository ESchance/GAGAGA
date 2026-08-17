// "嘎宇宙"标题：title 阶段浮现，collapse 阶段坍缩聚向中心
// 仅用 CSS transform/opacity 动画（backOut 弹性入场 / expoIn 吸入）

export default function Title({ stage }) {
  const visible = stage === 'title' || stage === 'collapse'
  if (!visible) return null

  return (
    <div className={`intro-title ${stage === 'collapse' ? 'is-collapse' : ''}`}>
      <span className="intro-title-main">嘎宇宙</span>
      <span className="intro-title-sub">G A G A G A</span>
    </div>
  )
}
