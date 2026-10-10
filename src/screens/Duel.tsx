import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import confetti from 'canvas-confetti'
import { useGame } from '../store/game'
import { Button } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo, type Mood } from '../components/Pipo'
import { ReportSheet } from '../components/ReportSheet'
import { Tex } from '../lib/math'
import { sfx, haptic } from '../lib/sfx'
import { ri } from '../engine/rand'
import { GRADE_BANDS, type GradeBand } from '../engine/topics'
import { BAND_NOTE, createDuelPicker, type DuelQ, type Level } from '../games/duelBank'

type DuelMode = 'bot' | 'pvp'

interface PlayerState { score: number; combo: number }
const P0: PlayerState = { score: 0, combo: 0 }

function DuelHalf({
  name,
  avatar,
  q,
  locked,
  roundOver,
  state,
  color,
  bg,
  isBot = false,
  onPick,
}: {
  name: string
  avatar?: React.ReactNode
  q: DuelQ
  locked: boolean
  roundOver: boolean
  state: PlayerState
  color: string
  bg: string
  isBot?: boolean
  onPick: (i: number) => void
}) {
  return (
    <div className="h-full flex flex-col px-4 py-3" style={{ background: bg }}>
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {avatar}
          <span className="font-black text-xs uppercase tracking-wide truncate" style={{ color }}>{name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {state.combo >= 2 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-flame text-white flex items-center gap-0.5 shadow-sm">
              <Icon name="bolt" size={12} white /> x{state.combo}
            </span>
          )}
          <span className="font-black text-xl" style={{ color }}>{state.score}</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-center px-1 min-h-0">
        {q.tex ? (
          <div className="w-full max-w-full overflow-x-auto no-scrollbar py-1">
            <div className="text-[13px] font-black text-ink-soft uppercase mb-1">{q.prompt}</div>
            <Tex tex={q.tex} className="text-[24px] sm:text-[26px] font-black" />
          </div>
        ) : (
          <span className="text-[24px] sm:text-[26px] font-black leading-tight">{q.prompt}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 pb-0.5 shrink-0">
        {q.choices.map((c, i) => {
          const isCorrect = roundOver && i === q.correct
          return (
            <button
              key={i}
              disabled={locked || isBot}
              onClick={() => onPick(i)}
              className={`btn3d min-h-14 text-lg font-black border-2 transition-colors ${
                isCorrect ? 'bg-leaf-soft border-leaf text-leaf-dark' : 'bg-white border-line'
              } ${(locked || isBot) && !isCorrect ? 'opacity-40' : ''}`}
              style={{ ['--shadow' as string]: isCorrect ? 'var(--color-leaf)' : '#E0D9E8' }}
            >
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
  const { go, recordDuel, name: userName, recordAttempt, set: setGame } = useGame()
  const [mode, setMode] = useState<DuelMode>('bot')
  const [phase, setPhase] = useState<Phase>('setup')
  const [band, setBand] = useState<GradeBand>('g4-6')
  const [reportOpen, setReportOpen] = useState(false)
  /** two-player: attribute Manlalaro 1's answers to this learner's report */
  const [p1IsLearner, setP1IsLearner] = useState(false)
  const picker = useRef(createDuelPicker('g4-6'))
  const [level, setLevel] = useState<Level>(1)
  /** each player's FIRST pick this round: the honest measure of what they knew */
  const firstPick = useRef<Partial<Record<1 | 2, { correct: boolean; ms: number }>>>({})
  const roundStart = useRef(0)
  const roundsWon = useRef({ 1: 0, 2: 0 })
  const [totalRounds, setTotalRounds] = useState(5)
  const [timerSec, setTimerSec] = useState(10)
  const [round, setRound] = useState(1)
  const [q, setQ] = useState<DuelQ | null>(null)
  const [p1, setP1] = useState<PlayerState>(P0)
  const [p2, setP2] = useState<PlayerState>(P0)
  const [p1Locked, setP1Locked] = useState(false)
  const [p2Locked, setP2Locked] = useState(false)
  const [roundOver, setRoundOver] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [timeLeft, setTimeLeft] = useState(10)
  const [timeoutNotice, setTimeoutNotice] = useState(false)
  const [botMood, setBotMood] = useState<Mood>('think')
  const recorded = useRef(false)
  const botTimerRef = useRef<number | null>(null)

  // Countdown to start match
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setQ(picker.current.next())
      firstPick.current = {}
      roundStart.current = Date.now()
      setRoundOver(false)
      setTimeoutNotice(false)
      setP1Locked(false)
      setP2Locked(false)
      setTimeLeft(timerSec)
      setBotMood('think')
      setPhase('play')
      return
    }
    sfx.tap()
    const t = setTimeout(() => setCountdown((c) => c - 1), 600)
    return () => clearTimeout(t)
  }, [phase, countdown, timerSec])

  /** Which seat's answers go into this learner's report (null = nobody, unattributed PvP) */
  const learnerSeat: 1 | 2 | null = mode === 'bot' ? 2 : p1IsLearner ? 1 : null

  /** End-of-round bookkeeping: record the learner's first pick, adapt the difficulty */
  const concludeRound = (winner: 1 | 2 | null) => {
    if (!q) return
    if (winner) roundsWon.current[winner]++
    let signal: boolean | undefined
    if (learnerSeat) {
      const mine = firstPick.current[learnerSeat]
      if (mine) recordAttempt('duel', q.topic, mine.correct, mine.ms)
      else if (!winner) recordAttempt('duel', q.topic, false, timerSec * 1000) // ran out of time
      signal = mine ? mine.correct : winner ? undefined : false
    } else {
      signal = winner !== null // shared question: someone solved it -> harder; nobody -> easier
    }
    picker.current.feedback(signal)
    setLevel(picker.current.level)
  }

  // Advance to next round or finish
  const advanceRound = () => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current)
      botTimerRef.current = null
    }
    if (round >= totalRounds) {
      sfx.complete()
      setPhase('final')
    } else {
      setRound((r) => r + 1)
      setQ(picker.current.next())
      firstPick.current = {}
      roundStart.current = Date.now()
      setRoundOver(false)
      setTimeoutNotice(false)
      setP1Locked(false)
      setP2Locked(false)
      setTimeLeft(timerSec)
      setBotMood('think')
    }
  }

  // Round Timer countdown
  useEffect(() => {
    if (phase !== 'play' || roundOver || !q) return
    if (timeLeft <= 0) {
      // Timeout occurred!
      sfx.wrong()
      haptic(15)
      setRoundOver(true)
      setTimeoutNotice(true)
      concludeRound(null)
      if (mode === 'bot') setBotMood('shrug')
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current)
        botTimerRef.current = null
      }
      const t = setTimeout(() => {
        advanceRound()
      }, 1200)
      return () => clearTimeout(t)
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0
        if (prev <= 4) sfx.tap() // audible warning tick
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, roundOver, q, timeLeft, mode, round, totalRounds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Bot opponent AI answering logic
  useEffect(() => {
    if (phase !== 'play' || mode !== 'bot' || roundOver || !q || p1Locked) {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current)
        botTimerRef.current = null
      }
      return
    }

    // Pipo Bot plays at the match's current difficulty level
    const delays: Record<Level, [number, number]> = { 1: [3400, 5600], 2: [2300, 4200], 3: [1500, 2900] }
    const accuracies: Record<Level, number> = { 1: 0.7, 2: 0.85, 3: 0.94 }

    const [minD, maxD] = delays[level]
    const delay = ri(minD, maxD)

    botTimerRef.current = window.setTimeout(() => {
      if (roundOver) return
      const isCorrect = Math.random() < accuracies[level]
      let pickIdx = q.correct
      if (!isCorrect) {
        const wrongs = q.choices.map((_, i) => i).filter((i) => i !== q.correct)
        pickIdx = wrongs[ri(0, wrongs.length - 1)] ?? 0
      }
      answer(1, pickIdx)
    }, delay)

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current)
        botTimerRef.current = null
      }
    }
  }, [phase, mode, roundOver, q, p1Locked, level]) // eslint-disable-line react-hooks/exhaustive-deps

  const startDuel = () => {
    picker.current = createDuelPicker(band)
    setLevel(1)
    roundsWon.current = { 1: 0, 2: 0 }
    setP1(P0)
    setP2(P0)
    setRound(1)
    setCountdown(3)
    setTimeLeft(timerSec)
    setTimeoutNotice(false)
    recorded.current = false
    setPhase('countdown')
  }

  const answer = (player: 1 | 2, choiceIdx: number) => {
    if (!q || roundOver) return
    if (player === 1 && p1Locked) return
    if (player === 2 && p2Locked) return
    firstPick.current[player] ??= { correct: choiceIdx === q.correct, ms: Date.now() - roundStart.current }

    if (choiceIdx === q.correct) {
      concludeRound(player)
      haptic(20)
      sfx.correct()
      setRoundOver(true)
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current)
        botTimerRef.current = null
      }

      if (mode === 'bot') {
        if (player === 1) setBotMood('eureka')
        else setBotMood('clap')
      }

      const bump = (s: PlayerState): PlayerState => ({ score: s.score + 10 + s.combo * 2, combo: s.combo + 1 })
      const drop = (s: PlayerState): PlayerState => ({ ...s, combo: 0 })
      if (player === 1) { setP1(bump); setP2(drop) } else { setP2(bump); setP1(drop) }

      setTimeout(() => {
        advanceRound()
      }, 900)
    } else {
      sfx.wrong()
      haptic(10)
      if (player === 1) {
        if (mode === 'bot') setBotMood('oops')
        setP1((s) => ({ ...s, combo: 0 }))
        setP1Locked(true)
        setTimeout(() => {
          setP1Locked(false)
          if (mode === 'bot') setBotMood('think')
        }, 1000)
      } else {
        setP2((s) => ({ ...s, combo: 0 }))
        setP2Locked(true)
        setTimeout(() => setP2Locked(false), 1000)
      }
    }
  }

  useEffect(() => {
    if (phase === 'final' && !recorded.current) {
      recorded.current = true
      const isWin = mode === 'bot' ? p2.score > p1.score : p1.score !== p2.score
      recordDuel(isWin)
      if (mode === 'pvp') {
        const s0 = useGame.getState().duelPvp
        setGame({ duelPvp: { matches: s0.matches + 1, rounds: s0.rounds + totalRounds, p1Correct: s0.p1Correct + roundsWon.current[1], p2Correct: s0.p2Correct + roundsWon.current[2] } })
      }
      const colors = ['#2F6BFF', '#FFC83D', '#FF8FB1', '#3DBE6B']
      confetti({ particleCount: 140, spread: 85, origin: { y: 0.4 }, colors })
    }
  }, [phase, p1.score, p2.score, mode, recordDuel, setGame, totalRounds])

  if (phase === 'setup') {
    return (
      <div className="h-full flex flex-col bg-white px-6 pt-8 pb-7 overflow-y-auto no-scrollbar screen-bg" style={{ ['--screen-tint' as string]: '#EBDDFB' }}>
        <button onClick={() => go('path')} className="text-2xl text-ink-soft font-black self-start mb-2" aria-label="Back">←</button>
        <div className="flex items-center gap-3 mb-1">
          <Icon name="versus" size={40} />
          <div>
            <div className="text-2xl font-black leading-tight">Tagisan ng Talino</div>
            <div className="text-ink-soft font-bold text-sm">Offline Math Duel with Bot & Timer</div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-5">
          <div className="font-black text-xs uppercase tracking-wide text-ink-soft mb-2">Pumili ng Kalaban</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { sfx.tap(); setMode('bot') }}
              className={`btn3d p-3 border-2 text-left flex items-center gap-2.5 bg-white ${
                mode === 'bot' ? 'border-pig bg-pig-soft' : 'border-line'
              }`}
              style={{ ['--shadow' as string]: mode === 'bot' ? 'var(--color-pig-dark)' : '#E0D9E8' }}
            >
              <Pipo mood="tutor" size={38} className="shrink-0" />
              <div className="min-w-0">
                <span className="block font-black text-[15px] leading-tight text-pig-dark">Pipo Bot</span>
                <span className="block text-[11px] text-ink-soft font-bold">Single Player</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { sfx.tap(); setMode('pvp') }}
              className={`btn3d p-3 border-2 text-left flex items-center gap-2.5 bg-white ${
                mode === 'pvp' ? 'border-sky bg-sky-soft' : 'border-line'
              }`}
              style={{ ['--shadow' as string]: mode === 'pvp' ? 'var(--color-sky)' : '#E0D9E8' }}
            >
              <Icon name="versus" size={34} className="shrink-0" />
              <div className="min-w-0">
                <span className="block font-black text-[15px] leading-tight text-sky">2 Manlalaro</span>
                <span className="block text-[11px] text-ink-soft font-bold">Pass & Play</span>
              </div>
            </button>
          </div>
        </div>

        {/* Timer Selection */}
        <div className="mt-4">
          <div className="font-black text-xs uppercase tracking-wide text-ink-soft mb-2">Timer bawat round</div>
          <div className="grid grid-cols-3 gap-2">
            {[8, 10, 15].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => { sfx.tap(); setTimerSec(sec) }}
                className={`btn3d p-2.5 border-2 bg-white font-black text-center text-sm ${
                  timerSec === sec ? 'border-sun bg-sun-soft text-ink' : 'border-line text-ink-soft'
                }`}
                style={{ ['--shadow' as string]: timerSec === sec ? 'var(--color-sun-dark)' : '#E0D9E8' }}
              >
                <span className="inline-flex items-center gap-1"><Icon name="clock" size={16} /> {sec}s</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grade band — difficulty inside the band adapts to how the learner is doing */}
        <div className="mt-4">
          <div className="font-black text-xs uppercase tracking-wide text-ink-soft mb-2">Antas (Grade level)</div>
          <div className="space-y-2">
            {GRADE_BANDS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => { sfx.tap(); setBand(g.id) }}
                className={`btn3d w-full text-left flex items-center justify-between p-3 border-2 bg-white ${
                  band === g.id ? 'border-grape bg-[#F2EAFD]' : 'border-line'
                }`}
                style={{ ['--shadow' as string]: band === g.id ? 'var(--color-grape)' : '#E0D9E8' }}
              >
                <div>
                  <span className="block font-black text-[15px]">{g.label}</span>
                  <span className="block text-xs text-ink-soft font-semibold">{BAND_NOTE[g.id]}</span>
                </div>
                {band === g.id && <Icon name="check" size={20} />}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-bold text-ink-soft mt-1.5">Lumalakas ang tanong kapag sunod-sunod ang tama, at gumagaan kapag nagkamali.</p>
        </div>

        {mode === 'pvp' && (
          <label className="card-soft mt-4 flex items-center gap-3 p-3 rounded-2xl cursor-pointer">
            <input type="checkbox" checked={p1IsLearner} onChange={(e) => setP1IsLearner(e.target.checked)} className="w-5 h-5 accent-sky" />
            <span className="text-[13px] font-bold text-ink leading-snug">
              Si Manlalaro 1 ay si {userName?.trim() || 'ako'}
              <span className="block text-[11px] text-ink-soft">Isasama ang mga sagot ni Manlalaro 1 sa assessment report. Kung hindi, kabuuang bilang lang ng laro ang itatala.</span>
            </span>
          </label>
        )}

        {/* Rounds */}
        <div className="mt-4">
          <div className="font-black text-xs uppercase tracking-wide text-ink-soft mb-2">Bilang ng rounds</div>
          <div className="grid grid-cols-2 gap-3">
            {[5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { sfx.tap(); setTotalRounds(n) }}
                className={`btn3d p-2.5 border-2 bg-white font-black text-center text-base ${
                  totalRounds === n ? 'border-sky bg-sky-soft text-sky' : 'border-line text-ink-soft'
                }`}
                style={{ ['--shadow' as string]: totalRounds === n ? 'var(--color-sky)' : '#E0D9E8' }}
              >
                {n} rounds
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-pig-soft border-2 border-pig/50 p-3 mt-4 flex gap-2.5 items-center">
          <Pipo mood="star" size={36} className="shrink-0" />
          <p className="text-[12px] font-bold text-ink-soft leading-snug">
            {mode === 'bot'
              ? 'Mabilis mag-isip si Pipo Bot! Unahan siyang pumili ng tamang sagot bago maubos ang timer.'
              : 'Ihiga ang phone sa mesa. Ang itaas na kalahati ay baligtad para sa kalaro mo!'}
          </p>
        </div>

        <div className="mt-5">
          <Button tone="pig" className="w-full" onClick={startDuel}>
            <Icon name="bolt" size={22} white /> Simulan ang Duel!
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-ink text-white">
        <Pipo mood={mode === 'bot' ? 'star' : 'clap'} size={130} />
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-7xl font-black mt-4"
          >
            {countdown > 0 ? countdown : 'Sige!'}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'play' && q) {
    const isBot = mode === 'bot'
    const p1Name = isBot ? 'Pipo Bot' : 'Manlalaro 1'
    const p2Name = isBot ? (userName?.trim() || 'Ikaw') : 'Manlalaro 2'

    return (
      <div className="h-full w-full flex flex-col bg-ink">
        {/* Top Player (Player 1 or Pipo Bot) */}
        <div className="flex-1 min-h-0" style={mode === 'pvp' ? { transform: 'rotate(180deg)' } : undefined}>
          <DuelHalf
            name={p1Name}
            avatar={isBot ? <Pipo mood={botMood} size={32} /> : undefined}
            q={q}
            locked={p1Locked || roundOver}
            roundOver={roundOver}
            state={p1}
            color="#1F4FD1"
            bg="#EEF3FF"
            isBot={isBot}
            onPick={(i) => answer(1, i)}
          />
        </div>

        {/* Center Divider: Timer, Round & Controls */}
        <div className="h-13 bg-ink flex items-center justify-between px-4 shrink-0 border-y-2 border-white/10 z-10 shadow-lg">
          <button
            onClick={() => { if (confirm('Itigil ang duel?')) go('path') }}
            className="text-white/60 hover:text-white p-1"
            aria-label="Quit"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="text-white font-black text-xs uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full">
              Round {round}/{totalRounds}
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wide transition-colors ${
                timeoutNotice
                  ? 'bg-heart text-white animate-bounce'
                  : timeLeft <= 3
                  ? 'bg-heart text-white animate-pulse'
                  : 'bg-white/20 text-sun'
              }`}
            >
              <Icon name="clock" size={14} white={timeLeft <= 3 || timeoutNotice} />
              <span>{timeoutNotice ? 'Oras na!' : `${timeLeft}s`}</span>
            </div>
          </div>

          <span className="w-5" />
        </div>

        {/* Bottom Player (Player 2 or Learner) */}
        <div className="flex-1 min-h-0">
          <DuelHalf
            name={p2Name}
            q={q}
            locked={p2Locked || roundOver}
            roundOver={roundOver}
            state={p2}
            color="#D93355"
            bg="#FFF0F3"
            onPick={(i) => answer(2, i)}
          />
        </div>
      </div>
    )
  }

  // final phase
  const winner = p1.score > p2.score ? 1 : p2.score > p1.score ? 2 : 0
  const isBot = mode === 'bot'
  const p1Label = isBot ? 'Pipo Bot' : 'Manlalaro 1'
  const p2Label = isBot ? (userName?.trim() || 'Ikaw') : 'Manlalaro 2'

  return (
    <div className="h-full flex flex-col bg-white px-6 pt-10 pb-8 text-center screen-bg" style={{ ['--screen-tint' as string]: '#EBDDFB' }}>
      <motion.div initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
        <Pipo mood={isBot ? (winner === 2 ? 'star' : winner === 1 ? 'trophy' : 'clap') : 'trophy'} size={170} className="mx-auto" />
      </motion.div>
      <h1 className="text-[28px] font-black mt-2 leading-tight">
        {winner === 0 ? (
          'Tabla ang Laban!'
        ) : isBot ? (
          winner === 2 ? (
            <>Panalo ka, <span className="text-pig-dark">{p2Label}</span>!</>
          ) : (
            <>Panalo si <span className="text-[#1F4FD1]">Pipo Bot</span>!</>
          )
        ) : (
          <>Panalo si <span style={{ color: winner === 1 ? '#1F4FD1' : '#D93355' }}>Manlalaro {winner}</span>!</>
        )}
      </h1>
      <p className="text-ink-soft font-bold text-sm mt-1">
        {isBot
          ? (winner === 2 ? 'Napakagaling! Natalo mo si Pipo Bot sa mabilisang math duel!' : 'Magandang laban! Mag-ensayo pa para talunin si Pipo Bot sa susunod.')
          : 'Magaling na tunggalian ng sipnayan!'}
      </p>

      <div className="flex gap-3 mt-6">
        <div className="flex-1 rounded-2xl border-2 p-3" style={{ borderColor: '#1F4FD1', background: winner === 1 ? '#EEF3FF' : 'white' }}>
          <div className="text-xs font-black uppercase text-ink-soft">{p1Label}</div>
          <div className="text-3xl font-black" style={{ color: '#1F4FD1' }}>{p1.score}</div>
        </div>
        <div className="flex-1 rounded-2xl border-2 p-3" style={{ borderColor: '#D93355', background: winner === 2 ? '#FFF0F3' : 'white' }}>
          <div className="text-xs font-black uppercase text-ink-soft">{p2Label}</div>
          <div className="text-3xl font-black" style={{ color: '#D93355' }}>{p2.score}</div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="space-y-3">
        <Button tone="pig" className="w-full" onClick={startDuel}>Duel Ulit</Button>
        <Button tone="white" className="w-full" onClick={() => setReportOpen(true)}><Icon name="chartUp" size={20} /> Assessment Report</Button>
        <Button tone="white" className="w-full" onClick={() => go('path')}>Bumalik sa Landas</Button>
        <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} kind="duel" />
      </div>
    </div>
  )
}
