import { useState, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { RACES } from '../lib/worldbuilding'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { GalaxyIcon } from './Icons'
import { RaceAvatar } from './RaceBadge'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* 沉浸式深空背景 */}
      <div className="absolute inset-0 bg-[#03050a]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% -10%, rgba(80,100,140,0.22) 0%, transparent 55%), radial-gradient(ellipse at 50% 110%, rgba(40,50,80,0.18) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(8,12,22,1) 0%, #03050a 75%)'
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%224%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')] opacity-[0.04] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl border border-white/10 bg-[#080b14]/92 shadow-2xl backdrop-blur-md"
      >
        {/* 头部 */}
        <div className="text-center px-6 pt-10 pb-8">
          <GalaxyIcon className="w-16 h-16 mx-auto mb-4 text-[var(--color-secondary)] drop-shadow-[0_0_18px_rgba(129,140,248,0.35)]" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-white mb-3">
            欢迎来到<span className="heading-gradient">噶宇宙</span>
          </h2>
          <p className="text-[#8e9aae] text-sm sm:text-base tracking-widest">
            在开始你的旅程之前，请选择你的种族
          </p>
          <p className="text-[#f59e0b] text-xs mt-3 flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} />
            种族选择后不可更改，请慎重选择
          </p>
        </div>

        {/* 种族选择网格 */}
        {!showConfirm && (
          <div className="px-6 pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(RACES).map(([key, race]) => {
                const color = getRaceColor(key)
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 text-center transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b14]"
                    style={{ '--glow': color }}
                  >
                    <div
                      className="absolute top-0 left-[10%] w-[80%] h-px opacity-0 transition-opacity duration-300 group-hover:opacity-60"
                      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                    />
                    <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                      style={{ boxShadow: `0 0 46px -14px ${color}` }}
                    />
                    <RaceAvatar
                      race={key}
                      className="mx-auto mb-4 h-28 w-28 object-contain transition-transform duration-300 group-hover:scale-105"
                      style={{ filter: `drop-shadow(0 0 18px ${color})` }}
                    />
                    <div className="text-white font-bold text-lg tracking-wide">{race.name}</div>
                    <div className="text-[#8e9aae] text-xs mt-2 leading-relaxed line-clamp-2">
                      {race.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 确认选择 */}
        {showConfirm && selectedRace && (
          <div className="px-6 pb-8">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8 items-center">
                <div className="relative flex justify-center">
                  <div
                    className="absolute inset-[15%] rounded-full blur-[56px] opacity-30"
                    style={{ background: getRaceColor(selectedRace) }}
                  />
                  <RaceAvatar
                    race={selectedRace}
                    className="relative z-10 w-full max-w-[260px] object-contain"
                    style={{ filter: `drop-shadow(0 0 34px ${getRaceColor(selectedRace)})` }}
                  />
                </div>
                <div>
                  <h3
                    className="text-3xl font-extrabold mb-2 tracking-wide"
                    style={{
                      background: `linear-gradient(90deg, #ffffff, ${getRaceColor(selectedRace)})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {RACES[selectedRace].name}
                  </h3>
                  <p className="text-[#8e9aae] text-sm mb-5 tracking-wide">
                    {RACES[selectedRace].description}
                  </p>
                  <p className="text-[#b8c2d4] text-sm leading-7 mb-6">
                    你确定要选择 <span className="font-semibold" style={{ color: getRaceColor(selectedRace) }}>{RACES[selectedRace].name}</span> 作为你的种族吗？
                    <br />
                    <span className="text-[#f59e0b] text-xs">此操作不可更改，选择后将随机获得一个专属背景故事。</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 px-6 py-3 rounded-xl text-[#8e9aae] hover:text-white hover:bg-white/5 border border-white/10 transition-all duration-200 font-medium"
                    >
                      返回选择
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={selecting}
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-[#03050a] transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${getRaceColor(selectedRace)}, #ffffff)`,
                        boxShadow: `0 10px 28px -10px ${getRaceColor(selectedRace)}`
                      }}
                    >
                      {selecting ? (
                        <>
                          <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                          确认中...
                        </>
                      ) : (
                        <><CheckCircle2 size={18} /> 确认选择</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 底部提示和跳过按钮 */}
        <div className="px-6 pb-8">
          <p className="text-center text-[#6b7280] text-xs mb-4">
            每个种族都有独特的背景故事，选择后将随机获得一个
          </p>
          <div className="text-center">
            <button
              onClick={() => onSelect(null)}
              className="text-[#6b7280] hover:text-[#b8c2d4] text-sm transition-colors duration-200"
            >
              跳过，稍后选择
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
