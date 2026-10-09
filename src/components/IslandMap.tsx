// Island-style learning map (inspired by isometric "world map" lesson paths).
import { motion } from 'motion/react'
import type { SoonWorld, Stage, World } from '../curriculum/worlds'
import { useGame } from '../store/game'
import { Icon } from './Icon'
import { Pipo } from './Pipo'
import { sfx } from '../lib/sfx'

const H = 430 // island height (px)
// Node layout (x in %, y in px) — snake path from bottom-left up to the trophy
const POS = {
  s: [
    { x: 17, y: 360 },
    { x: 22, y: 262 },
    { x: 45, y: 205 },
    { x: 80, y: 172 },
    { x: 60, y: 78 },
  ],
  chest: { x: 72, y: 288 },
  trophy: { x: 22, y: 64 },
}
const ROUTE = [POS.s[0], POS.s[1], POS.s[2], POS.chest, POS.s[3], POS.s[4], POS.trophy]
const fx = (x: number, flip: boolean) => (flip ? 100 - x : x)
const pct = (x: number, flip: boolean) => `${fx(x, flip)}%`

const GRASS = { top: '#55DCC8', top2: '#3FCDB8', side: '#24A898', side2: '#1B8C7F', road: '#C9F7EC', roadEdge: '#9BE8D7' }

function Tree({ x, y, s = 1 }: { x: string; y: number; s?: number }) {
  return (
    <svg className="absolute pointer-events-none" style={{ left: x, top: y, width: 34 * s, height: 44 * s }} viewBox="0 0 34 44" aria-hidden>
      <ellipse cx="17" cy="41" rx="11" ry="3" fill="#000" opacity=".12" />
      <rect x="15" y="30" width="4" height="9" rx="2" fill="#7A5236" />
      <path d="M17 2 C8 12 4 20 5 27 C6 33 28 33 29 27 C30 20 26 12 17 2Z" fill="#1F9F8D" />
      <path d="M17 2 C26 12 30 20 29 27 C28.5 31 22 32.5 17 32.5Z" fill="#178576" />
      <path d="M17 3 C13 8 10.5 12 10 15 C13 13.5 21 13.5 24 15 C23.5 12 21 8 17 3Z" fill="#fff" opacity=".85" />
    </svg>
  )
}

function House({ x, y }: { x: string; y: number }) {
  return (
    <svg className="absolute pointer-events-none" style={{ left: x, top: y, width: 70, height: 66 }} viewBox="0 0 70 66" aria-hidden>
      <ellipse cx="35" cy="61" rx="28" ry="5" fill="#000" opacity=".12" />
      <rect x="12" y="28" width="46" height="30" rx="4" fill="#FFF4E6" />
      <rect x="35" y="28" width="23" height="30" rx="3" fill="#F2DFC6" />
      <path d="M6 31 35 8l29 23c1.5 1.2.6 3.5-1.3 3.5H7.3C5.4 34.5 4.5 32.2 6 31Z" fill="#8C7CF0" />
      <path d="M35 8l29 23c1.5 1.2.6 3.5-1.3 3.5H35Z" fill="#6E5DE0" />
      <rect x="27" y="39" width="14" height="19" rx="7" fill="#FFB547" />
      <rect x="45" y="38" width="8" height="8" rx="2" fill="#9ED8FF" />
    </svg>
  )
}

function Pond({ x, y }: { x: string; y: number }) {
  return (
    <svg className="absolute pointer-events-none" style={{ left: x, top: y, width: 86, height: 48 }} viewBox="0 0 86 48" aria-hidden>
      <ellipse cx="43" cy="28" rx="40" ry="17" fill="#2FB4E6" />
      <ellipse cx="43" cy="25" rx="36" ry="14" fill="#7FD8FF" />
      <ellipse cx="30" cy="21" rx="10" ry="3" fill="#fff" opacity=".7" />
      <circle cx="58" cy="24" r="4" fill="#3DBE6B" /><circle cx="64" cy="27" r="3" fill="#3DBE6B" />
    </svg>
  )
}

function Road({ flip }: { flip: boolean }) {
  // drawn in a 100×H viewBox; x is %, so use preserveAspectRatio="none" and non-scaling stroke
  const d = ROUTE.map((p, i) => `${i ? 'L' : 'M'}${fx(p.x, flip)} ${p.y}`).join(' ')
  return (
    <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: H }} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={GRASS.roadEdge} strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke={GRASS.road} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Flag({ color }: { color: string }) {
  return (
    <svg className="absolute -top-7 -left-1 pointer-events-none" width="26" height="34" viewBox="0 0 26 34" aria-hidden>
      <rect x="3" y="2" width="2.6" height="30" rx="1.3" fill="#fff" />
      <path d="M5.6 3h16l-4 5.5 4 5.5h-16Z" fill={color} />
      <circle cx="4.3" cy="2.5" r="2.5" fill="#FFC83D" />
    </svg>
  )
}

