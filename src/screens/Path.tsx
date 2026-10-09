import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { WORLDS, type Stage, type World } from '../curriculum/worlds'
import { CHEST_GEMS, REFILL_COST, useGame } from '../store/game'
import { BottomNav, Button, ProgressBar, Sheet, TopStats } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { Tex } from '../lib/math'
import { sfx } from '../lib/sfx'
import { dailyQuests, isClaimed } from '../store/quests'

const offset = (i: number) => Math.round(Math.sin(i * 0.95) * 72)

type Item = { kind: 'stage'; stage: Stage; index: number } | { kind: 'chest'; id: string; after: number } | { kind: 'trophy' }

function worldItems(w: World): Item[] {
  const items: Item[] = []
  w.stages.forEach((stage, index) => {
    items.push({ kind: 'stage', stage, index })
    if (index === 2) items.push({ kind: 'chest', id: `${w.id}-chest`, after: index })
  })
  items.push({ kind: 'trophy' })
  return items
}

function StageNode({ world, stage, index, onOpen }: { world: World; stage: Stage; index: number; onOpen: () => void }) {
  const { completed, isUnlocked } = useGame()
  const done = completed[stage.id]
  const unlocked = isUnlocked(world.stages, index)
  const current = unlocked && !done
  const bg = done ? 'var(--color-sun)' : unlocked ? world.color : '#E5E0EA'
  const shadow = done ? 'var(--color-sun-dark)' : unlocked ? world.colorDark : '#CFC8D6'
  return (
    <div className={`relative flex flex-col items-center ${current ? 'mt-7' : ''}`}>
      {current && (
        <motion.div
          animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
          className="absolute -top-11 px-3 py-1.5 rounded-xl bg-white border-2 border-line font-black text-[13px] uppercase tracking-wide whitespace-nowrap z-10"
          style={{ color: world.color }}
        >
          Simulan
          <span className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r-2 border-b-2 border-line" />
        </motion.div>
      )}
      {current && (
        <svg className="absolute -top-[9px] pointer-events-none" width="96" height="92" viewBox="0 0 96 92">
          <ellipse cx="48" cy="46" rx="45" ry="42" fill="none" stroke="#E5E0EA" strokeWidth="7" />
          <ellipse cx="48" cy="46" rx="45" ry="42" fill="none" stroke={world.color} strokeWidth="7" strokeDasharray="60 400" strokeLinecap="round" transform="rotate(-90 48 46)" />
        </svg>
      )}
      <button
        type="button"
        onClick={() => { sfx.tap(); onOpen() }}
        aria-label={stage.title}
        className="relative w-[78px] h-[72px] rounded-[50%] flex items-center justify-center transition-transform active:translate-y-[6px]"
        style={{ background: bg, boxShadow: `0 7px 0 ${shadow}` }}
      >
        <span className="absolute top-2 left-4 w-6 h-2.5 rounded-full bg-white/35 -rotate-12" />
        {unlocked ? (
          <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-[inset_0_-3px_0_rgba(0,0,0,.08)]">
            <Icon name={stage.icon} size={32} />
          </span>
        ) : (
          <Icon name="lock" size={34} />
        )}
        {done && (
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-leaf border-[3px] border-white flex items-center justify-center">
            <Icon name="check" size={16} />
          </span>
        )}
      </button>
      {done && (
        <div className="mt-3 flex gap-0.5">
          {[0, 1, 2].map((i) => <Icon key={i} name={i < done.stars ? 'star' : 'starGrey'} size={16} />)}
        </div>
      )}
    </div>
  )
}

function ChestNode({ world, id, after, onOpened }: { world: World; id: string; after: number; onOpened: () => void }) {
  const { completed, openedChests, openChest } = useGame()
  const ready = !!completed[world.stages[after].id]
  const opened = openedChests.includes(id)
  return (
    <button
      type="button"
      aria-label="Treasure chest"
      onClick={() => { if (ready && !opened && openChest(id)) { sfx.complete(); onOpened() } }}
      className={`relative ${ready && !opened ? 'wiggle' : ''}`}
    >
      <Icon name={opened ? 'chestOpen' : 'chest'} size={64} style={ready ? undefined : { filter: 'grayscale(1)', opacity: 0.5 }} />
      <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-12 h-2.5 rounded-full bg-black/10 -z-10" />
    </button>
  )
}

