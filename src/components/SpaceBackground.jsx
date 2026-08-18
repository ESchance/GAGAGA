import { useMemo } from 'react'

// 星点分层：数量/透明度递增，避免同帧全部闪烁（box-shadow 静态渲染，性能友好）
const STAR_LAYERS = [
  { count: 60, min: 0.15, max: 0.55, blur: 0 },
  { count: 28, min: 0.25, max: 0.8, blur: 0 },
  { count: 12, min: 0.35, max: 0.9, blur: 1.5 }
]

const buildStars = (layer) => {
  const shadows = []
  for (let i = 0; i < layer.count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 100).toFixed(2)
    const alpha = (layer.min + Math.random() * (layer.max - layer.min)).toFixed(2)
    shadows.push(`${x}% ${y}% ${layer.blur}px 0 rgba(226, 232, 240, ${alpha})`)
  }
  return shadows.join(', ')
}

export default function SpaceBackground() {
  const stars = useMemo(() => STAR_LAYERS.map(buildStars), [])

  return (
    <div className="space-bg" aria-hidden="true">
      <div className="space-nebula space-nebula-1" />
      <div className="space-nebula space-nebula-2" />
      <div className="space-nebula space-nebula-3" />
      <div className="space-stars space-stars-1" style={{ boxShadow: stars[0] }} />
      <div className="space-stars space-stars-2" style={{ boxShadow: stars[1] }} />
      <div className="space-stars space-stars-3" style={{ boxShadow: stars[2] }} />
      <div className="space-wash" />
      <div className="space-vignette" />
    </div>
  )
}