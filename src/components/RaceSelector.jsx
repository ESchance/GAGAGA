import { useState, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { RACES } from '../lib/worldbuilding'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { GalaxyIcon } from './Icons'

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-3xl shadow-2xl max-w-2xl w-full animate-fade-in-up overflow-hidden border border-purple-500 border-opacity-30">
        {/* 头部 */}
        <div className="text-center py-8 px-6">
          <GalaxyIcon className="w-20 h-20 mx-auto mb-4 text-purple-300" />
          <h2 className="text-3xl font-bold text-white mb-2">欢迎来到嘎宇宙</h2>
          <p className="text-purple-200 text-sm">在开始你的旅程之前，请选择你的种族</p>
          <p className="text-(--color-warning) text-xs mt-2 flex items-center justify-center gap-1"><AlertTriangle size={14} /> 种族选择后不可更改，请慎重选择</p>
        </div>

        {/* 种族选择网格 */}
        {!showConfirm && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(RACES).map(([key, race]) => (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    selectedRace === key
                      ? 'border-purple-400 bg-purple-500 bg-opacity-30'
                      : 'border-gray-600 bg-gray-800 bg-opacity-50 hover:border-purple-400'
                  }`}
                >
                  <div className="text-4xl mb-2">{race.icon}</div>
                  <div className="text-white font-medium text-sm">{race.name}</div>
                  <div className="text-(--color-text-tertiary) text-xs mt-1">{race.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 确认选择 */}
        {showConfirm && selectedRace && (
          <div className="px-6 pb-6">
            <div className="bg-gray-800 bg-opacity-50 rounded-2xl p-6 mb-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-5xl">{RACES[selectedRace].icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white">{RACES[selectedRace].name}</h3>
                  <p className="text-purple-200 text-sm">{RACES[selectedRace].description}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                你确定要选择 <span className="text-purple-400 font-medium">{RACES[selectedRace].name}</span> 吗？
                <br />
                <span className="text-(--color-warning) text-xs">此操作不可更改！</span>
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
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
              className="text-(--color-text-tertiary) hover:text-white text-sm transition-colors duration-200"
            >
              跳过，稍后选择
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