function TrophyNode({ world }: { world: World }) {
  const { completed } = useGame()
  const done = world.stages.every((s) => completed[s.id])
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={done ? 'float' : ''}>
        <Icon name={done ? 'trophy' : 'trophy'} size={66} style={done ? undefined : { filter: 'grayscale(1)', opacity: 0.4 }} />
      </div>
      <span className={`text-[11px] font-black uppercase tracking-wider ${done ? 'text-sun-dark' : 'text-ink-soft/60'}`}>{done ? 'World complete!' : 'World trophy'}</span>
    </div>
  )
}

export function PathScreen() {
  const s = useGame()
  const { level, todayXp, dailyGoal, startLesson, isUnlocked, completed, hearts, gems, buyRefill, go } = s
  const [open, setOpen] = useState<{ world: World; stage: Stage; index: number } | null>(null)
  const [guide, setGuide] = useState<World | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const quests = dailyQuests(s)
  const questsDone = quests.filter((q) => q.progress(s) >= q.target).length
  const claimable = quests.some((q) => q.progress(s) >= q.target && !isClaimed(s, q.id))

  useEffect(() => { refs.current[level]?.scrollIntoView({ block: 'start' }) }, [level])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 1800); return () => clearTimeout(t) } }, [toast])

  return (
    <div className="h-full flex flex-col bg-white relative">
      <header className="px-3 py-2 border-b-2 border-line bg-white z-20">
        <TopStats />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* Daily goal + quests teaser */}
        <div className="px-4 pt-4 grid grid-cols-[1fr_auto] gap-3">
          <div className="rounded-2xl border-2 border-line p-3 flex items-center gap-3">
            <Icon name="target" size={34} />
            <div className="flex-1 min-w-0">
              <div className="font-black text-[15px] leading-tight">Daily goal</div>
              <div className="flex items-center gap-2 mt-1.5">
                <ProgressBar value={todayXp / dailyGoal} color="var(--color-sun)" height={12} />
                <span className="text-xs font-black text-ink-soft whitespace-nowrap">{Math.min(todayXp, dailyGoal)}/{dailyGoal}</span>
              </div>
            </div>
          </div>
          <button onClick={() => go('quests')} className={`rounded-2xl border-2 p-2 px-3 flex flex-col items-center justify-center ${claimable ? 'border-sun bg-sun-soft' : 'border-line'}`}>
            <span className={claimable ? 'wiggle' : ''}><Icon name="chest" size={30} /></span>
            <span className="text-[11px] font-black text-ink-soft">{questsDone}/{quests.length}</span>
          </button>
        </div>

        {WORLDS.map((w, wi) => {
          const doneCount = w.stages.filter((st) => completed[st.id]).length
          const items = worldItems(w)
          return (
            <section key={w.id} ref={(el) => { refs.current[w.id] = el as HTMLDivElement | null }} className="pt-4 pb-4 scroll-mt-2">
              {wi > 0 && (
                <div className="flex items-center gap-3 px-6 mb-4">
                  <div className="flex-1 h-0.5 bg-line" />
                  <span className="text-xs font-black uppercase tracking-wider text-ink-soft">{w.level}</span>
                  <div className="flex-1 h-0.5 bg-line" />
                </div>
              )}
              <div className="mx-4 rounded-2xl text-white flex items-stretch sticky top-2 z-10 overflow-hidden" style={{ background: w.color, boxShadow: `0 5px 0 ${w.colorDark}` }}>
                <div className="flex-1 min-w-0 p-3.5 pr-2">
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-85">World {wi + 1} · {doneCount}/{w.stages.length} stages</div>
                  <div className="text-[19px] font-black leading-tight truncate">{w.name}</div>
                  <div className="text-[11.5px] font-bold opacity-90 truncate">{w.curriculum}</div>
                </div>
                <button onClick={() => setGuide(w)} className="flex flex-col items-center justify-center gap-0.5 px-3.5 border-l-2 active:opacity-80" style={{ borderColor: w.colorDark + '55' }}>
                  <span className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center"><Icon name="book" size={24} /></span>
                  <span className="text-[10px] font-black uppercase tracking-wider">Gabay</span>
                </button>
              </div>

              <div className="relative flex flex-col items-center gap-8 pt-14 pb-4">
                {items.map((it, i) => (
                  <div key={i} style={{ transform: `translateX(${offset(i)}px)` }}>
                    {it.kind === 'stage' && <StageNode world={w} stage={it.stage} index={it.index} onOpen={() => setOpen({ world: w, stage: it.stage, index: it.index })} />}
                    {it.kind === 'chest' && <ChestNode world={w} id={it.id} after={it.after} onOpened={() => setToast(`+${CHEST_GEMS} gems!`)} />}
                    {it.kind === 'trophy' && <TrophyNode world={w} />}
                  </div>
                ))}
                <Pipo mood={wi % 2 ? 'read' : 'think'} size={92} className={`absolute top-40 ${wi % 2 ? 'right-2' : 'left-2'}`} />
              </div>
            </section>
          )
        })}
        <div className="flex flex-col items-center gap-2 pb-10 pt-2">
          <Icon name="lock" size={40} />
          <span className="text-ink-soft font-bold text-sm">Marami pang worlds ang darating!</span>
        </div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-sky text-white font-black flex items-center gap-2 shadow-[0_4px_0_var(--color-sky-dark)]">
            <Icon name="gem" size={22} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage sheet */}
      <Sheet open={!!open} onClose={() => setOpen(null)} bg={open?.world.color}>
        {open && (
          <div className="text-white">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,.15)]"><Icon name={open.stage.icon} size={44} /></span>
              <div>
                <div className="text-xs font-black uppercase tracking-wider opacity-85">Stage {open.index + 1} · {open.world.level}</div>
                <div className="text-2xl font-black leading-tight">{open.stage.title}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-black/10 p-3 mb-4 font-semibold text-[15px] flex gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider opacity-80 shrink-0 mt-0.5">Kasanayan</span>
              <span>{open.stage.competency}</span>
            </div>
            {!isUnlocked(open.world.stages, open.index) ? (
              <div className="rounded-2xl bg-white/20 p-3 font-bold flex items-center gap-2"><Icon name="lock" size={26} /> Tapusin muna ang naunang stage.</div>
            ) : hearts === 0 ? (
              <div className="space-y-2">
                <div className="rounded-2xl bg-white/20 p-3 font-bold flex items-center gap-2"><Icon name="heartBroken" size={28} /> Wala ka nang hearts.</div>
                <Button tone="white" className="w-full" disabled={gems < REFILL_COST} onClick={() => buyRefill()}>
                  <Icon name="heartPlus" size={22} /> Refill · <Icon name="gem" size={18} /> {REFILL_COST}
                </Button>
              </div>
            ) : (
              <Button tone="white" className="w-full" style={{ color: open.world.colorDark }} onClick={() => startLesson(open.stage.id)}>
                {completed[open.stage.id] ? 'Ulitin' : 'Simulan'} · +60 XP
              </Button>
            )}
          </div>
        )}
      </Sheet>

      {/* Guidebook */}
      <Sheet open={!!guide} onClose={() => setGuide(null)}>
        {guide && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Icon name="book" size={40} />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-ink-soft">Gabay · {guide.level}</div>
                <div className="text-xl font-black leading-tight">{guide.name}</div>
              </div>
            </div>
            <div className="space-y-3">
              {guide.guide.map((g, i) => (
                <div key={i} className="rounded-2xl border-2 border-line p-4">
                  <div className="font-black mb-1" style={{ color: guide.colorDark }}>{g.title}</div>
                  {g.tex && <div className="text-2xl my-2 text-center"><Tex tex={g.tex} /></div>}
                  <div className="font-semibold text-ink-soft text-[15px]">{g.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Sheet>

      <BottomNav />
    </div>
  )
}
