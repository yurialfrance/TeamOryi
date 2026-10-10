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

function Clock({ h, m }: { h: number; m: number }) {
  const hourA = ((h % 12) + m / 60) * 30 - 90, minA = m * 6 - 90
  const hand = (deg: number, len: number) => ({ x2: 50 + len * Math.cos((deg * Math.PI) / 180), y2: 50 + len * Math.sin((deg * Math.PI) / 180) })
  return (
    <svg viewBox="0 0 100 100" width={150} height={150} aria-label={`${h}:${String(m).padStart(2, '0')}`}>
      <circle cx="50" cy="50" r="46" fill="#FFF8FA" stroke="#FF8FB1" strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 - 90) * (Math.PI / 180)
        return <text key={i} x={50 + 36 * Math.cos(a)} y={50 + 36 * Math.sin(a) + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#3B2F4A">{i + 1}</text>
      })}
      <line x1="50" y1="50" {...hand(hourA, 22)} stroke="#3B2F4A" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="50" {...hand(minA, 32)} stroke="#FF4B6E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3.5" fill="#3B2F4A" />
    </svg>
  )
}

function BarGraph({ title, labels, values, unit }: { title: string; labels: string[]; values: number[]; unit?: string }) {
  const max = Math.max(...values)
  const step = max <= 10 ? 1 : max <= 20 ? 2 : max <= 50 ? 5 : 10
  const top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step).filter((_, i, a) => a.length <= 6 || i % 2 === 0)
  const W = 260, Hh = 150, L = 28, B = 22
  const bw = (W - L - 8) / labels.length
  return (
    <figure className="w-full max-w-[300px]">
      <figcaption className="text-center text-[12px] font-black text-ink-soft mb-1">{title}{unit ? ` (${unit})` : ''}</figcaption>
      <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full" aria-label={labels.map((l, i) => `${l}: ${values[i]}`).join(', ')}>
        {ticks.map((t) => {
          const y = Hh - B - (t / top) * (Hh - B - 8)
          return (
            <g key={t}>
              <line x1={L} x2={W - 4} y1={y} y2={y} stroke="#EDE6F2" strokeWidth="1" />
              <text x={L - 4} y={y + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="#7A6F85">{t}</text>
            </g>
          )
        })}
        {values.map((v, i) => {
          const h = (v / top) * (Hh - B - 8)
          const x = L + 4 + i * bw
          return (
            <g key={i}>
              <rect x={x + bw * 0.15} y={Hh - B - h} width={bw * 0.7} height={h} rx="3" fill={['#2F6BFF', '#FF8A1F', '#3DBE6B', '#E64A8A', '#9B5DE5', '#00A6A6'][i % 6]} />
              <text x={x + bw / 2} y={Hh - 8} textAnchor="middle" fontSize={Math.min(8.5, (bw * 0.95) / (labels[i].length * 0.56))} fontWeight="800" fill="#3B2F4A">{labels[i]}</text>
            </g>
          )
        })}
        <line x1={L} x2={L} y1={4} y2={Hh - B} stroke="#B7AEC0" strokeWidth="1.5" />
        <line x1={L} x2={W - 4} y1={Hh - B} y2={Hh - B} stroke="#B7AEC0" strokeWidth="1.5" />
      </svg>
    </figure>
  )
}

function DataTable({ rows }: { rows: string[][] }) {
  return (
    <table className="text-[14px] font-bold border-2 border-line rounded-xl overflow-hidden border-separate border-spacing-0 bg-white">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i === 0 ? 'bg-sky-soft text-ink' : i % 2 ? 'bg-white' : 'bg-cloud'}>
            {r.map((c, j) => (
              <td key={j} className={`px-3 py-1.5 ${i === 0 ? 'font-black text-[12px] uppercase tracking-wide' : ''} ${j > 0 ? 'text-center' : ''} ${/^■+$/.test(c) ? 'text-grape tracking-[0.2em]' : ''}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RightTriangle({ a, b, c, angle }: { a?: string; b?: string; c?: string; angle?: string }) {
  // right angle at bottom-right; a = bottom leg, b = right leg, c = hypotenuse; angle θ at bottom-left
  return (
    <svg viewBox="0 0 200 130" width={210} height={136} aria-label={`right triangle a=${a} b=${b} c=${c}`}>
      <path d="M20 110 L170 110 L170 20 Z" fill="#E6EEFF" stroke="#2F6BFF" strokeWidth="3" strokeLinejoin="round" />
      <path d="M156 110 L156 96 L170 96" fill="none" stroke="#2F6BFF" strokeWidth="2" />
      {a && <text x="95" y="126" textAnchor="middle" fontSize="14" fontWeight="800" fill="#3B2F4A">{a}</text>}
      {b && <text x="182" y="70" textAnchor="start" fontSize="14" fontWeight="800" fill="#3B2F4A">{b}</text>}
      {c && <text x="84" y="56" textAnchor="end" fontSize="14" fontWeight="800" fill="#E64A8A">{c}</text>}
      {angle && <><path d="M44 110 A24 24 0 0 0 40 98" fill="none" stroke="#FF8A1F" strokeWidth="2.5" /><text x="50" y="104" fontSize="13" fontWeight="800" fill="#FF8A1F">{angle}</text></>}
    </svg>
  )
}

function Polygon({ sides, label }: { sides: number; label?: string }) {
  if (sides === 0) return (
    <svg viewBox="0 0 100 100" width={120} height={120} aria-label="circle"><circle cx="50" cy="50" r="40" fill="#FFF0E0" stroke="#FF8A1F" strokeWidth="4" /></svg>
  )
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2 + (sides % 2 ? 0 : Math.PI / sides)
    return `${50 + 40 * Math.cos(a)},${52 + 40 * Math.sin(a)}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" width={120} height={120} aria-label={`${sides}-sided polygon`}>
      <polygon points={pts} fill="#FFF0E0" stroke="#FF8A1F" strokeWidth="4" strokeLinejoin="round" />
      {label && <text x="50" y="98" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3B2F4A">{label}</text>}
    </svg>
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
    case 'clock': return <Clock h={v.h} m={v.m} />
    case 'barGraph': return <BarGraph title={v.title} labels={v.labels} values={v.values} unit={v.unit} />
    case 'table': return <DataTable rows={v.rows} />
    case 'rightTriangle': return <RightTriangle a={v.a} b={v.b} c={v.c} angle={v.angle} />
    case 'polygon': return <Polygon sides={v.sides} label={v.label} />
  }
}
