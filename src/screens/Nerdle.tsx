import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { today, useGame } from '../store/game'
import { Button } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { haptic, sfx } from '../lib/sfx'

type TileStatus = 'correct' | 'present' | 'absent' | 'empty'
type NerdleLength = 6 | 8

// Curated 8-character equations (Classic)
const EQUATIONS_8 = [
  '14+28=42', '3*4+2=14', '96/3-2=30', '50-18=32', '25*3+5=80',
  '100/4=25', '8*9-12=60', '70-35=35', '15+15=30', '48/6+4=12',
  '6*7+10=52', '99-44=55', '12*3+4=40', '85-25=60', '32+19=51',
  '64/8+7=15', '45+35=80', '9*9-11=70', '72/9+8=16', '18+19=37',
  '55-22=33', '16*3-8=40', '40+25=65', '80/4+5=25', '27+36=63',
  '7*7+11=60', '90-45=45', '13*4-2=50', '36/6+9=15', '54-18=36',
  '21+49=70', '6*8-18=30', '42+38=80', '75/5+5=20', '29+31=60',
  '8*8-14=50', '63-27=36', '11*5+5=60', '56/7+7=15', '34+28=62',
]

// Curated 6-character equations (Mini)
const EQUATIONS_6 = [
  '45-9=36', '7*8=56', '12/3=4', '25+5=30', '6*9=54',
  '8+9=17', '60/5=12', '30-8=22', '4*7=28', '15-7=8',
  '9*5=45', '16+8=24', '72/9=8', '33-6=27', '8*8=64',
  '20+9=29', '48/6=8', '50-5=45', '6*6=36', '14+7=21',
  '35/7=5', '40-4=36', '9*9=81', '18+6=24', '54/6=9',
  '27-9=18', '7*5=35', '19+4=23', '42/7=6', '31-8=23',
  '8*6=48', '11+9=20', '63/9=7', '52-8=44', '7*7=49',
  '13+8=21', '32/8=4', '46-7=39', '9*4=36', '17+5=22',
]

/** Hash a date string to pick a deterministic daily puzzle index */
function getDailyIndex(dateStr: string, poolLength: number): number {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % poolLength
}

/** Pure safe expression evaluator without eval() */
function evaluateExpression(expr: string): number | null {
  if (!/^\d+([+\-*/]\d+)*$/.test(expr)) return null

  const tokens = expr.match(/\d+|[+\-*/]/g)
  if (!tokens) return null

  // Reject leading zeroes like 05 unless single digit 0
  for (const tok of tokens) {
    if (/^\d+$/.test(tok) && tok.length > 1 && tok.startsWith('0')) return null
  }

  const nums: number[] = []
  const ops: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) nums.push(parseInt(tokens[i], 10))
    else ops.push(tokens[i])
  }

  // Precedence 1: Multiplication and Division
  const newNums: number[] = [nums[0]]
  const newOps: string[] = []

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    const nextNum = nums[i + 1]
    if (op === '*') {
      newNums[newNums.length - 1] = newNums[newNums.length - 1] * nextNum
    } else if (op === '/') {
      if (nextNum === 0) return null
      if (newNums[newNums.length - 1] % nextNum !== 0) return null // must divide evenly
      newNums[newNums.length - 1] = newNums[newNums.length - 1] / nextNum
    } else {
      newOps.push(op)
      newNums.push(nextNum)
    }
  }

  // Precedence 2: Addition and Subtraction
  let result = newNums[0]
  for (let i = 0; i < newOps.length; i++) {
    const op = newOps[i]
    const nextNum = newNums[i + 1]
    if (op === '+') result += nextNum
    else if (op === '-') result -= nextNum
  }

  if (result < 0 || !Number.isInteger(result)) return null
  return result
}

/** Validate whether a full equation is mathematically correct and well-formed */
function validateEquation(eq: string, targetLength: number): { valid: boolean; error?: string } {
  if (eq.length !== targetLength) {
    return { valid: false, error: `Kulang pa! Dapat ${targetLength} karakter ang equation.` }
  }
  const parts = eq.split('=')
  if (parts.length !== 2) {
    return { valid: false, error: "Kailangan ng eksaktong isang '=' sign!" }
  }
  const [left, right] = parts
  if (!left || !right) {
    return { valid: false, error: "Dapat may math expression bago at pagkatapos ng '='!" }
  }
  if (!/^\d+$/.test(right) || (right.length > 1 && right.startsWith('0'))) {
    return { valid: false, error: "Ang sagot pagkatapos ng '=' ay dapat buong numero lamang." }
  }

  const leftVal = evaluateExpression(left)
  if (leftVal === null) {
    return { valid: false, error: 'Hindi wastong math! Suriin ang mga operator o division.' }
  }
  const rightVal = parseInt(right, 10)
  if (leftVal !== rightVal) {
    return { valid: false, error: `Hindi balance ang equation: ${left} = ${leftVal}, hindi ${rightVal}!` }
  }

  return { valid: true }
}

/** Wordle duplicate letter algorithm for tile feedbacks */
function checkGuess(guess: string, target: string): TileStatus[] {
  const n = target.length
  const res: TileStatus[] = new Array(n).fill('absent')
  const targetChars = target.split('')
  const guessChars = guess.split('')

  // Pass 1: Mark exact matches (Green)
  for (let i = 0; i < n; i++) {
    if (guessChars[i] === targetChars[i]) {
      res[i] = 'correct'
      targetChars[i] = ''
      guessChars[i] = ''
    }
  }

  // Pass 2: Mark present in different position (Purple)
  for (let i = 0; i < n; i++) {
    if (guessChars[i] !== '') {
      const char = guessChars[i]
      const targetIdx = targetChars.indexOf(char)
      if (targetIdx !== -1) {
        res[i] = 'present'
        targetChars[targetIdx] = ''
      }
    }
  }

  return res
}

export function NerdleScreen() {
  const { go, xp, todayXp, nerdleStreak, nerdleLastDate, nerdleWins, nerdlePlayed, set: setGame } = useGame()

  const [length, setLength] = useState<NerdleLength>(8)
  const [isDaily, setIsDaily] = useState<boolean>(true)
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)

  const todayStr = useMemo(() => today(), [])

  // Determine target equation
  const targetEquation = useMemo(() => {
    const pool = length === 8 ? EQUATIONS_8 : EQUATIONS_6
    if (isDaily) {
      const idx = getDailyIndex(todayStr + '-' + length, pool.length)
      return pool[idx]
    }
    // Practice: seeded by practiceIndex
    return pool[practiceIndex % pool.length]
  }, [length, isDaily, todayStr, practiceIndex])

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
      setPracticeIndex(Math.floor(Math.random() * 100))
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
      showToast('Nakopya sa clipboard ang resulta! 📋')
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  return (
    <div className="h-full flex flex-col bg-[#F7F5FA] relative select-none">
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
      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center justify-center p-3">
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
            className="w-full max-w-[360px] mt-3 p-3.5 rounded-2xl bg-white border-2 border-line shadow-md text-center space-y-2.5"
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
                {shareCopied ? 'Nakopya na! ✓' : 'I-share 📋'}
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
    </div>
  )
}
