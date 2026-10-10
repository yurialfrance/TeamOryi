import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import confetti from 'canvas-confetti'
import { WORLDS, type Stage, type World } from '../curriculum/worlds'
import { CHEST_GEMS, REFILL_COST, useGame } from '../store/game'
import { BottomNav, Button, ProgressBar, Sheet, TopStats } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { Tex } from '../lib/math'
import { dailyQuests, isClaimed } from '../store/quests'
import { Island, SKY, WorldCard } from '../components/IslandMap'

export function PathScreen() {
  const s = useGame()
  const { level, todayXp, dailyGoal, startLesson, startLearn, isUnlocked, completed, hearts, gems, buyRefill, go } = s
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(level || WORLDS[0].id)
  const [open, setOpen] = useState<{ world: World; stage: Stage; index: number } | null>(null)
  const [guide, setGuide] = useState<World | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [trophyClaimedWorld, setTrophyClaimedWorld] = useState<World | null>(null)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const quests = dailyQuests(s)
  const questsDone = quests.filter((q) => q.progress(s) >= q.target).length
  const claimable = quests.some((q) => q.progress(s) >= q.target && !isClaimed(s, q.id))

  const prevLevelRef = useRef(level)
  useEffect(() => {
    if (level !== prevLevelRef.current) {
      prevLevelRef.current = level
      setSelectedWorldId(level)
    }
  }, [level])

  useEffect(() => {
    if (selectedWorldId) {
      refs.current[selectedWorldId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedWorldId])

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 1800); return () => clearTimeout(t) } }, [toast])

  const handleToggleWorld = (worldId: string) => {
    setSelectedWorldId((curr) => {
      const next = curr === worldId ? null : worldId
      if (next) s.set({ level: worldId })
      return next
    })
  }

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

        {WORLDS.map((w, wi) => {
          const isOpen = selectedWorldId === w.id
          const firstSampler = w.tier === 'sampler' && WORLDS[wi - 1]?.tier !== 'sampler'
          return (
            <section key={w.id} ref={(el) => { refs.current[w.id] = el as HTMLDivElement | null }} className="relative pt-4 scroll-mt-2">
              {firstSampler && (
                <div className="mx-4 mb-3 mt-4 rounded-2xl bg-white/20 border-2 border-white/30 px-4 py-3 text-white">
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-85">Pasilip sa susunod na antas</div>
                  <div className="font-black text-[15px] leading-snug">Senior High at College — subukan kahit hindi ka pa doon</div>
                </div>
              )}
              <WorldCard
                world={w}
                index={wi}
                isOpen={isOpen}
                onToggle={() => handleToggleWorld(w.id)}
                onGuide={() => setGuide(w)}
              />
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden pb-4"
                  >
                    <Island
                      world={w}
                      flip={wi % 2 === 1}
                      onOpenStage={(st, i) => setOpen({ world: w, stage: st, index: i })}
                      onChest={() => setToast(`+${CHEST_GEMS} gems!`)}
                      onTrophyClaim={(claimedWorld) => {
                        confetti({ particleCount: 90, spread: 80, origin: { y: 0.4 } })
                        setToast('+50 gems!')
                        setTrophyClaimedWorld(claimedWorld)
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )
        })}
        <div className="flex flex-col items-center gap-2 pb-10 pt-6">
          <Pipo mood="bye" size={110} />
          <span className="text-white font-black text-sm text-center px-8 drop-shadow">Grade 1 hanggang Grade 10, pati SHS at College — lahat bukas. Pumili ka lang ng isla!</span>
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
            ) : completed[open.stage.id] ? (
              <Button tone="white" className="w-full" style={{ color: open.world.colorDark }} onClick={() => startLesson(open.stage.id)}>
                Ulitin · +60 XP
              </Button>
            ) : (
              <Button tone="white" className="w-full" style={{ color: open.world.colorDark }} onClick={() => startLearn(open.stage.id)}>
                <Icon name="bulb" size={22} /> Matuto muna
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
              {guide.stages.flatMap((st, si) => st.guide.map((g, i) => (
                <div key={`${st.id}-${i}`} className="rounded-2xl border-2 border-line p-4">
                  {i === 0 && (
                    <div className="text-[11px] font-black uppercase tracking-wider text-ink-soft mb-1 flex items-center gap-1.5">
                      <Icon name={st.icon} size={16} /> Stage {si + 1} · {st.title}
                    </div>
                  )}
                  <div className="font-black mb-1" style={{ color: guide.colorDark }}>{g.title}</div>
                  {g.tex && (
                    <div className="w-full overflow-x-auto no-scrollbar my-2 px-1 flex justify-center items-center">
                      <div className="text-xl sm:text-2xl font-bold text-center inline-block max-w-full">
                        <Tex tex={g.tex} />
                      </div>
                    </div>
                  )}
                  <div className="font-semibold text-ink-soft text-[15px]">{g.text}</div>
                </div>
              )))}
            </div>
          </div>
        )}
      </Sheet>

      {/* Trophy Reward Claim Modal */}
      <Sheet open={!!trophyClaimedWorld} onClose={() => setTrophyClaimedWorld(null)} bg={trophyClaimedWorld?.color}>
        {trophyClaimedWorld && (
          <div className="text-white text-center flex flex-col items-center">
            <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12 }}>
              <Pipo mood="trophy" size={130} />
            </motion.div>
            <div className="text-xs font-black uppercase tracking-wider opacity-90 mt-2">World Completed! · {trophyClaimedWorld.level}</div>
            <div className="text-2xl font-black mt-1 leading-tight">{trophyClaimedWorld.name}</div>
            <p className="text-sm font-semibold opacity-90 mt-2 px-3">
              Magaling! Nakumpleto mo ang lahat ng mga aralin sa mundong ito at nakuha mo ang iyong gintong tropeo!
            </p>
            <div className="my-4 px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center gap-2 border-2 border-white/30">
              <Icon name="gem" size={28} />
              <span className="text-xl font-black">+50 Premyong Gems!</span>
            </div>
            <Button tone="white" className="w-full text-ink font-black mt-2" onClick={() => setTrophyClaimedWorld(null)}>
              Kahanga-hanga! Ipagpatuloy
            </Button>
          </div>
        )}
      </Sheet>

      <BottomNav />
    </div>
  )
}
