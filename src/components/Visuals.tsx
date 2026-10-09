import type { Visual } from '../engine/types'
import { Tex } from '../lib/math'
import { Icon } from './Icon'

function Pizza({ num, den, size = 150 }: { num: number; den: number; size?: number }) {
  const r = 46, cx = 50, cy = 50
  const slices = Array.from({ length: den }, (_, i) => {
    const a0 = (i / den) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2
    const large = a1 - a0 > Math.PI ? 1 : 0
    const d = `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`
    return { d, on: i < num, mid: (a0 + a1) / 2 }
  })
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-label={`${num} of ${den} slices`}>
      <circle cx={cx} cy={cy} r={r + 3} fill="#E9B26B" />
      {slices.map((s, i) => (
        <g key={i}>
          <path d={s.d} fill={s.on ? '#FFC83D' : '#FFF3D6'} stroke="#C98A3D" strokeWidth="1.4" />
          {s.on && (
            <>
              <circle cx={cx + r * 0.55 * Math.cos(s.mid)} cy={cy + r * 0.55 * Math.sin(s.mid)} r="4" fill="#E2483D" />
              <circle cx={cx + r * 0.8 * Math.cos(s.mid + 0.12)} cy={cy + r * 0.8 * Math.sin(s.mid + 0.12)} r="2.6" fill="#E2483D" />
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

function Scale({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-6">
        <div className="px-4 py-2 rounded-xl bg-sky-soft border-2 border-sky text-xl font-bold min-w-20 text-center"><Tex tex={left} /></div>
        <div className="text-3xl font-black text-ink-soft pb-1">=</div>
        <div className="px-4 py-2 rounded-xl bg-sun-soft border-2 border-sun-dark text-xl font-bold min-w-20 text-center"><Tex tex={right} /></div>
      </div>
      <svg viewBox="0 0 200 40" width="220" height="40">
        <rect x="10" y="4" width="180" height="6" rx="3" fill="#7A6F85" />
        <path d="M100 10 L85 38 L115 38 Z" fill="#7A6F85" />
      </svg>
    </div>
  )
}

function Sequence({ items }: { items: (string | null)[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map((it, i) => (
        <div
          key={i}
          className={`min-w-12 h-12 px-2 rounded-xl flex items-center justify-center text-xl font-black border-2 ${
            it === null ? 'border-dashed border-grape text-grape bg-[#F2EAFD]' : 'border-line bg-white'
          }`}
        >
          {it === null ? '?' : it}
        </div>
      ))}
    </div>
  )
}

export function VisualView({ v }: { v: Visual }) {
  switch (v.type) {
    case 'pizza': return <Pizza num={v.num} den={v.den} />
    case 'bar':
      return (
        <div className="flex w-64 h-10 rounded-lg overflow-hidden border-2 border-ink/30">
          {Array.from({ length: v.den }, (_, i) => <div key={i} className={`flex-1 border-r border-ink/20 ${i < v.num ? 'bg-sun' : 'bg-white'}`} />)}
        </div>
      )
    case 'scale': return <Scale left={v.left} right={v.right} />
    case 'sequence': return <Sequence items={v.items} />
    case 'scene':
      return (
        <div className="flex flex-wrap justify-center gap-2 px-4 py-2 rounded-3xl bg-cloud">
          {v.icons.map((ic, i) => <span key={i} className="float" style={{ animationDelay: `${i * 0.15}s` }}><Icon name={ic} size={v.icons.length > 3 ? 44 : 64} /></span>)}
        </div>
      )
  }
}
