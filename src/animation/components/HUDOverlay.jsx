/**
 * HUD覆盖层组件 - 科技感浮动设计
 * 无边框、无方块，纯文字+图标
 */

import { useState, useEffect, useCallback } from 'react'

export default function HUDOverlay({ visible = false, hoveredNebula = null }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [time, setTime] = useState('00:00:00')
  const [startTime] = useState(Date.now())
  const [loadValues, setLoadValues] = useState({
    cpu: 45,
    memory: 62,
    network: 78,
    energy: 95
  })
  const [signalValues, setSignalValues] = useState({
    signal: 85,
    quantum: 99.7,
    gravity: 0,
    darkMatter: 27.4
  })

  // 监听鼠标移动
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
        memory: Math.max(40, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.max(50, Math.min(95, prev.network + (Math.random() - 0.5) * 12)),
        energy: Math.max(60, Math.min(100, prev.energy + (Math.random() - 0.5) * 5))
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // 动态波动信号值
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalValues(prev => ({
        signal: Math.max(70, Math.min(95, prev.signal + (Math.random() - 0.5) * 8)),
        quantum: Math.max(95, Math.min(99.9, prev.quantum + (Math.random() - 0.5) * 2)),
        gravity: Math.floor(Math.random() * 1000),
        darkMatter: Math.max(25, Math.min(30, prev.darkMatter + (Math.random() - 0.5) * 2))
      }))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // 根据鼠标位置计算"星云坐标"
  const getStarRegion = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const xPercent = (mousePos.x / width * 100).toFixed(1)
    const yPercent = (mousePos.y / height * 100).toFixed(1)

    // 如果有悬停的星云，显示它的名称
    const region = hoveredNebula || '未知区域'

    return { xPercent, yPercent, region }
  }, [mousePos, hoveredNebula])

  const starRegion = getStarRegion()

  return (
    <div className="fixed inset-0 z-30 pointer-events-none" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
      {/* 暗角效果 */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 85%, rgba(0, 0, 0, 0.7) 100%)'
      }} />

      {/* 科技感扫描线 + 扫描光带 */}
      <div className="absolute inset-0 hud-scanlines" />
      <div className="hud-scanbar" />

      {/* 左侧 - 星云坐标（浮动式） */}
      <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
        <div className="space-y-4">
          {/* 星云名称 */}
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
              SECTOR
            </div>
            <div className="text-cyan-200 text-lg font-mono font-bold" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
              {starRegion.region}
            </div>
          </div>

          {/* 坐标 */}
          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
              COORDINATES
            </div>
            <div className="text-cyan-200 text-sm font-mono" style={{ textShadow: '0 0 8px rgba(0, 255, 255, 0.3)' }}>
              <div>X: <span className="text-cyan-100 font-bold">{starRegion.xPercent}</span></div>
              <div>Y: <span className="text-cyan-100 font-bold">{starRegion.yPercent}</span></div>
              <div>Z: <span className="text-cyan-100 font-bold">0.00</span></div>
            </div>
          </div>

          {/* 传感器数据 */}
          <div className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
              SENSORS
            </div>
            <div className="text-cyan-300 text-xs font-mono space-y-1 opacity-70">
              <div>引力波: <span className="text-cyan-200">{signalValues.gravity}</span></div>
              <div>暗物质: <span className="text-cyan-200">{signalValues.darkMatter.toFixed(1)}%</span></div>
              <div>量子场: <span className="text-cyan-200">{signalValues.quantum.toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 - 系统负荷（浮动式） */}
      <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
        <div className="space-y-4">
          {/* 时间码 */}
          <div className="animate-fade-in text-right" style={{ animationDelay: '0.5s' }}>
            <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
              TIMECODE
            </div>
            <div className="text-cyan-200 text-lg font-mono font-bold" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
              {time}
            </div>
          </div>

          {/* 负荷指标 */}
          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-2 text-right">
              SYSTEM LOAD
            </div>
            <div className="space-y-2">
              {[
                { label: 'CPU', value: loadValues.cpu },
                { label: 'MEM', value: loadValues.memory },
                { label: 'NET', value: loadValues.network },
                { label: 'PWR', value: loadValues.energy }
              ].map((item) => (
                <div key={item.label} className="flex items-center space-x-2">
                  <span className="text-cyan-400 text-xs font-mono w-8">{item.label}</span>
                  <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${item.value}%`,
                        background: 'linear-gradient(90deg, #00ffff, #00bfff)'
                      }}
                    />
                  </div>
                  <span className="text-cyan-200 text-xs font-mono w-10 text-right">
                    {Math.round(item.value)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 状态 */}
          <div className="animate-fade-in text-right" style={{ animationDelay: '0.9s' }}>
            <div className="text-cyan-400 text-xs font-mono tracking-widest opacity-60 mb-1">
              STATUS
            </div>
            <div className="text-cyan-300 text-xs font-mono space-y-1 opacity-70">
              <div>系统: <span className="text-cyan-200">在线</span></div>
              <div>信号: <span className="text-cyan-200">{Math.round(signalValues.signal)}%</span></div>
              <div>量子: <span className="text-cyan-200">{signalValues.quantum.toFixed(1)}%</span></div>
              <div>引力: <span className="text-cyan-200">{signalValues.gravity}</span></div>
              <div>暗物质: <span className="text-cyan-200">{signalValues.darkMatter.toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
