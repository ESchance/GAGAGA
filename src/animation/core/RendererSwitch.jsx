import { useEffect, useState } from 'react'
import AnimationCanvas from './AnimationCanvas'
import { getQualityProfile } from '../utils/webgl'

// 渲染器选择器
// 按设备能力选择渲染器：
//   high / medium → Three.js（动态 import，PC 端）
//   2d → Canvas 2D（移动端 / 无 WebGL2 / 加载失败降级）
export default function RendererSwitch({ timeline, onNebulaHover, onReady }) {
  // { profile: '2d'|'high'|'medium', Comp } ；null=加载中
  const [renderer, setRenderer] = useState(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const p = getQualityProfile()

      if (p === '2d') {
        if (!cancelled) setRenderer({ profile: '2d', Comp: AnimationCanvas })
        return
      }

      // PC 端动态加载 three 渲染器，失败则降级 2D
      try {
        const mod = await import('./ThreeAnimationCanvas')
        if (!cancelled) setRenderer({ profile: p, Comp: mod.default })
      } catch (error) {
        console.error('Three 渲染器加载失败，回退 2D:', error)
        if (!cancelled) setRenderer({ profile: '2d', Comp: AnimationCanvas })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // 2D 渲染器为同步组件，state 就绪即视为渲染器就绪
  useEffect(() => {
    if (renderer?.profile === '2d') {
      onReady?.()
    }
  }, [renderer, onReady])

  // 加载中不渲染（IntroAnimation 的 loading 进度条覆盖此阶段）
  if (!renderer) return null

  const Comp = renderer.Comp
  if (renderer.profile === '2d') {
    return <Comp timeline={timeline} onNebulaHover={onNebulaHover} />
  }
  return (
    <Comp
      timeline={timeline}
      onNebulaHover={onNebulaHover}
      quality={renderer.profile}
      onReady={onReady}
    />
  )
}
