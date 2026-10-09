import { useState } from 'react'
import { motion } from 'motion/react'
import { useGame } from '../store/game'
import { dailyQuests, isClaimed } from '../store/quests'
import { BottomNav, Button, ProgressBar, TopStats } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { sfx } from '../lib/sfx'

function hoursLeft() {
  const now = new Date()
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 3_600_000))
}

export function QuestsScreen() {
  const s = useGame()
  const quests = dailyQuests(s)
  const [justClaimed, setJustClaimed] = useState<string | null>(null)

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-3 py-2 border-b-2 border-line bg-white"><TopStats /></header>
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="bg-grape text-white px-5 pt-5 pb-6 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute right-16 -top-10 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[11px] font-black uppercase tracking-wider opacity-85">Daily Quests</div>
              <div className="text-2xl font-black leading-tight">Tapusin ang quests para sa gems!</div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-black bg-black/15 rounded-full px-3 py-1">
                <Icon name="clock" size={18} /> {hoursLeft()} oras na lang
              </div>
            </div>
            <Pipo mood="flame" size={100} />
          </div>
        </div>

        <div className="px-4 py-5 space-y-3">
          {quests.map((q) => {
            const p = Math.min(q.progress(s), q.target)
            const done = p >= q.target
            const claimed = isClaimed(s, q.id)
            return (
              <motion.div key={q.id} layout className={`rounded-2xl border-2 p-4 flex items-center gap-3 ${done && !claimed ? 'border-sun bg-sun-soft' : 'border-line'}`}>
                <span className="w-12 h-12 rounded-xl bg-cloud flex items-center justify-center shrink-0"><Icon name={q.icon} size={32} /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-black leading-tight mb-2">{q.title}</div>
                  <div className="relative">
                    <ProgressBar value={p / q.target} color="var(--color-sun)" height={18} />
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-ink/70">{p} / {q.target}</span>
                  </div>
                </div>
                {claimed ? (
                  <Icon name="chestOpen" size={40} style={{ opacity: 0.6 }} />
                ) : done ? (
                  <button
                    onClick={() => { s.claimQuest(q.id, q.gems); sfx.chest(); setJustClaimed(q.id) }}
                    className="btn3d bg-sun text-ink px-3 py-2 text-sm flex flex-col items-center wiggle"
                    style={{ ['--shadow' as string]: 'var(--color-sun-dark)' }}
                  >
                    <Icon name="chest" size={30} />
                    <span className="flex items-center gap-0.5 text-xs">+{q.gems}<Icon name="gem" size={14} /></span>
                  </button>
                ) : (
                  <span className="flex flex-col items-center opacity-80">
                    <Icon name="chest" size={36} />
                    <span className="flex items-center gap-0.5 text-xs font-black text-sky">+{q.gems}<Icon name="gem" size={12} /></span>
                  </span>
                )}
              </motion.div>
            )
          })}

          {justClaimed && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-sky-soft border-2 border-sky p-3 flex items-center gap-3 font-black text-sky">
              <Icon name="gem" size={28} /> Nakuha mo ang gems! Gamitin pang-refill ng hearts.
            </motion.div>
          )}

          <div className="rounded-2xl border-2 border-line p-4 flex items-center gap-3">
            <Icon name="gem" size={40} />
            <div className="flex-1">
              <div className="font-black">{s.gems} gems</div>
              <div className="text-sm font-semibold text-ink-soft">Kumuha ng gems sa quests at treasure chests sa landas.</div>
            </div>
          </div>
          <Button tone="sky" className="w-full" onClick={() => s.go('path')}>Bumalik sa landas</Button>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
