/**
 * HUD覆盖层组件
 * 显示科幻风格的数据界面
 */

import { useState, useEffect } from 'react'

export default function HUDOverlay({ visible = false, phase = 'void' }) {
  const [time, setTime] = useState('00:00:00')
  const [startTime] = useState(Date.now())

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

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-30 pointer-events-none opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationDuration: '2s', animationFillMode: 'forwards' }}>
      {/* 扫描线效果 */}
      <div className="absolute inset-0 opacity-30" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.015) 2px, rgba(0, 255, 255, 0.015) 4px)'
      }} />

      {/* 暗角效果 */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.4) 80%, rgba(0, 0, 0, 0.7) 100%)'
      }} />

      {/* HUD角标 */}
      <div className="absolute top-5 left-5 w-6 h-6 border-l-2 border-t-2 border-cyan-400 opacity-60" />
      <div className="absolute top-5 right-5 w-6 h-6 border-r-2 border-t-2 border-cyan-400 opacity-60" />
      <div className="absolute bottom-5 left-5 w-6 h-6 border-l-2 border-b-2 border-cyan-400 opacity-60" />
      <div className="absolute bottom-5 right-5 w-6 h-6 border-r-2 border-b-2 border-cyan-400 opacity-60" />

      {/* 左上角 - 系统状态 */}
      <div className="absolute top-8 left-8">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-cyan-400 border-opacity-30 rounded-lg p-3">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest mb-2">
            系统状态
          </div>
          <div className="text-cyan-300 text-xs font-mono space-y-1 opacity-80">
            <div>◆ 能量等级: <span className="text-cyan-200">100%</span></div>
            <div>◆ 导航坐标: <span className="text-cyan-200">X:0 Y:0 Z:0</span></div>
            <div>◆ 量子稳定: <span className="text-cyan-200">99.7%</span></div>
          </div>
        </div>
      </div>

      {/* 右上角 - 时间码 */}
      <div className="absolute top-8 right-8">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-cyan-400 border-opacity-30 rounded-lg p-3">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest mb-2">
            时间码
          </div>
          <div className="text-cyan-300 text-xs font-mono space-y-1 opacity-80">
            <div>UTC: <span className="text-cyan-200">{time}</span></div>
            <div>扇区: <span className="text-cyan-200">ALPHA-7</span></div>
            <div>扫描状态: <span className="text-cyan-200">激活</span></div>
          </div>
        </div>
      </div>

      {/* 左下角 - 传感器 */}
      <div className="absolute bottom-8 left-8">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-cyan-400 border-opacity-30 rounded-lg p-3">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest mb-2">
            传感器
          </div>
          <div className="text-cyan-300 text-xs font-mono space-y-1 opacity-80">
            <div>◆ 引力波: <span className="text-cyan-200">检测中</span></div>
            <div>◆ 辐射: <span className="text-cyan-200">正常</span></div>
            <div>◆ 暗物质: <span className="text-cyan-200">27.4%</span></div>
          </div>
        </div>
      </div>

      {/* 右下角 - 当前阶段 */}
      <div className="absolute bottom-8 right-8">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-cyan-400 border-opacity-30 rounded-lg p-3">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest mb-2">
            当前阶段
          </div>
          <div className="text-cyan-300 text-xs font-mono space-y-1 opacity-80">
            <div>◆ 任务状态: <span className="text-cyan-200">探索中</span></div>
            <div>◆ 宇宙年龄: <span className="text-cyan-200">138亿年</span></div>
            <div>◆ 星系数量: <span className="text-cyan-200">2万亿</span></div>
          </div>
        </div>
      </div>

      {/* 顶部中央 - 标题 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-cyan-400 border-opacity-30 rounded-lg px-6 py-2">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest">
            ◆ 嘎宇宙观测系统 v2.7.3 ◆
          </div>
          <div className="text-cyan-300 text-xs font-mono opacity-60 text-center mt-1">
            深空扫描模式 · 实时数据流
          </div>
        </div>
      </div>

      {/* 底部中央 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-cyan-400 border-opacity-30 rounded-lg px-6 py-2">
          <div className="text-cyan-300 text-xs font-mono opacity-60 text-center">
            数据传输率: 1.21 GW | 量子加密: 已激活
          </div>
        </div>
      </div>
    </div>
  )
}
