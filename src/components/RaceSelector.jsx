import { useState, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { RACES } from '../lib/worldbuilding'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { GalaxyIcon } from './Icons'
import { RaceInsignia } from './RaceBadge'
import { RACE_COLORS } from '../lib/raceVisuals'

export default function RaceSelector({ onSelect }) {
  const [selectedRace, setSelectedRace] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const modalRef = useRef(null)

  const handleSelect = (race) => {
    setSelectedRace(race)
    setShowConfirm(true)
  }

  useFocusTrap(true, () => onSelect(null), modalRef)

  const handleConfirm = async () => {
    if (!selectedRace) return

    setSelecting(true)
    await onSelect(selectedRace)
    setSelecting(false)
  }

  const getRaceColor = (raceKey) => RACE_COLORS[raceKey] || 'var(--color-primary)'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-[var(--color-surface)] rounded-3xl shadow-2xl max-w-2xl w-full animate-fade-in-up overflow-hidden border border-(--color-border)">
        {/* 头部 */}
        <div className="text-center py-8 px-6">
          <GalaxyIcon className="w-20 h-20 mx-auto mb-4 text-[var(--color-secondary)]" />
          <h2 className="text-3xl font-bold heading-gradient mb-2">欢迎来到嘎宇宙</h2>
          <p className="text-(--color-text-secondary) text-sm">在开始你的旅程之前，请选择你的种族</p>
          <p className="text-(--color-warning) text-xs mt-2 flex items-center justify-center gap-1"><AlertTriangle size={14} /> 种族选择后不可更改，请慎重选择</p>
        </div>

        {/* 种族选择网格 */}
        {!showConfirm && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(RACES).map(([key, race]) => {
                const color = getRaceColor(key)
                const isSelected = selectedRace === key
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${isSelected ? '' : 'border-(--color-border) bg-(--color-bg-tertiary)'}`}
                    style={isSelected ? {
                      borderColor: color,
                      background: `color-mix(in srgb, ${color} 14%, transparent)`
                    } : undefined}
                  >
                    <div className="mb-2 flex justify-center" style={{ color }}>
                      <RaceInsignia race={key} className="w-10 h-10" />
                    </div>
                    <div className="text-(--color-text-primary) font-medium text-sm">{race.name}</div>
                    <div className="text-(--color-text-tertiary) text-xs mt-1">{race.description}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 确认选择 */}
        {showConfirm && selectedRace && (
          <div className="px-6 pb-6">
            <div className="bg-(--color-bg-tertiary) rounded-2xl p-6 mb-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex justify-center" style={{ color: getRaceColor(selectedRace) }}>
                  <RaceInsignia race={selectedRace} className="w-14 h-14" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-(--color-text-primary)">{RACES[selectedRace].name}</h3>
                  <p className="text-(--color-text-secondary) text-sm">{RACES[selectedRace].description}</p>
                </div>
              </div>
              <p className="text-(--color-text-secondary) text-sm">
                你确定要选择 <span className="font-medium" style={{ color: getRaceColor(selectedRace) }}>{RACES[selectedRace].name}</span> 吗？
                <br />
                <span className="text-(--color-warning) text-xs">此操作不可更改！</span>
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-6 py-3 text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-tertiary) rounded-xl transition-all duration-200 font-medium"
              >
                返回选择
              </button>
              <button
                onClick={handleConfirm}
                disabled={selecting}
                className="flex-1 px-6 py-3 gradient-header text-white rounded-xl font-medium hover:opacity-90 transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center"
              >
                {selecting ? (
                  <span className="flex items-center justify-center">
                    <div className="loading-spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    确认中...
                  </span>
                ) : (
                  <><CheckCircle2 size={16} className="mr-1.5" /> 确认选择</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 底部提示和跳过按钮 */}
        <div className="px-6 pb-6">
          <p className="text-center text-(--color-text-tertiary) text-xs mb-4">
            每个种族都有独特的背景故事，选择后将随机获得一个
          </p>
          <div className="text-center">
            <button
              onClick={() => onSelect(null)}
              className="text-(--color-text-tertiary) hover:text-(--color-text-primary) text-sm transition-colors duration-200"
            >
              跳过，稍后选择
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}