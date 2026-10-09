import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import confetti from 'canvas-confetti'
import { useGame } from '../store/game'
import { Button } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { Tex } from '../lib/math'
import { sfx, haptic } from '../lib/sfx'
import { ri, shuffle, distractors } from '../engine/rand'

type Tier = 'easy' | 'medium' | 'hard'
interface DuelQ { id: string; prompt: string; tex?: string; choices: string[]; correct: number }

let qid = 0
function makeChoice(correct: number, spread: number) {
  const d = distractors(correct, 3, spread)
  let guard = 0
  while (d.length < 3 && guard++ < 50) {
    const extra = correct + d.length + 1 + ri(0, 2)
    if (extra !== correct && !d.includes(extra)) d.push(extra)
  }
  const opts = shuffle([correct, ...d.slice(0, 3)])
  return { choices: opts.map(String), correct: opts.indexOf(correct) }
}

function arithEasy(): DuelQ {
  const op = ri(0, 1)
  let a = ri(3, 20), b = ri(1, 15)
  if (op === 1 && b > a) [a, b] = [b, a]
  const correct = op === 0 ? a + b : a - b
  const { choices, correct: ci } = makeChoice(correct, 5)
  return { id: `q${qid++}`, prompt: op === 0 ? `${a} + ${b} = ?` : `${a} − ${b} = ?`, choices, correct: ci }
}
function percentEasy(): DuelQ {
  const pct = [10, 20, 25, 50][ri(0, 3)]
  const base = ri(2, 20) * 4
  const correct = (pct / 100) * base
  const { choices, correct: ci } = makeChoice(correct, Math.max(4, Math.round(correct * 0.3)))
  return { id: `q${qid++}`, prompt: `${pct}% ng ${base} = ?`, choices, correct: ci }
}
function arithMedium(): DuelQ {
  const a = ri(2, 12), b = ri(2, 12)
  const correct = a * b
  const { choices, correct: ci } = makeChoice(correct, Math.max(6, Math.round(correct * 0.25)))
  return { id: `q${qid++}`, prompt: `${a} × ${b} = ?`, choices, correct: ci }
}
function oneStepEq(): DuelQ {
  const x = ri(1, 15), a = ri(1, 15)
  const b = x + a
  const { choices, correct: ci } = makeChoice(x, 5)
  return { id: `q${qid++}`, prompt: `Ano ang x?`, tex: `x + ${a} = ${b}`, choices, correct: ci }
}
function twoStepEq(): DuelQ {
  const x = ri(1, 10), m = ri(2, 5), a = ri(1, 10)
  const b = m * x + a
  const { choices, correct: ci } = makeChoice(x, 4)
  return { id: `q${qid++}`, prompt: `Ano ang x?`, tex: `${m}x + ${a} = ${b}`, choices, correct: ci }
}
function gcfGenD(): DuelQ {
  const pairs: [number, number, number][] = [[12, 18, 6], [8, 12, 4], [20, 30, 10], [15, 25, 5], [16, 24, 8], [9, 15, 3], [14, 21, 7]]
  const [a, b, correct] = pairs[ri(0, pairs.length - 1)]
  const { choices, correct: ci } = makeChoice(correct, 5)
  return { id: `q${qid++}`, prompt: `GCF(${a}, ${b}) = ?`, choices, correct: ci }
}
function quadEval(): DuelQ {
  const a = ri(1, 3), xv = ri(1, 5)
  const correct = a * xv * xv
  const { choices, correct: ci } = makeChoice(correct, Math.max(8, correct))
  return { id: `q${qid++}`, prompt: `Ano ang f(${xv})?`, tex: `f(x)=${a}x^2`, choices, correct: ci }
}

const BANK: Record<Tier, (() => DuelQ)[]> = {
  easy: [arithEasy, arithEasy, percentEasy],
  medium: [arithMedium, percentEasy, oneStepEq],
  hard: [oneStepEq, twoStepEq, gcfGenD, quadEval],
}
const nextQuestion = (tier: Tier): DuelQ => BANK[tier][ri(0, BANK[tier].length - 1)]()

const TIERS: { id: Tier; label: string; note: string }[] = [
  { id: 'easy', label: 'Madali', note: 'Pagdaragdag, pagbabawas, percent' },
  { id: 'medium', label: 'Katamtaman', note: 'Multiplication, percent, one-step equation' },
  { id: 'hard', label: 'Mahirap', note: 'Equations, GCF, quadratic' },
]

interface PlayerState { score: number; combo: number }
const P0: PlayerState = { score: 0, combo: 0 }

