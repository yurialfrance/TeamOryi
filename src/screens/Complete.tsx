import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { REFILL_COST, useGame } from '../store/game'
import { findStage } from '../curriculum/worlds'
import { Pipo } from '../components/Pipo'
import { Button } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'
import { sfx } from '../lib/sfx'
import { completeEvents, pickLine, sayLines, stopVoice } from '../lib/voice'
import { ACHIEVEMENTS } from '../store/quests'

function useCountUp(to: number, delay = 0, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / ms))
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, delay, ms])
  return v
}

function StatCard({ label, value, color, icon, delay }: { label: string; value: string; color: string; icon: IconName; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 260, damping: 18 }}
      className="flex-1 rounded-2xl border-2 overflow-hidden" style={{ borderColor: color, background: color }}>
      <div className="text-[11px] font-black uppercase tracking-wider text-white text-center py-1">{label}</div>
      <div className="bg-white rounded-t-xl py-3 flex items-center justify-center gap-1.5 text-xl font-black" style={{ color }}>
        <Icon name={icon} size={24} /> {value}
      </div>
    </motion.div>
  )
}

export function CompleteScreen() {
  const { result, streak, go, buyRefill, startLesson, gems } = useGame()
  const found = result ? findStage(result.stageId) : null
  const xp = useCountUp(result?.xp ?? 0, 300)
  const accTarget = result ? Math.round((result.correct / result.total) * 100) : 0
  const acc = useCountUp(accTarget, 450)

  // Pipo reacts: "Perpektong aralin!" / "Stage complete!" (or a gentle "subukan ulit"), then a
  // new badge ("Level up!") or a longer day streak ("Ayan na ang apoy!") — two lines at most
  useEffect(() => {
    if (!result) return
    sayLines(completeEvents(result).map((e) => pickLine(e)), { after: result.failed ? 400 : 700 })
    return () => stopVoice()
  }, [result])

  useEffect(() => {
    if (!result || result.failed) return
    const colors = ['#FFC83D', '#2F6BFF', '#FF8FB1', '#3DBE6B', '#FF8A1F']
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.35 }, colors })
    if (result.streakUp) setTimeout(() => sfx.streak(), 900)
  }, [result])

  if (!result || !found) return null
  const mm = Math.floor(result.seconds / 60)
  const ss = String(result.seconds % 60).padStart(2, '0')

  if (result.failed) {
    return (
      <div className="h-full flex flex-col bg-white px-6 pt-16 pb-8 text-center screen-bg">
        <Pipo mood="pat" size={170} className="mx-auto" />
        <div className="flex items-center justify-center gap-2 mt-4">
          <Icon name="heartBroken" size={36} />
          <h1 className="text-3xl font-black text-heart">Naubos ang hearts</h1>
        </div>
        <p className="text-ink-soft font-bold mt-2">Okay lang 'yan! Ang pagkakamali ay parte ng pagkatuto. Subukan ulit — kaya mo 'yan!</p>
        <div className="flex-1" />
        <div className="space-y-3">
          <Button tone="sky" className="w-full" disabled={gems < REFILL_COST} onClick={() => { if (buyRefill()) startLesson(result.stageId) }}>
            <Icon name="heartPlus" size={22} /> Refill · <Icon name="gem" size={18} /> {REFILL_COST}
          </Button>
          <Button tone="white" className="w-full" onClick={() => startLesson(result.stageId, true)}><Icon name="heartPlus" size={22} /> Mag-practice para sa hearts</Button>
          {gems < REFILL_COST && <p className="text-xs font-bold text-ink-soft">Kulang ang gems para sa refill. Mag-practice (walang mawawalang heart) para makakuha ulit ng hearts!</p>}
        </div>
      </div>
    )
  }

  const perfect = result.correct === result.total
  return (
    <div className="h-full flex flex-col bg-white px-6 pt-10 pb-8 text-center screen-bg" style={{ ['--screen-tint' as string]: '#FFE9B8' }}>
      <motion.div initial={{ scale: 0.4, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
        <Pipo mood={result.practice ? 'heart' : perfect ? 'star' : 'trophy'} size={180} className="mx-auto" />
      </motion.div>
      <h1 className="text-[32px] font-black mt-2 text-sun-dark leading-tight">{result.practice ? 'Practice complete!' : perfect ? 'Perfect lesson!' : 'Stage complete!'}</h1>
      <p className="text-ink-soft font-bold mt-1 flex items-center justify-center gap-1.5"><Icon name={found.stage.icon} size={22} /> {found.stage.title} · {found.world.level}</p>

      <div className="flex gap-2.5 mt-7">
        <StatCard label="Total XP" value={`${xp}`} color="#E5A800" icon="sun" delay={0.2} />
        <StatCard label={perfect ? 'Perpekto' : 'Galing'} value={`${acc}%`} color="#2A9A51" icon="target" delay={0.35} />
        <StatCard label="Bilis" value={`${mm}:${ss}`} color="#2F6BFF" icon="clock" delay={0.5} />
      </div>

      {result.practice && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          className="mt-5 rounded-2xl bg-heart-soft border-2 border-heart p-3 flex items-center justify-center gap-2 font-black text-heart-dark">
          <Icon name="heartPlus" size={30} /> +{result.heartsEarned ?? 0} hearts mula sa practice!
        </motion.div>
      )}
      {result.bestCombo >= 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-4 inline-flex mx-auto items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF0E0] text-flame font-black">
          <Icon name="bolt" size={20} /> {result.bestCombo} sunod-sunod na tama!
        </motion.div>
      )}

      {!!result.newBadges?.length && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
          className="mt-4 rounded-2xl bg-sun-soft border-2 border-sun p-3 flex items-center justify-center gap-2 flex-wrap font-black text-sun-dark">
          <Icon name="medal" size={26} /> Level up! Bagong badge:
          {ACHIEVEMENTS.filter((a) => result.newBadges!.includes(a.id)).map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-ink text-sm"><Icon name={a.icon} size={18} /> {a.title}</span>
          ))}
        </motion.div>
      )}

      {result.streakUp && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}
          className="mt-5 rounded-2xl bg-[#FFF0E0] border-2 border-flame p-4 flex items-center gap-3 text-left">
          <motion.span animate={{ scale: [1, 1.18, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}><Icon name="flame" size={52} /></motion.span>
          <div>
            <div className="text-2xl font-black text-flame">{streak} day streak!</div>
            <div className="font-bold text-ink-soft text-sm">Balik ka bukas para hindi maputol!</div>
          </div>
        </motion.div>
      )}

      <div className="flex-1" />
      <Button tone="leaf" className="w-full" onClick={() => go('path')}>Tuloy</Button>
    </div>
  )
}
