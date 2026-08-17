// 科技感 HUD 界面：travel/burst 阶段显示
// 四角边框、扫描线、定位数据、状态负荷条；fps 浮层由 IntroOverlay 独立管理

export default function HUD({ stage }) {
  const visible = stage === 'travel' || stage === 'burst'
  if (!visible) return null

  const speedText = stage === 'burst' ? 'FAST' : 'CRUISE'

  return (
    <div className="intro-hud">
      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />
      <div className="hud-scanlines" />
      <div className="hud-scanbar" />

      <div className="hud-data">
        <div className="hud-row">
          <span className="hud-label">定位</span>
          <span className="hud-value">GZ · 银河系</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">坐标</span>
          <span className="hud-value">0000 . 4 . 44</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">状态</span>
          <span className="hud-value hud-status">{speedText}</span>
        </div>
        <div className="hud-row">
          <span className="hud-label">载荷</span>
          <span className="hud-bar"><span /></span>
        </div>
      </div>
    </div>
  )
}