function DuelHalf({ player, q, locked, roundOver, state, color, bg, onPick }: {
  player: 1 | 2
  q: DuelQ
  locked: boolean
  roundOver: boolean
  state: PlayerState
  color: string
  bg: string
  onPick: (i: number) => void
}) {
  return (
    <div className="h-full flex flex-col px-4 py-3" style={{ background: bg }}>
      <div className="flex items-center justify-between mb-1 shrink-0">
        <span className="font-black text-xs uppercase tracking-wide" style={{ color }}>Manlalaro {player}</span>
        <div className="flex items-center gap-2">
          {state.combo >= 2 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-flame text-white flex items-center gap-0.5">
              <Icon name="bolt" size={12} white /> x{state.combo}
            </span>
          )}
          <span className="font-black text-xl" style={{ color }}>{state.score}</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-center px-1 min-h-0">
        {q.tex ? (
          <div>
            <div className="text-[13px] font-black text-ink-soft uppercase mb-1">{q.prompt}</div>
            <Tex tex={q.tex} className="text-[26px] font-black" />
          </div>
        ) : (
          <span className="text-[26px] font-black leading-tight">{q.prompt}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 pb-0.5 shrink-0">
        {q.choices.map((c, i) => {
          const isCorrect = roundOver && i === q.correct
          return (
            <button key={i} disabled={locked} onClick={() => onPick(i)}
              className={`btn3d min-h-14 text-lg font-black border-2 transition-colors ${isCorrect ? 'bg-leaf-soft border-leaf' : 'bg-white border-line'} ${locked && !isCorrect ? 'opacity-40' : ''}`}
              style={{ ['--shadow' as string]: isCorrect ? 'var(--color-leaf)' : '#E0D9E8' }}>
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type Phase = 'setup' | 'countdown' | 'play' | 'final'

export function DuelScreen() {
  const { go, recordDuel } = useGame()
  const [phase, setPhase] = useState<Phase>('setup')
  const [tier, setTier] = useState<Tier>('easy')
  const [totalRounds, setTotalRounds] = useState(5)
  const [round, setRound] = useState(1)
  const [q, setQ] = useState<DuelQ | null>(null)
  const [p1, setP1] = useState<PlayerState>(P0)
  const [p2, setP2] = useState<PlayerState>(P0)
  const [p1Locked, setP1Locked] = useState(false)
  const [p2Locked, setP2Locked] = useState(false)
  const [roundOver, setRoundOver] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const recorded = useRef(false)

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setQ(nextQuestion(tier))
      setRoundOver(false)
      setP1Locked(false)
      setP2Locked(false)
      setPhase('play')
      return
    }
    sfx.tap()
    const t = setTimeout(() => setCountdown((c) => c - 1), 600)
    return () => clearTimeout(t)
  }, [phase, countdown, tier])

  const startDuel = () => {
    setP1(P0); setP2(P0); setRound(1); setCountdown(3); recorded.current = false; setPhase('countdown')
  }

  const answer = (player: 1 | 2, choiceIdx: number) => {
    if (!q || roundOver) return
    if (player === 1 && p1Locked) return
    if (player === 2 && p2Locked) return
    if (choiceIdx === q.correct) {
      haptic(20); sfx.correct()
      setRoundOver(true)
      const bump = (s: PlayerState): PlayerState => ({ score: s.score + 10 + s.combo * 2, combo: s.combo + 1 })
      const drop = (s: PlayerState): PlayerState => ({ ...s, combo: 0 })
      if (player === 1) { setP1(bump); setP2(drop) } else { setP2(bump); setP1(drop) }
      setTimeout(() => {
        if (round >= totalRounds) { sfx.complete(); setPhase('final') }
        else {
          setRound((r) => r + 1)
          setQ(nextQuestion(tier))
          setRoundOver(false)
          setP1Locked(false)
          setP2Locked(false)
        }
      }, 900)
    } else {
      sfx.wrong(); haptic(10)
      if (player === 1) { setP1((s) => ({ ...s, combo: 0 })); setP1Locked(true); setTimeout(() => setP1Locked(false), 1000) }
      else { setP2((s) => ({ ...s, combo: 0 })); setP2Locked(true); setTimeout(() => setP2Locked(false), 1000) }
    }
  }

  useEffect(() => {
    if (phase === 'final' && !recorded.current) {
      recorded.current = true
      recordDuel(p1.score !== p2.score)
      const colors = p1.score === p2.score ? ['#2F6BFF', '#FF4B6E'] : p1.score > p2.score ? ['#2F6BFF', '#FFC83D'] : ['#FF4B6E', '#FFC83D']
      confetti({ particleCount: 130, spread: 85, origin: { y: 0.4 }, colors })
    }
  }, [phase, p1.score, p2.score, recordDuel])

  if (phase === 'setup') {
    return (
      <div className="h-full flex flex-col bg-white px-6 pt-10 pb-8">
        <button onClick={() => go('path')} className="text-2xl text-ink-soft font-black self-start mb-2" aria-label="Back">←</button>
        <div className="flex items-center gap-3 mb-1">
          <Icon name="versus" size={40} />
          <div>
            <div className="text-2xl font-black leading-tight">Tagisan ng Talino</div>
            <div className="text-ink-soft font-bold text-sm">Offline 2-Player Math Duel</div>
          </div>
        </div>
        <p className="text-ink-soft font-semibold text-[15px] mt-3">
          Ihiga ang phone sa mesa. Harap-harapan ang dalawang manlalaro — ang itaas ay baligtad para mabasa mula sa kabila.
          Sino ang unang makakapag-tap ng tamang sagot, siya ang mananalo sa round!
        </p>

        <div className="mt-6">
          <div className="font-black text-sm uppercase tracking-wide text-ink-soft mb-2">Antas</div>
          <div className="space-y-2">
            {TIERS.map((t) => (
              <button key={t.id} onClick={() => { sfx.tap(); setTier(t.id) }}
                className={`btn3d w-full text-left flex items-center justify-between p-3 border-2 bg-white ${tier === t.id ? 'border-grape bg-[#F2EAFD]' : 'border-line'}`}
                style={{ ['--shadow' as string]: tier === t.id ? 'var(--color-grape)' : '#E0D9E8' }}>
                <span>
                  <span className="block font-black">{t.label}</span>
                  <span className="block text-xs text-ink-soft font-semibold">{t.note}</span>
                </span>
                {tier === t.id && <Icon name="check" size={22} />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="font-black text-sm uppercase tracking-wide text-ink-soft mb-2">Bilang ng rounds</div>
          <div className="grid grid-cols-2 gap-3">
            {[5, 10].map((n) => (
              <button key={n} onClick={() => { sfx.tap(); setTotalRounds(n) }}
                className={`btn3d p-3 border-2 bg-white font-black text-lg ${totalRounds === n ? 'border-sky bg-sky-soft' : 'border-line'}`}
                style={{ ['--shadow' as string]: totalRounds === n ? 'var(--color-sky)' : '#E0D9E8' }}>
                {n} rounds
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#FFF0E0] border-2 border-flame/40 p-3 mt-5 flex gap-2 items-start">
          <Icon name="bulb" size={22} className="shrink-0 mt-0.5" />
          <p className="text-[13px] font-bold text-ink-soft">
            Tip: Perpekto 'to para sa demo — i-on ang <span className="text-flame">Airplane Mode</span>, ibigay ang phone sa dalawang judge, at pahalalin sila!
          </p>
        </div>

        <div className="flex-1" />
        <Button tone="grape" className="w-full" onClick={startDuel}>
          <Icon name="bolt" size={22} white /> Simulan ang Duel!
        </Button>
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-ink text-white">
        <Pipo mood="clap" size={120} />
        <AnimatePresence mode="wait">
          <motion.div key={countdown} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.3 }} className="text-7xl font-black mt-4">
            {countdown > 0 ? countdown : 'Sige!'}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'play' && q) {
    return (
      <div className="h-full w-full flex flex-col bg-ink">
        <div className="flex-1 min-h-0" style={{ transform: 'rotate(180deg)' }}>
          <DuelHalf player={1} q={q} locked={p1Locked || roundOver} roundOver={roundOver} state={p1} color="#1F4FD1" bg="#EEF3FF" onPick={(i) => answer(1, i)} />
        </div>
        <div className="h-12 bg-ink flex items-center justify-between px-4 shrink-0 border-y-2 border-white/10">
          <button onClick={() => { if (confirm('Itigil ang duel?')) go('path') }} className="text-white/60" aria-label="Quit">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
          </button>
          <div className="text-white font-black text-sm">Round {round}/{totalRounds}</div>
          <span className="w-[18px]" />
        </div>
        <div className="flex-1 min-h-0">
          <DuelHalf player={2} q={q} locked={p2Locked || roundOver} roundOver={roundOver} state={p2} color="#D93355" bg="#FFF0F3" onPick={(i) => answer(2, i)} />
        </div>
      </div>
    )
  }

  // final
  const winner = p1.score > p2.score ? 1 : p2.score > p1.score ? 2 : 0
  return (
    <div className="h-full flex flex-col bg-white px-6 pt-10 pb-8 text-center">
      <motion.div initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
        <Pipo mood="trophy" size={170} className="mx-auto" />
      </motion.div>
      <h1 className="text-[28px] font-black mt-2">
        {winner === 0 ? 'Draw!' : <>Panalo si <span style={{ color: winner === 1 ? '#1F4FD1' : '#D93355' }}>Manlalaro {winner}</span>!</>}
      </h1>
      <div className="flex gap-3 mt-6">
        <div className="flex-1 rounded-2xl border-2 p-3" style={{ borderColor: '#1F4FD1', background: winner === 1 ? '#EEF3FF' : 'white' }}>
          <div className="text-xs font-black uppercase text-ink-soft">Manlalaro 1</div>
          <div className="text-3xl font-black" style={{ color: '#1F4FD1' }}>{p1.score}</div>
        </div>
        <div className="flex-1 rounded-2xl border-2 p-3" style={{ borderColor: '#D93355', background: winner === 2 ? '#FFF0F3' : 'white' }}>
          <div className="text-xs font-black uppercase text-ink-soft">Manlalaro 2</div>
          <div className="text-3xl font-black" style={{ color: '#D93355' }}>{p2.score}</div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="space-y-3">
        <Button tone="grape" className="w-full" onClick={startDuel}>Duel Ulit</Button>
        <Button tone="white" className="w-full" onClick={() => go('path')}>Bumalik sa Landas</Button>
      </div>
    </div>
  )
}
