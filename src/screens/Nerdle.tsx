import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { today, useGame } from '../store/game'
import { Button } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { ReportSheet } from '../components/ReportSheet'
import { haptic, sfx } from '../lib/sfx'
import { TIER_LABEL, checkGuess, dailyPuzzle, practicePuzzle, validateEquation, type NerdleLength, type Puzzle, type TileStatus } from '../games/nerdle'

export function NerdleScreen() {
  const { go, xp, todayXp, nerdleStreak, nerdleLastDate, nerdleWins, nerdlePlayed, set: setGame, recordAttempt } = useGame()

  const [length, setLength] = useState<NerdleLength>(8)
  const [isDaily, setIsDaily] = useState<boolean>(true)
  const [practice, setPractice] = useState<Puzzle | null>(null)
  const recentPractice = useRef<string[]>([])
  const startedAt = useRef(0)
  const [toast, setToast] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const todayStr = useMemo(() => today(), [])

  // Daily: fixed by date (difficulty follows the weekday); practice: random, not recently played
  const puzzle = useMemo<Puzzle>(() => {
    if (isDaily || !practice || practice.equation.length !== length) return isDaily ? dailyPuzzle(todayStr, length) : practicePuzzle(length, recentPractice.current)
    return practice
  }, [length, isDaily, todayStr, practice])
  const targetEquation = puzzle.equation
  useEffect(() => { startedAt.current = Date.now() }, [targetEquation])

  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState<string>('')
  const [statuses, setStatuses] = useState<TileStatus[][]>([])
  const [isGameOver, setIsGameOver] = useState(false)
  const [hasWon, setHasWon] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // Reset board when length or mode changes
  const resetGame = useCallback((nextPractice = false) => {
    setGuesses([])
    setCurrentGuess('')
    setStatuses([])
    setIsGameOver(false)
    setHasWon(false)
    setShareCopied(false)
    if (nextPractice) {
      setPractice(practicePuzzle(length, recentPractice.current))
    }
  }, [])

  const handleLengthChange = (l: NerdleLength) => {
    if (l === length) return
    sfx.tap()
    setLength(l)
    resetGame()
  }

  const handleModeChange = (daily: boolean) => {
    if (daily === isDaily) return
    sfx.tap()
    setIsDaily(daily)
    resetGame(!daily)
  }

  // Handle character input
  const handleChar = useCallback((char: string) => {
    if (isGameOver) return
    if (currentGuess.length >= length) return
    sfx.key()
    haptic(10)
    setCurrentGuess((prev) => prev + char)
  }, [isGameOver, currentGuess.length, length])

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isGameOver) return
    if (currentGuess.length === 0) return
    sfx.key()
    haptic(10)
    setCurrentGuess((prev) => prev.slice(0, -1))
  }, [isGameOver, currentGuess.length])

  // Handle submit guess
  const handleSubmit = useCallback(() => {
    if (isGameOver) return

    const validation = validateEquation(currentGuess, length)
    if (!validation.valid) {
      sfx.wrong()
      haptic(25)
      showToast(validation.error || 'Hindi wastong equation!')
      return
    }

    const rowStatuses = checkGuess(currentGuess, targetEquation)
    const newGuesses = [...guesses, currentGuess]
    const newStatuses = [...statuses, rowStatuses]

    setGuesses(newGuesses)
    setStatuses(newStatuses)
    setCurrentGuess('')

    const won = currentGuess === targetEquation
    if (won) {
      // Won!
      sfx.chest()
      sfx.correct()
      haptic(30)
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
      setIsGameOver(true)
      setHasWon(true)

      recordAttempt('nerdle', puzzle.topic, true, Date.now() - startedAt.current)
      if (!isDaily) recentPractice.current = [targetEquation, ...recentPractice.current].slice(0, 20)
      // Update store stats
      const isNewDaily = isDaily && nerdleLastDate !== todayStr
      const newStreak = isNewDaily ? nerdleStreak + 1 : nerdleStreak
      setGame({
        xp: xp + 20,
        todayXp: todayXp + 20,
        nerdlePlayed: nerdlePlayed + 1,
        nerdleWins: nerdleWins + 1,
        nerdleStreak: newStreak,
        nerdleLastDate: isDaily ? todayStr : nerdleLastDate,
      })
    } else if (newGuesses.length >= 6) {
      // Lost
      sfx.wrong()
      haptic(30)
      setIsGameOver(true)
      setHasWon(false)
      recordAttempt('nerdle', puzzle.topic, false, Date.now() - startedAt.current)
      if (!isDaily) recentPractice.current = [targetEquation, ...recentPractice.current].slice(0, 20)
      setGame({
        nerdlePlayed: nerdlePlayed + 1,
      })
    } else {
      sfx.tap()
    }
  }, [
    isGameOver,
    currentGuess,
    length,
    targetEquation,
    guesses,
    statuses,
    isDaily,
    nerdleLastDate,
    todayStr,
    nerdleStreak,
    setGame,
    xp,
    todayXp,
    nerdlePlayed,
    nerdleWins,
    showToast,
    puzzle.topic,
    recordAttempt,
  ])

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key
      if (/^[0-9+\-*/=]$/.test(k)) {
        e.preventDefault()
        handleChar(k)
      } else if (k === 'Enter') {
        e.preventDefault()
        handleSubmit()
      } else if (k === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleChar, handleSubmit, handleBackspace])

  // Determine keyboard key colors
  const keyColors = useMemo(() => {
    const map: Record<string, TileStatus> = {}
    for (let r = 0; r < guesses.length; r++) {
      const g = guesses[r]
      const rowStatus = statuses[r]
      for (let c = 0; c < g.length; c++) {
        const ch = g[c]
        const st = rowStatus[c]
        // Precedence: correct > present > absent
        if (st === 'correct') {
          map[ch] = 'correct'
        } else if (st === 'present' && map[ch] !== 'correct') {
          map[ch] = 'present'
        } else if (st === 'absent' && !map[ch]) {
          map[ch] = 'absent'
        }
      }
    }
    return map
  }, [guesses, statuses])

  // Share result to clipboard
  const handleShare = () => {
    const emojiGrid = statuses
      .map((row) =>
        row
          .map((st) => (st === 'correct' ? '🟩' : st === 'present' ? '🟪' : '⬜'))
          .join('')
      )
      .join('\n')

    const shareText = `Sipnayan Nerdle (${todayStr}) ${hasWon ? guesses.length : 'X'}/6\n\n${emojiGrid}\n\nLaruin offline sa Sipnayan Math!`
    navigator.clipboard?.writeText(shareText).then(() => {
      setShareCopied(true)
      showToast('Nakopya sa clipboard ang resulta!')
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  return (
    <div className="h-full flex flex-col bg-white relative select-none">
      {/* Top Header */}
      <header className="px-3 py-2 bg-white border-b-2 border-line flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go('games')}
            className="w-9 h-9 rounded-xl bg-cloud border-2 border-line flex items-center justify-center text-ink hover:bg-sky-soft hover:border-sky active:scale-95 transition cursor-pointer shrink-0"
            aria-label="Bumalik sa Games"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-black text-sm text-ink leading-tight flex items-center gap-1.5">
              <span>Sipnayan Nerdle</span>
              {isDaily && <span className="px-1.5 py-0.2 rounded-md bg-grape text-white text-[10px] font-black uppercase">Daily</span>}
            </h1>
            <div className="text-[11px] font-bold text-ink-soft">Pang-araw-araw na Math Wordle</div>
          </div>
        </div>

        {/* Streaks & Wins */}
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-1 rounded-xl bg-sun-soft text-ink text-xs font-black border border-sun/30 flex items-center gap-1">
            <Icon name="flame" size={16} /> {nerdleStreak} streak
          </span>
          <span className="px-2 py-1 rounded-xl bg-cloud text-ink text-xs font-black border border-line">
            {nerdleWins} panalo
          </span>
        </div>
      </header>

      {/* Mode & Length Selector Controls */}
      <div className="px-4 py-2 bg-white border-b border-line flex items-center justify-between gap-2 shrink-0">
        {/* Daily vs Practice */}
        <div className="flex rounded-xl bg-cloud p-0.5 border border-line text-xs font-black">
          <button
            type="button"
            onClick={() => handleModeChange(true)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              isDaily ? 'bg-grape text-white shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Araw-araw
          </button>
          <button
            type="button"
            onClick={() => handleModeChange(false)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              !isDaily ? 'bg-sky text-white shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Pagsasanay
          </button>
        </div>

        {/* 8 vs 6 Length */}
        <div className="flex rounded-xl bg-cloud p-0.5 border border-line text-xs font-black">
          <button
            type="button"
            onClick={() => handleLengthChange(8)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              length === 8 ? 'bg-white text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            8 (Klasik)
          </button>
          <button
            type="button"
            onClick={() => handleLengthChange(6)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              length === 6 ? 'bg-white text-ink shadow-xs' : 'text-ink-soft hover:text-ink'
            }`}
          >
            6 (Mini)
          </button>
        </div>
      </div>
      <div className="flex justify-center -mt-1 mb-1">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${puzzle.tier === 'easy' ? 'bg-leaf-soft text-leaf-dark' : puzzle.tier === 'medium' ? 'bg-sun-soft text-sun-dark' : 'bg-heart-soft text-heart-dark'}`}>
          {TIER_LABEL[puzzle.tier]}{isDaily && length === 8 ? ' · ayon sa araw ng linggo' : ''}
        </span>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-ink text-white font-black text-xs text-center shadow-lg border border-white/20 max-w-[85%]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Board */}
      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center justify-center p-3 screen-bg" style={{ ['--screen-tint' as string]: '#E6DCFA' }}>
        <div className="w-full max-w-[360px] space-y-1.5 my-auto">
          {Array.from({ length: 6 }, (_, rowIndex) => {
            const isCompleted = rowIndex < guesses.length
            const isCurrent = rowIndex === guesses.length && !isGameOver
            const rowGuess = isCompleted ? guesses[rowIndex] : isCurrent ? currentGuess : ''
            const rowStatuses = isCompleted ? statuses[rowIndex] : undefined

            return (
              <div key={rowIndex} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
                {Array.from({ length }, (_, colIndex) => {
                  const char = rowGuess[colIndex] ?? ''
                  const status = rowStatuses?.[colIndex]

                  let bg = 'bg-white'
                  let border = 'border-line'
                  let text = 'text-ink'

                  if (status === 'correct') {
                    bg = 'bg-[#3DBE6B]'
                    border = 'border-[#2A9A51]'
                    text = 'text-white'
                  } else if (status === 'present') {
                    bg = 'bg-[#9B5DE5]'
                    border = 'border-[#7B3FC4]'
                    text = 'text-white'
                  } else if (status === 'absent') {
                    bg = 'bg-[#8F8798]'
                    border = 'border-[#746C7E]'
                    text = 'text-white'
                  } else if (isCurrent && char) {
                    border = 'border-ink/60'
                  }

                  return (
                    <motion.div
                      key={colIndex}
                      animate={isCompleted ? { rotateX: [0, 90, 0] } : char ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.25, delay: isCompleted ? colIndex * 0.05 : 0 }}
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center font-black ${
                        length === 8 ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
                      } ${bg} ${border} ${text} shadow-2xs select-none`}
                    >
                      {char}
                    </motion.div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Win/Loss Modal Summary */}
        {isGameOver && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-soft w-full max-w-[360px] mt-3 p-3.5 rounded-2xl text-center space-y-2.5"
          >
            <div className="flex items-center justify-center gap-2">
              <Pipo mood={hasWon ? 'medal' : 'think'} size={50} />
              <div className="text-left">
                <h2 className="font-black text-base leading-tight">
                  {hasWon ? 'Nakuha mo! Galing!' : 'Sayang! Subukan ulit.'}
                </h2>
                <p className="text-xs font-bold text-ink-soft">
                  Sagot:{' '}
                  <span className="font-black text-sky-dark bg-sky-soft px-1.5 py-0.5 rounded-md">
                    {targetEquation}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button tone="grape" className="flex-1 text-xs py-2" onClick={handleShare}>
                {shareCopied ? 'Nakopya na!' : 'I-share'}
              </Button>
              <Button
                tone="white"
                className="flex-1 text-xs py-2"
                onClick={() => {
                  setIsDaily(false)
                  resetGame(true)
                }}
              >
                Maglaro Ulit ↺
              </Button>
            </div>
            <div>
              <Button tone="white" className="w-full text-xs py-2" onClick={() => setReportOpen(true)}>
                <Icon name="chartUp" size={18} /> Assessment Report
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Onscreen Math Keyboard */}
      <div className="bg-white border-t-2 border-line p-2 sm:p-3 space-y-1.5 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        {/* Row 1: Digits 1-0 */}
        <div className="grid grid-cols-10 gap-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => {
            const st = keyColors[digit]
            const bg =
              st === 'correct'
                ? 'bg-[#3DBE6B] text-white border-[#2A9A51]'
                : st === 'present'
                ? 'bg-[#9B5DE5] text-white border-[#7B3FC4]'
                : st === 'absent'
                ? 'bg-[#8F8798] text-white/80 border-[#746C7E]'
                : 'bg-cloud text-ink border-line hover:bg-sky-soft/40'

            return (
              <button
                key={digit}
                type="button"
                onClick={() => handleChar(digit)}
                className={`h-11 rounded-xl border-2 font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${bg}`}
              >
                {digit}
              </button>
            )
          })}
        </div>

        {/* Row 2: Operators + - * / = and Actions */}
        <div className="grid grid-cols-7 gap-1">
          {['+', '-', '*', '/', '='].map((op) => {
            const st = keyColors[op]
            const bg =
              st === 'correct'
                ? 'bg-[#3DBE6B] text-white border-[#2A9A51]'
                : st === 'present'
                ? 'bg-[#9B5DE5] text-white border-[#7B3FC4]'
                : st === 'absent'
                ? 'bg-[#8F8798] text-white/80 border-[#746C7E]'
                : 'bg-sky-soft text-sky-dark border-sky/30 hover:bg-sky-soft'

            return (
              <button
                key={op}
                type="button"
                onClick={() => handleChar(op)}
                className={`h-11 rounded-xl border-2 font-black text-base flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${bg}`}
              >
                {op === '*' ? '×' : op === '/' ? '÷' : op}
              </button>
            )
          })}

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-11 rounded-xl border-2 border-line bg-cloud text-ink font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer hover:bg-heart-soft hover:text-heart shadow-2xs"
            aria-label="Burahin"
          >
            ⌫
          </button>

          {/* Enter / Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            className="h-11 rounded-xl border-2 border-leaf bg-leaf text-white font-black text-xs uppercase tracking-wide flex items-center justify-center transition active:scale-95 cursor-pointer hover:brightness-105 shadow-2xs"
          >
            Subok
          </button>
        </div>
      </div>
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} kind="nerdle" />
    </div>
  )
}
