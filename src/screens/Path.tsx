import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ROADMAP, WORLDS, type Stage, type World } from '../curriculum/worlds'
import { CHEST_GEMS, REFILL_COST, useGame } from '../store/game'
import { BottomNav, Button, ProgressBar, Sheet, TopStats } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { Tex } from '../lib/math'
import { dailyQuests, isClaimed } from '../store/quests'
import { Island, SKY, SoonIsland, WorldCard } from '../components/IslandMap'

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

      <main className="flex-1 overflow-y-auto no-scrollbar" style={SKY}>
        {/* Daily goal + quests teaser */}
        <div className="px-4 pt-4 grid grid-cols-[1fr_auto] gap-3">
          <div className="rounded-2xl bg-white p-3 flex items-center gap-3 shadow-[0_4px_0_rgba(40,30,120,.25)]">
            <Icon name="target" size={34} />
            <div className="flex-1 min-w-0">
              <div className="font-black text-[15px] leading-tight">Daily goal</div>
              <div className="flex items-center gap-2 mt-1.5">
                <ProgressBar value={todayXp / dailyGoal} color="var(--color-sun)" height={12} />
                <span className="text-xs font-black text-ink-soft whitespace-nowrap">{Math.min(todayXp, dailyGoal)}/{dailyGoal}</span>
              </div>
            </div>
          </div>
          <button onClick={() => go('quests')} className={`rounded-2xl p-2 px-3 flex flex-col items-center justify-center shadow-[0_4px_0_rgba(40,30,120,.25)] ${claimable ? 'bg-sun' : 'bg-white'}`}>
            <span className={claimable ? 'wiggle' : ''}><Icon name="chest" size={30} /></span>
            <span className="text-[11px] font-black text-ink-soft">{questsDone}/{quests.length}</span>
          </button>
        </div>

        {ROADMAP.map((item, ri) => {
          if (item.kind === 'soon') return <SoonIsland key={item.soon.id} soon={item.soon} />
          const w = item.world
          const wi = WORLDS.indexOf(w)
          return (
            <section key={w.id} ref={(el) => { refs.current[w.id] = el as HTMLDivElement | null }} className="relative pt-6 scroll-mt-2">
              <WorldCard world={w} index={wi} onGuide={() => setGuide(w)} />
              <Island world={w} flip={ri % 2 === 1} onOpenStage={(st, i) => setOpen({ world: w, stage: st, index: i })} onChest={() => setToast(`+${CHEST_GEMS} gems!`)} />
            </section>
          )
        })}
        <div className="flex flex-col items-center gap-2 pb-10 pt-6">
          <Pipo mood="bye" size={110} />
          <span className="text-white font-black text-sm text-center px-8 drop-shadow">Marami pang worlds ang darating! Abangan.</span>
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
                <Button tone="white" className="w-full" style={{ color: open.world.colorDark }} onClick={() => startLesson(open.stage.id, true)}>
                  Mag-practice para sa hearts
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
