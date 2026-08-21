import { RACES } from '../lib/worldbuilding'
import { RACE_AVATARS, RACE_COLORS } from '../lib/raceVisuals'

// ============ 种族徽记（P4：统一 SVG 几何符号） ============
const InsigniaBase = ({ children, className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10.2" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
    {children}
  </svg>
)

const HumanInsignia = (props) => (
  <InsigniaBase {...props}>
    <circle cx="12" cy="8.4" r="2.7" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7.2 17.9a4.8 4.8 0 0 1 9.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </InsigniaBase>
)

const MechInsignia = (props) => (
  <InsigniaBase {...props}>
    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 5.2v2.3M12 16.5v2.3M5.2 12h2.3M16.5 12h2.3M7.3 7.3l1.6 1.6M15.1 15.1l1.6 1.6M16.7 7.3l-1.6 1.6M8.9 15.1l-1.6 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </InsigniaBase>
)

const AlienInsignia = (props) => (
  <InsigniaBase {...props}>
    <ellipse cx="12" cy="12" rx="7.4" ry="3.1" stroke="currentColor" strokeWidth="1.6" transform="rotate(-24 12 12)" />
    <circle cx="16.8" cy="8.1" r="1.5" fill="currentColor" stroke="none" />
  </InsigniaBase>
)

const ElfInsignia = (props) => (
  <InsigniaBase {...props}>
    <path d="M12 4.2 13.4 10.6 19.8 12 13.4 13.4 12 19.8 10.6 13.4 4.2 12 10.6 10.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </InsigniaBase>
)

const DragonInsignia = (props) => (
  <InsigniaBase {...props}>
    <path d="M12 4.6c.9 3.3 3.8 4.3 3.8 7.2a3.8 3.8 0 0 1-7.6 0c0-2.9 2.9-3.9 3.8-7.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </InsigniaBase>
)

const VoidInsignia = (props) => (
  <InsigniaBase {...props}>
    <path d="M13.5 5.1a6.9 6.9 0 1 0 0 13.8 5.4 5.4 0 1 1 0-13.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </InsigniaBase>
)

const RACE_ICONS = {
  human: HumanInsignia,
  mech: MechInsignia,
  alien: AlienInsignia,
  elf: ElfInsignia,
  dragon: DragonInsignia,
  void: VoidInsignia
}

export const RaceInsignia = ({ race, className = 'w-5 h-5', color }) => {
  const Icon = RACE_ICONS[race] || RACE_ICONS.human
  return <Icon className={className} style={color ? { color } : undefined} />
}

const SIZE_CLASSES = {
  sm: 'w-5 h-5 rounded-full overflow-hidden object-cover',
  md: 'w-10 h-10 object-contain',
  lg: 'w-28 h-28 object-contain',
  xl: 'w-full max-w-[320px] object-contain'
}

// 种族头像（高清透明 PNG），无对应头像时回退到 SVG 徽记
export const RaceAvatar = ({ race, size, className, fallbackClassName, style }) => {
  const src = RACE_AVATARS[race]
  const sizeClasses = size ? SIZE_CLASSES[size] : null
  const classes = `${sizeClasses || className || 'w-16 h-16'} ${size ? className || '' : ''}`.trim()
  if (!src) {
    return <RaceInsignia race={race} className={fallbackClassName || classes} color={RACE_COLORS[race]} style={style} />
  }
  return (
    <img
      src={src}
      alt={(RACES[race]?.name || '种族') + '头像'}
      className={classes}
      style={style}
      loading="lazy"
      decoding="async"
    />
  )
}