function StageNode({ world, stage, index, onOpen, flip }: { world: World; stage: Stage; index: number; onOpen: () => void; flip: boolean }) {
  const { completed, isUnlocked } = useGame()
  const done = completed[stage.id]
  const unlocked = isUnlocked(world.stages, index)
  const current = unlocked && !done
  const p = POS.s[index]
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 z-[2]" style={{ left: pct(p.x, flip), top: p.y }}>
      {current && (
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
          className="absolute left-1/2 -translate-x-1/2 -top-[64px] w-[54px] h-[54px] rounded-full bg-white border-[3px] flex items-center justify-center overflow-hidden shadow-[0_4px_0_rgba(0,0,0,.15)]"
          style={{ borderColor: world.color }}>
          <Pipo mood="backpack" size={50} />
        </motion.div>
      )}
      {current && <span className="absolute inset-[-8px] rounded-full pulse-ring pointer-events-none" />}
      {done && <Flag color={world.color} />}
      <button
        type="button"
        onClick={() => { sfx.tap(); onOpen() }}
        aria-label={stage.title}
        className="relative w-[58px] h-[52px] rounded-[50%] flex items-center justify-center font-black text-[22px] transition-transform active:translate-y-[5px]"
        style={{
          background: unlocked ? (current ? '#FFFFFF' : '#E9F4FF') : 'rgba(255,255,255,.55)',
          boxShadow: unlocked ? `0 6px 0 ${current ? world.colorDark : '#9DBEDD'}` : '0 6px 0 rgba(0,0,0,.12)',
          color: current ? world.color : '#3F7BDB',
          border: current ? `3px solid ${world.color}` : 'none',
        }}
      >
        <span className="absolute top-1.5 left-3 w-5 h-2 rounded-full bg-white/80 -rotate-12" />
        {unlocked ? index + 1 : <Icon name="lock" size={26} />}
      </button>
      {done && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 flex gap-px">
          {[0, 1, 2].map((i) => <Icon key={i} name={i < done.stars ? 'star' : 'starGrey'} size={14} />)}
        </div>
      )}
    </div>
  )
}

