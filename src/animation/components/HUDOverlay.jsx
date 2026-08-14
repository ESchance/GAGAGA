/**
 * HUD覆盖层组件 - 动态版
 * 显示科幻风格的数据界面，带鼠标交互
 */

import { useState, useEffect, useCallback } from 'react'

export default function HUDOverlay({ visible = false }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [time, setTime] = useState('00:00:00')
  const [startTime] = useState(Date.now())
  const [loadValues, setLoadValues] = useState({
    cpu: 45,
    memory: 62,
    network: 78,
    energy: 95
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

  // 根据鼠标位置计算"星云坐标"
  const getStarRegion = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const xPercent = (mousePos.x / width * 100).toFixed(1)
    const yPercent = (mousePos.y / height * 100).toFixed(1)

    // 根据位置生成星云名称
    const regions = [
      '猎户座星云', '仙女座星系', '蟹状星云', '鹰状星云',
      '马头星云', '玫瑰星云', '礁湖星云', '螺旋星云'
    ]
    const regionIndex = Math.floor((mousePos.x + mousePos.y) / (width + height) * regions.length)
    const region = regions[Math.min(regionIndex, regions.length - 1)]

    return { xPercent, yPercent, region }
  }, [mousePos])

  if (!visible) return null

  const starRegion = getStarRegion()

  return (
    <div className="fixed inset-0 z-30 pointer-events-none opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationDuration: '2s', animationFillMode: 'forwards' }}>
      {/* 扫描线效果 */}
      <div className="absolute inset-0 opacity-20" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.015) 2px, rgba(0, 255, 255, 0.015) 4px)'
      }} />

      {/* 暗角效果 */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.3) 80%, rgba(0, 0, 0, 0.6) 100%)'
      }} />

      {/* HUD角标 */}
      <div className="absolute top-5 left-5 w-6 h-6 border-l-2 border-t-2 border-cyan-400 opacity-40" />
      <div className="absolute top-5 right-5 w-6 h-6 border-r-2 border-t-2 border-cyan-400 opacity-40" />
      <div className="absolute bottom-5 left-5 w-6 h-6 border-l-2 border-b-2 border-cyan-400 opacity-40" />
      <div className="absolute bottom-5 right-5 w-6 h-6 border-r-2 border-b-2 border-cyan-400 opacity-40" />

      {/* 左侧 - 鼠标位置信息 */}
      <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-cyan-400 border-opacity-20 rounded-lg p-4 w-52">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest mb-3">
            ◆ 星域坐标
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-cyan-300 text-xs font-mono opacity-70">X坐标</span>
              <span className="text-cyan-200 text-sm font-mono font-bold">{starRegion.xPercent}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-cyan-300 text-xs font-mono opacity-70">Y坐标</span>
              <span className="text-cyan-200 text-sm font-mono font-bold">{starRegion.yPercent}%</span>
            </div>
            <div className="border-t border-cyan-400 border-opacity-20 pt-2 mt-2">
              <div className="text-cyan-300 text-xs font-mono opacity-70 mb-1">所在星云</div>
              <div className="text-cyan-200 text-sm font-mono font-bold">{starRegion.region}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 - 系统负荷 */}
      <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-cyan-400 border-opacity-20 rounded-lg p-4 w-52">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest mb-3">
            ◆ 系统负荷
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-cyan-300 text-xs font-mono opacity-70">CPU</span>
                <span className="text-cyan-200 text-xs font-mono">{Math.round(loadValues.cpu)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${loadValues.cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-cyan-300 text-xs font-mono opacity-70">内存</span>
                <span className="text-cyan-200 text-xs font-mono">{Math.round(loadValues.memory)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-cyan-500 rounded-full transition-all duration-1000"
                  style={{ width: `${loadValues.memory}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-cyan-300 text-xs font-mono opacity-70">网络</span>
                <span className="text-cyan-200 text-xs font-mono">{Math.round(loadValues.network)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-1000"
                  style={{ width: `${loadValues.network}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-cyan-300 text-xs font-mono opacity-70">能量</span>
                <span className="text-cyan-200 text-xs font-mono">{Math.round(loadValues.energy)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${loadValues.energy}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 左下角 - 传感器 */}
      <div className="absolute bottom-20 left-8">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-cyan-400 border-opacity-20 rounded-lg p-3">
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

      {/* 右下角 - 时间码 */}
      <div className="absolute bottom-20 right-8">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-cyan-400 border-opacity-20 rounded-lg p-3">
          <div className="text-cyan-400 text-xs font-mono font-bold tracking-widest mb-2">
            时间码
          </div>
          <div className="text-cyan-300 text-xs font-mono space-y-1 opacity-80">
            <div>UTC: <span className="text-cyan-200">{time}</span></div>
            <div>扇区: <span className="text-cyan-200">ALPHA-7</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
