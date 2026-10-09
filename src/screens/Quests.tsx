import { useState } from 'react'
import { motion } from 'motion/react'
import { useGame } from '../store/game'
import { dailyQuests, isClaimed } from '../store/quests'
import { BottomNav, TopStats } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { sfx } from '../lib/sfx'

function hoursLeft() {
  const now = new Date()
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 3_600_000))
}

const Sparkle = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`absolute ${className}`} aria-hidden>
    <path d="M12 1c.8 6 3 8.2 11 11-8 2.8-10.2 5-11 11-.8-6-3-8.2-11-11 8-2.8 10.2-5 11-11Z" fill="#fff" />
  </svg>
)

export function QuestsScreen() {
  const s = useGame()
  const quests = dailyQuests(s)
  const [flash, setFlash] = useState<number | null>(null)
  const ready = quests.filter((q) => q.progress(s) >= q.target && !isClaimed(s, q.id))
  const allDone = quests.every((q) => q.progress(s) >= q.target)

  const claim = (ids: string[]) => {
    let total = 0
    for (const q of quests) if (ids.includes(q.id)) { s.claimQuest(q.id, q.gems); total += q.gems }
    if (total) { sfx.chest(); setFlash(total) }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-3 py-2 border-b-2 border-line bg-white"><TopStats /></header>
      <main className="flex-1 overflow-y-auto no-scrollbar relative"
        style={{ background: 'repeating-linear-gradient(135deg, #FFC83D 0 60px, #FFD15C 60px 120px)' }}>
        <Sparkle className="w-6 top-6 left-8" />
        <Sparkle className="w-4 top-24 right-10" />
        <Sparkle className="w-5 top-40 left-[46%]" />

        <div className="px-5 pt-7 pb-4 text-center relative">
          <Pipo mood={allDone ? 'trophy' : 'calendar'} size={120} className="mx-auto" />
          <h1 className="text-white text-[30px] font-black leading-tight drop-shadow-[0_2px_0_rgba(180,120,0,.5)]">
            {allDone ? 'All Daily Quests complete!' : 'Daily Quests'}
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-[#8A5A00] bg-white/60 rounded-full px-3 py-1">
            <Icon name="clock" size={18} /> {hoursLeft()} oras na lang
          </div>
        </div>

        <div className="mx-4 rounded-[26px] bg-white shadow-[0_8px_0_rgba(200,140,0,.35)] overflow-hidden">
          {quests.map((q, i) => {
            const p = Math.min(q.progress(s), q.target)
            const done = p >= q.target
            const claimed = isClaimed(s, q.id)
            return (
              <div key={q.id} className={`flex items-center gap-3 px-4 py-4 ${i ? 'border-t-2 border-[#F3EEF7]' : ''}`}>
                <span className="w-12 h-12 shrink-0 flex items-center justify-center"><Icon name={q.icon} size={42} /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-[16px] leading-tight mb-2">{q.title}</div>
                  <div className="relative h-[26px] rounded-full bg-[#F1ECDF] overflow-visible">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p / q.target) * 100}%` }} transition={{ duration: 0.6 }}
                      className="absolute left-0 top-0 h-full rounded-full bg-sun" style={{ minWidth: p ? 26 : 0 }}>
                      <span className="absolute left-3 right-3 top-[5px] h-[5px] rounded-full bg-white/45" />
                    </motion.div>
                    <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-[#B07A00]">{p} / {q.target}</span>
                    <button
                      disabled={!done || claimed}
                      onClick={() => claim([q.id])}
                      aria-label="Claim chest"
                      className={`absolute -right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center ${done && !claimed ? 'bg-sun shadow-[0_3px_0_var(--color-sun-dark)] wiggle' : 'bg-[#FFE7A3]'}`}
                    >
                      <Icon name={claimed ? 'chestOpen' : 'chest'} size={32} style={claimed ? { opacity: 0.6 } : undefined} />
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] font-black text-sky flex items-center gap-0.5">+{q.gems} <Icon name="gem" size={12} /></div>
                </div>
              </div>
            )
          })}
        </div>

        {flash !== null && (
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mx-4 mt-4 rounded-2xl bg-white p-3 flex items-center justify-center gap-2 font-black text-sky shadow-[0_4px_0_rgba(200,140,0,.35)]">
            <Icon name="gem" size={28} /> +{flash} gems! Gamitin pang-refill ng hearts.
          </motion.div>
        )}

        <div className="px-4 pt-5 pb-8">
          <button
            disabled={ready.length === 0}
            onClick={() => claim(ready.map((q) => q.id))}
            className="btn3d w-full h-14 bg-white text-[#E59A00] text-lg uppercase disabled:opacity-70"
            style={{ ['--shadow' as string]: 'rgba(200,140,0,.45)' }}
          >
            {ready.length ? `Claim reward${ready.length > 1 ? 's' : ''}` : allDone ? 'Na-claim na lahat!' : 'Tapusin ang quests'}
          </button>
          <div className="mt-3 text-center text-sm font-black text-[#8A5A00] flex items-center justify-center gap-1">
            <Icon name="gem" size={18} /> {s.gems} gems
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