function ChestTile({ world, onOpened, flip }: { world: World; onOpened: () => void; flip: boolean }) {
  const { completed, openedChests, openChest } = useGame()
  const id = `${world.id}-chest`
  const ready = !!completed[world.stages[2].id]
  const opened = openedChests.includes(id)
  return (
    <button
      type="button"
      aria-label="Treasure chest"
      onClick={() => { if (ready && !opened && openChest(id)) { sfx.chest(); onOpened() } }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-[2]"
      style={{ left: pct(POS.chest.x, flip), top: POS.chest.y }}
    >
      <span className="block w-[64px] h-[58px] rounded-2xl" style={{ background: '#7BE6D3', boxShadow: `0 8px 0 ${GRASS.side}` }} />
      <span className={`absolute inset-0 flex items-center justify-center -translate-y-2 ${ready && !opened ? 'wiggle' : ''}`}>
        <Icon name={opened ? 'chestOpen' : 'chest'} size={46} style={ready ? undefined : { filter: 'grayscale(.8)', opacity: 0.7 }} />
      </span>
    </button>
  )
}

function TrophyIslet({ world, flip }: { world: World; flip: boolean }) {
  const { completed } = useGame()
  const done = world.stages.every((s) => completed[s.id])
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 z-[2] flex flex-col items-center" style={{ left: pct(POS.trophy.x, flip), top: POS.trophy.y }}>
      <div className={done ? 'float' : ''}>
        <Icon name="trophy" size={58} style={done ? undefined : { filter: 'grayscale(1)', opacity: 0.55 }} />
      </div>
      <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${done ? 'bg-sun text-ink' : 'bg-white/60 text-ink-soft'}`}>
        {done ? 'Tapos!' : 'Trophy'}
      </span>
    </div>
  )
}

/** Five-star rating row (filled proportionally) */
function StarRow({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => <Icon key={i} name={i < value ? 'star' : 'starGrey'} size={17} />)}
    </span>
  )
}

/** Glassy summary card, like a "综合评价" score card */
export function WorldCard({ world, index, onGuide }: { world: World; index: number; onGuide: () => void }) {
  const { completed } = useGame()
  const done = world.stages.filter((s) => completed[s.id]).length
  const stars = world.stages.reduce((a, s) => a + (completed[s.id]?.stars ?? 0), 0)
  return (
    <div className="relative mx-4 rounded-[22px] bg-white/95 border-[3px] border-[#DCE4FF] shadow-[0_8px_24px_rgba(40,30,120,.25)] p-3 pr-2 flex gap-3 z-[3]">
      <div className="flex-1 min-w-0">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-[11px] font-black uppercase tracking-wide" style={{ background: world.color }}>
          <Icon name={world.icon} size={14} white /> World {index + 1} · {world.level}
        </span>
        <div className="text-[18px] font-black leading-tight mt-1 truncate">{world.name}</div>
        <div className="mt-1.5 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-[12px] font-bold text-ink-soft">
          <span>Stages</span><StarRow value={done} />
          <span>Galing</span><StarRow value={Math.round((stars / (world.stages.length * 3)) * 5)} />
        </div>
      </div>
      <button onClick={onGuide} className="shrink-0 w-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 active:translate-y-0.5" style={{ borderColor: world.soft, background: world.soft }}>
        <Icon name="book" size={30} />
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: world.colorDark }}>Gabay</span>
      </button>
    </div>
  )
}

export function Island({ world, flip, onOpenStage, onChest }: { world: World; flip: boolean; onOpenStage: (s: Stage, i: number) => void; onChest: () => void }) {
  return (
    <div className="relative mx-3 -mt-5" style={{ height: H + 40 }}>
      {/* main island body with cliff side */}
      <div className="absolute left-0 right-0 top-6 rounded-[44px]"
        style={{ height: H - 20, background: `linear-gradient(165deg, ${GRASS.top} 0%, ${GRASS.top2} 100%)`, boxShadow: `0 20px 0 ${GRASS.side}, 0 34px 0 ${GRASS.side2}, 0 46px 40px rgba(20,10,80,.35)` }} />
      {/* bays for an organic outline */}
      <div className="absolute top-[120px] w-[90px] h-[110px] rounded-[40px]" style={{ [flip ? 'left' : 'right']: -6, background: GRASS.top2, boxShadow: `0 16px 0 ${GRASS.side}` }} />
      <div className="absolute top-[-6px] w-[120px] h-[70px] rounded-[36px]" style={{ left: flip ? '42%' : '30%', background: GRASS.top }} />
      <Road flip={flip} />
      <Tree x={pct(4, flip)} y={130} /><Tree x={pct(9, flip)} y={150} s={0.8} /><Tree x={pct(84, flip)} y={250} /><Tree x={pct(90, flip)} y={276} s={0.85} />
      <Tree x={pct(38, flip)} y={300} s={0.9} /><Tree x={pct(70, flip)} y={20} s={0.9} /><Tree x={pct(78, flip)} y={36} s={0.75} />
      <House x={pct(flip ? 88 : 70, flip)} y={340} />
      <Pond x={pct(flip ? 56 : 34, flip)} y={92} />
      <TrophyIslet world={world} flip={flip} />
      <ChestTile world={world} onOpened={onChest} flip={flip} />
      {world.stages.map((s, i) => <StageNode key={s.id} world={world} stage={s} index={i} flip={flip} onOpen={() => onOpenStage(s, i)} />)}
    </div>
  )
}

export function SoonIsland({ soon }: { soon: SoonWorld }) {
  return (
    <div className="relative mx-4 my-6">
      <div className="rounded-[32px] p-4 pb-5 border-[3px] border-dashed border-white/50"
        style={{ background: 'linear-gradient(165deg, rgba(255,255,255,.28), rgba(255,255,255,.12))', boxShadow: '0 14px 0 rgba(255,255,255,.12)' }}>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shrink-0"><Icon name="lock" size={30} /></span>
          <div className="flex-1 min-w-0 text-white">
            <div className="text-[11px] font-black uppercase tracking-wider opacity-80">{soon.level}</div>
            <div className="text-lg font-black leading-tight">{soon.name}</div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-sun text-ink text-[10px] font-black uppercase tracking-wider shadow-[0_2px_0_var(--color-sun-dark)]">Coming soon</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {soon.topics.map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-full bg-white/85 text-[12px] font-bold text-ink-soft">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Sky backdrop with soft clouds */
export const SKY: React.CSSProperties = {
  background:
    'radial-gradient(120px 50px at 12% 8%, rgba(255,255,255,.22), transparent 70%),' +
    'radial-gradient(160px 60px at 88% 22%, rgba(255,255,255,.18), transparent 70%),' +
    'radial-gradient(140px 50px at 20% 55%, rgba(255,255,255,.14), transparent 70%),' +
    'radial-gradient(180px 60px at 80% 78%, rgba(255,255,255,.16), transparent 70%),' +
    'linear-gradient(180deg, #7B6CF6 0%, #6A7CF4 45%, #5B8DEF 100%)',
}
