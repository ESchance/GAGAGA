/**
 * 移动端 HUD 组件
 * 简化布局，适配小屏幕
 */

import { useState, useEffect, useCallback } from 'react'

export default function MobileHUD({ visible = false, hoveredNebula = null }) {
  const [time, setTime] = useState('00:00:00')
  const [startTime] = useState(Date.now())
  const [loadValues, setLoadValues] = useState({
    cpu: 45,
    network: 78
  })

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0')
      const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')
      const seconds = (elapsed % 60).toString().padStart(2, '0')
      setTime(`${hours}:${minutes}:${seconds}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  // 动态波动负荷值
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadValues(prev => ({
        cpu: Math.max(20, Math.min(80, prev.cpu + (Math.random() - 0.5) * 10)),
        network: Math.max(50, Math.min(95, prev.network + (Math.random() - 0.5) * 12))
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-30 pointer-events-none opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationDuration: '2s', animationFillMode: 'forwards' }}>
      {/* 暗角 */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 85%, rgba(0, 0, 0, 0.7) 100%)'
      }} />

      {/* 左上角 - 时间 */}
      <div className="absolute top-4 left-4">
        <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
          TIMECODE
        </div>
        <div className="text-cyan-200 text-sm font-mono font-bold" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
          {time}
        </div>
      </div>

      {/* 右上角 - 状态和星云名称 */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
          STATUS
        </div>
        <div className="text-cyan-200 text-xs font-mono" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
          在线
        </div>
        {hoveredNebula && (
          <div className="mt-2">
            <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
              SECTOR
            </div>
            <div className="text-cyan-200 text-sm font-mono font-bold" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
              {hoveredNebula}
            </div>
          </div>
        )}
      </div>

      {/* 左下角 - 负荷 */}
      <div className="absolute bottom-4 left-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 text-xs font-mono w-8">CPU</span>
            <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${loadValues.cpu}%`,
                  background: 'linear-gradient(90deg, #00ffff, #00bfff)'
                }}
              />
            </div>
            <span className="text-cyan-200 text-xs font-mono w-8">{Math.round(loadValues.cpu)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 text-xs font-mono w-8">NET</span>
            <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${loadValues.network}%`,
                  background: 'linear-gradient(90deg, #00ffff, #00bfff)'
                }}
              />
            </div>
            <span className="text-cyan-200 text-xs font-mono w-8">{Math.round(loadValues.network)}%</span>
          </div>
        </div>
      </div>

      {/* 右下角 - 信号 */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className="text-cyan-400 text-xs font-mono space-y-1 opacity-70">
          <div>信号: <span className="text-cyan-200">85%</span></div>
          <div>扇区: <span className="text-cyan-200">ALPHA-7</span></div>
        </div>
      </div>
    </div>
  )
}
