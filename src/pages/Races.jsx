import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { RACES, selectRace } from '../lib/worldbuilding'
import { RACE_COLORS } from '../lib/raceVisuals'
import { RACE_DETAILS } from '../lib/raceDetails'
import { RaceAvatar } from '../components/RaceBadge'
import { GalaxyIcon } from '../components/Icons'
import { X, CheckCircle2 } from 'lucide-react'

export default function Races() {
  const { user, profile, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [selecting, setSelecting] = useState(false)

  const raceKeys = Object.keys(RACES)

  const openModal = (key) => setSelected(key)
  const closeModal = () => setSelected(null)

  const handleTilt = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rx = ((y - cy) / cy) * -6
    const ry = ((x - cx) / cx) * 6
    card.style.setProperty('--rx', `${rx}deg`)
    card.style.setProperty('--ry', `${ry}deg`)
  }
  const resetTilt = (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg')
    e.currentTarget.style.setProperty('--ry', '0deg')
  }

  const handleSelect = async (key) => {
    if (!user) {
      showToast('请先登录后再选择种族', 'info')
      return
    }
    if (profile?.race_selected) {
      showToast(`你已经是 ${RACES[profile.race]?.name || '某个种族'} 了`, 'warning')
      return
    }
    setSelecting(true)
    const result = await selectRace(user.id, key)
    setSelecting(false)
    if (result.success) {
      showToast(`欢迎加入 ${RACES[key].name}`, 'success')
      navigate('/')
    } else {
      showToast('选择失败：' + result.error, 'error')
    }
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="page-container py-10 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <header className="text-center mb-10 animate-fade-in-up">
          <GalaxyIcon className="w-16 h-16 mx-auto mb-4 text-[var(--color-secondary)] drop-shadow-[0_0_18px_rgba(129,140,248,0.35)]" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-[var(--color-text-primary)] mb-3">
            噶宇宙 · <span className="heading-gradient">种族图鉴</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] tracking-widest text-sm sm:text-base">
            探索六大种族，选择属于你的命运
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {raceKeys.map((key, i) => {
            const color = RACE_COLORS[key]
            const race = RACES[key]
            const detail = RACE_DETAILS[key]
            return (
              <article
                key={key}
                onClick={() => openModal(key)}
                onMouseMove={handleTilt}
                onMouseLeave={resetTilt}
                tabIndex={0}
                role="button"
                aria-label={`查看${race.name}详情`}
                className="group relative rounded-2xl border border-[var(--color-border)] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] animate-fade-in-up"
                style={{ '--glow': color, animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className="absolute top-0 left-[10%] w-[80%] h-px opacity-0 transition-opacity duration-300 group-hover:opacity-60"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                />
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                  style={{ boxShadow: `0 0 46px -14px ${color}` }}
                />
                <RaceAvatar
                  race={key}
                  size="lg"
                  className="mx-auto mb-4 transition-transform duration-300 group-hover:scale-105"
                  style={{ filter: `drop-shadow(0 0 18px ${color})` }}
                />
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] tracking-wide">{race.name}</h2>
                <p className="text-[var(--color-text-secondary)] text-sm mt-2 leading-relaxed line-clamp-2">
                  {detail.tagline}
                </p>
              </article>
            )
          })}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl border border-white/10 bg-[#080b14]/95 shadow-2xl p-6 sm:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-10 h-10 rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors grid place-items-center"
              aria-label="关闭"
            >
              <X size={20} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8 items-center">
              <div className="relative flex justify-center">
                <div
                  className="absolute inset-[15%] rounded-full blur-[60px] opacity-30"
                  style={{ background: RACE_COLORS[selected] }}
                />
                <RaceAvatar
                  race={selected}
                  size="xl"
                  className="relative z-10"
                  style={{ filter: `drop-shadow(0 0 40px ${RACE_COLORS[selected]})` }}
                />
              </div>
              <div>
                <h2
                  className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-wide"
                  style={{
                    background: `linear-gradient(90deg, #fff, ${RACE_COLORS[selected]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {RACES[selected].name}
                </h2>
                <p className="text-[var(--color-text-secondary)] text-sm mb-5 tracking-wide">
                  {RACE_DETAILS[selected].tagline}
                </p>
                <p className="text-[#b8c2d4] leading-7 mb-6">
                  {RACE_DETAILS[selected].desc}
                </p>
                <ul className="flex flex-wrap gap-2 mb-6">
                  {RACE_DETAILS[selected].traits.map(t => (
                    <li key={t} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-[#dbe3f0]">
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  {!authLoading && !user && (
                    <button
                      onClick={() => navigate('/login')}
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-[#03050a] bg-white hover:bg-gray-200 transition-colors"
                    >
                      登录后选择
                    </button>
                  )}
                  {!authLoading && user && profile?.race_selected && (
                    <button
                      disabled
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-[var(--color-text-tertiary)] border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]"
                    >
                      你已是 {RACES[profile.race]?.name || '某个种族'}
                    </button>
                  )}
                  {!authLoading && user && !profile?.race_selected && (
                    <button
                      onClick={() => handleSelect(selected)}
                      disabled={selecting}
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-[#03050a] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${RACE_COLORS[selected]}, #ffffff)`,
                        boxShadow: `0 10px 28px -10px ${RACE_COLORS[selected]}`
                      }}
                    >
                      {selecting ? '确认中...' : <><CheckCircle2 size={18} /> 选择此种族</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
