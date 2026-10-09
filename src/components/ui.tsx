import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useGame, today } from '../store/game'
import { Icon, type IconName } from './Icon'
import { WORLDS } from '../curriculum/worlds'
import { dailyQuests, isClaimed } from '../store/quests'

type Tone = 'sky' | 'leaf' | 'heart' | 'sun' | 'white' | 'grape' | 'ghost'

const TONES: Record<Tone, { cls: string; shadow: string }> = {
  sky: { cls: 'bg-sky text-white', shadow: 'var(--color-sky-dark)' },
  leaf: { cls: 'bg-leaf text-white', shadow: 'var(--color-leaf-dark)' },
  heart: { cls: 'bg-heart text-white', shadow: 'var(--color-heart-dark)' },
  sun: { cls: 'bg-sun text-ink', shadow: 'var(--color-sun-dark)' },
  grape: { cls: 'bg-grape text-white', shadow: 'var(--color-grape-dark)' },
  white: { cls: 'bg-white text-sky border-2 border-line', shadow: '#E0D9E8' },
  ghost: { cls: 'bg-transparent text-sky', shadow: 'transparent' },
}

export function Button({ tone = 'sky', className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; children: ReactNode }) {
  const t = TONES[tone]
  return (
    <button
      {...rest}
      style={{ ['--shadow' as string]: t.shadow, ...rest.style }}
      className={`btn3d h-13 px-5 text-[17px] uppercase inline-flex items-center justify-center gap-2 ${t.cls} ${className}`}
    >
      {children}
    </button>
  )
}

export function Stat({ icon, value, color, dim, onClick }: { icon: IconName; value: ReactNode; color: string; dim?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 font-black text-[17px] px-1.5 py-1 rounded-xl active:bg-cloud" style={{ color }}>
      <Icon name={icon} size={26} style={dim ? { filter: 'grayscale(1)', opacity: 0.45 } : undefined} />
      {value}
    </button>
  )
}

export function TopStats() {
  const { streak, gems, hearts, lastLessonDate, level, go } = useGame()
  const activeToday = lastLessonDate === today()
  const world = WORLDS.find((w) => w.id === level)!
  return (
    <div className="flex items-center justify-between w-full">
      <button onClick={() => go('profile')} className="w-10 h-9 rounded-xl border-2 border-line flex items-center justify-center" style={{ background: world.soft }} aria-label="Level">
        <Icon name={world.icon} size={24} />
      </button>
      <Stat icon="flame" value={streak} color={activeToday ? '#FF8A1F' : '#B7AEC0'} dim={!activeToday} />
      <Stat icon="gem" value={gems} color="#2F6BFF" onClick={() => go('quests')} />
      <Stat icon="heart" value={hearts} color="#FF4B6E" />
    </div>
  )
}

export function BottomNav() {
  const state = useGame()
  const { screen, go } = state
  const questsReady = dailyQuests(state).some((q) => q.progress(state) >= q.target && !isClaimed(state, q.id))
  const items: { id: 'path' | 'quests' | 'tutor' | 'profile'; icon: IconName; label: string }[] = [
    { id: 'path', icon: 'home', label: 'Landas' },
    { id: 'quests', icon: 'chest', label: 'Quests' },
    { id: 'tutor', icon: 'tutor', label: 'Tutor' },
    { id: 'profile', icon: 'medal', label: 'Ako' },
  ]
  return (
    <nav className="border-t-2 border-line bg-white grid grid-cols-4 safe-bottom px-2">
      {items.map((it) => {
        const on = screen === it.id
        return (
          <button key={it.id} type="button" onClick={() => go(it.id)} className="py-1.5 flex flex-col items-center gap-0.5 relative">
            <span className={`w-14 h-11 flex items-center justify-center rounded-2xl border-2 transition-colors ${on ? 'bg-sky-soft border-sky' : 'border-transparent'}`}>
              <Icon name={it.icon} size={30} style={on ? undefined : { filter: 'saturate(.75)' }} />
            </span>
            {it.id === 'quests' && questsReady && <span className="absolute top-1 right-4 w-3 h-3 rounded-full bg-heart border-2 border-white" />}
            <span className={`text-[10px] font-black uppercase tracking-wider ${on ? 'text-sky' : 'text-ink-soft'}`}>{it.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function ProgressBar({ value, color = 'var(--color-leaf)', height = 16, track = 'var(--color-line)' }: { value: number; color?: string; height?: number; track?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: track }}>
      <div className="h-full rounded-full transition-all duration-500 relative" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color, minWidth: value > 0 ? height : 0 }}>
        <div className="absolute left-[6px] right-[6px] rounded-full bg-white/35" style={{ top: Math.max(2, height * 0.2), height: Math.max(2, height * 0.22) }} />
      </div>
    </div>
  )
}

export function OfflineBadge({ ready }: { ready: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide pl-1 pr-2 py-0.5 rounded-full ${ready ? 'bg-leaf-soft text-leaf-dark' : 'bg-cloud text-ink-soft'}`}>
      <Icon name="shield" size={16} style={ready ? undefined : { filter: 'grayscale(1)' }} /> {ready ? '100% offline AI' : 'Offline mode'}
    </span>
  )
}

/** Speech bubble next to Pipo */
export function Bubble({ children, side = 'left', className = '' }: { children: ReactNode; side?: 'left' | 'top'; className?: string }) {
  return (
    <div className={`relative rounded-2xl border-2 border-line bg-white px-4 py-3 font-bold text-[17px] leading-snug ${className}`}>
      {children}
      {side === 'left' ? (
        <span className="absolute -left-[9px] top-6 w-4 h-4 rotate-45 bg-white border-l-2 border-b-2 border-line" />
      ) : (
        <span className="absolute left-8 -bottom-[9px] w-4 h-4 rotate-45 bg-white border-r-2 border-b-2 border-line" />
      )}
    </div>
  )
}

/** Bottom sheet */
export function Sheet({ open, onClose, children, bg = 'white' }: { open: boolean; onClose: () => void; children: ReactNode; bg?: string }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/35 animate-[fadein_.15s_ease]" onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 pb-8 safe-bottom max-h-[85%] overflow-y-auto no-scrollbar animate-[sheetup_.25s_cubic-bezier(.2,.9,.3,1.2)]" style={{ background: bg }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 w-10 h-1.5 rounded-full bg-black/10" />
        {children}
      </div>
    </div>
  )
}
