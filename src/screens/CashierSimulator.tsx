import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import confetti from 'canvas-confetti'
import { useGame } from '../store/game'
import { Button } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'
import { haptic, sfx } from '../lib/sfx'

type CashierMode = 'easy' | 'medium' | 'hard'

interface Denom {
  id: string
  label: string
  cents: number // In centavos (100 = ₱1.00)
  type: 'bill' | 'coin'
  bg: string
  border: string
  textColor: string
  accent?: string
}

const DENOMINATIONS: Denom[] = [
  // Bills
  { id: 'b1000', label: '₱1,000', cents: 100000, type: 'bill', bg: '#1E58A4', border: '#143C70', textColor: '#FFFFFF', accent: '#6FA4E8' },
  { id: 'b500', label: '₱500', cents: 50000, type: 'bill', bg: '#CCA01A', border: '#8A6A0B', textColor: '#FFFFFF', accent: '#FFE885' },
  { id: 'b200', label: '₱200', cents: 20000, type: 'bill', bg: '#238A4B', border: '#175E33', textColor: '#FFFFFF', accent: '#7CE5A4' },
  { id: 'b100', label: '₱100', cents: 10000, type: 'bill', bg: '#6B3FA0', border: '#46276B', textColor: '#FFFFFF', accent: '#C8A4F8' },
  { id: 'b50', label: '₱50', cents: 5000, type: 'bill', bg: '#C5374C', border: '#882231', textColor: '#FFFFFF', accent: '#FFA6B3' },
  { id: 'b20', label: '₱20', cents: 2000, type: 'bill', bg: '#D36A26', border: '#924615', textColor: '#FFFFFF', accent: '#FFB885' },
  // Coins
  { id: 'c20', label: '₱20', cents: 2000, type: 'coin', bg: '#C4943E', border: '#9E7428', textColor: '#3C3346', accent: '#E8E3EE' },
  { id: 'c10', label: '₱10', cents: 1000, type: 'coin', bg: '#C0BAC6', border: '#8F8798', textColor: '#3C3346', accent: '#D8AA48' },
  { id: 'c5', label: '₱5', cents: 500, type: 'coin', bg: '#C8C4CE', border: '#96909E', textColor: '#3C3346' },
  { id: 'c1', label: '₱1', cents: 100, type: 'coin', bg: '#DDD9E2', border: '#ABA4B4', textColor: '#3C3346' },
  { id: 'c025', label: '25¢', cents: 25, type: 'coin', bg: '#D4A234', border: '#96711E', textColor: '#3C3346' },
]

const DENOM_MAP = new Map(DENOMINATIONS.map((d) => [d.id, d]))

function formatPeso(cents: number): string {
  const p = (cents / 100).toFixed(2)
  const [whole, dec] = p.split('.')
  const formattedWhole = parseInt(whole, 10).toLocaleString('en-PH')
  return `₱${formattedWhole}.${dec}`
}

interface StoreItem {
  id: string
  name: string
  cents: number
  emoji: string
  wholeOnly?: boolean
}

const ITEMS: StoreItem[] = [
  { id: 'canton', name: 'Pancit Canton', cents: 1800, emoji: '🍜', wholeOnly: true },
  { id: 'coke', name: 'Coke Mismo', cents: 1600, emoji: '🥤', wholeOnly: true },
  { id: 'itlog', name: 'Sariwang Itlog', cents: 850, emoji: '🥚' },
  { id: 'kape', name: '3-in-1 Kape', cents: 975, emoji: '☕' },
  { id: 'biskwit', name: 'Rebisco Crackers', cents: 700, emoji: '🍪', wholeOnly: true },
  { id: 'asukal', name: 'Asukal (1 pouch)', cents: 1525, emoji: '🧂' },
  { id: 'mantika', name: 'Mantika (tingi)', cents: 1250, emoji: '🍶' },
  { id: 'kendi', name: 'Maxx Candy (3 pcs)', cents: 300, emoji: '🍬', wholeOnly: true },
  { id: 'sabon', name: 'Tide Sabon Panlaba', cents: 2450, emoji: '🧼' },
  { id: 'bigas', name: 'Bigas (1 kilo)', cents: 5200, emoji: '🌾', wholeOnly: true },
  { id: 'chichirya', name: 'Chichirya', cents: 1050, emoji: '🍿' },
  { id: 'pandesal', name: 'Pandesal (5 pcs)', cents: 1500, emoji: '🥖', wholeOnly: true },
  { id: 'sardinas', name: '555 Sardinas', cents: 2200, emoji: '🐟', wholeOnly: true },
  { id: 'noodles', name: 'Instant Mami', cents: 1400, emoji: '🍲', wholeOnly: true },
]

const CUSTOMER_NAMES = [
  'Nanay Rosa', 'Carlo', 'Maria', 'Mang Jose', 'Ate Bea',
  'Kuya Ben', 'Aling Tess', 'Jomar', 'Lola Remedios', 'Totoy',
]

interface OrderItem {
  item: StoreItem
  qty: number
}

interface CustomerOrder {
  customerName: string
  items: OrderItem[]
  totalCents: number
  paidCents?: number
  targetCents: number
  mode: CashierMode
  instruction: string
}

function generateOrder(mode: CashierMode): CustomerOrder {
  const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]

  if (mode === 'easy') {
    // Whole numbers & Exact payment (e.g. ₱15, ₱25, ₱38, ₱52)
    const pool = ITEMS.filter((it) => it.wholeOnly)
    const chosen1 = pool[Math.floor(Math.random() * pool.length)]
    const chosen2 = Math.random() > 0.4 ? pool[Math.floor(Math.random() * pool.length)] : null

    const items: OrderItem[] = [{ item: chosen1, qty: 1 }]
    if (chosen2 && chosen2.id !== chosen1.id) {
      items.push({ item: chosen2, qty: 1 })
    }

    const totalCents = items.reduce((sum, it) => sum + it.item.cents * it.qty, 0)
    return {
      customerName: name,
      items,
      totalCents,
      targetCents: totalCents,
      mode,
      instruction: `Bumili si ${name} ng halagang ${formatPeso(totalCents)}. Magbabayad siya ng eksakto. Ilapag ang tamang bills at barya sa counter!`,
    }
  }

  if (mode === 'medium') {
    // Giving change (Whole numbers)
    const pool = ITEMS.filter((it) => it.wholeOnly)
    const chosen1 = pool[Math.floor(Math.random() * pool.length)]
    const chosen2 = Math.random() > 0.5 ? pool[Math.floor(Math.random() * pool.length)] : null

    const items: OrderItem[] = [{ item: chosen1, qty: 1 }]
    if (chosen2 && chosen2.id !== chosen1.id) {
      items.push({ item: chosen2, qty: 1 })
    }

    const totalCents = items.reduce((sum, it) => sum + it.item.cents * it.qty, 0)

    // Pick appropriate paying bill
    let paidCents = 5000 // ₱50
    if (totalCents > 19000) {
      paidCents = 50000 // ₱500
    } else if (totalCents > 9000) {
      paidCents = 20000 // ₱200
    } else if (totalCents > 4500) {
      paidCents = 10000 // ₱100
    } else if (totalCents > 1800) {
      paidCents = 5000 // ₱50
    } else {
      paidCents = 2000 // ₱20
    }

    // Ensure paid bill is strictly greater than total
    if (paidCents <= totalCents) {
      paidCents = totalCents <= 5000 ? 10000 : 20000
    }

    const targetCents = paidCents - totalCents
    return {
      customerName: name,
      items,
      totalCents,
      paidCents,
      targetCents,
      mode,
      instruction: `Bumili si ${name} ng ${formatPeso(totalCents)}. Nagbayad siya ng ${formatPeso(paidCents)} bill. Ibigay ang eksaktong sukling ${formatPeso(targetCents)}!`,
    }
  }

  // mode === 'hard': Decimals & Centavos
  const decimalPool = ITEMS.filter((it) => !it.wholeOnly)
  const chosen1 = decimalPool[Math.floor(Math.random() * decimalPool.length)]
  const chosen2 = Math.random() > 0.3 ? ITEMS[Math.floor(Math.random() * ITEMS.length)] : null

  const items: OrderItem[] = [{ item: chosen1, qty: 1 }]
  if (chosen2 && chosen2.id !== chosen1.id) {
    items.push({ item: chosen2, qty: 1 })
  }

  const totalCents = items.reduce((sum, it) => sum + it.item.cents * it.qty, 0)

  let paidCents = 5000
  if (totalCents > 9000) paidCents = 20000
  else if (totalCents > 4500) paidCents = 10000
  else if (totalCents > 1800) paidCents = 5000
  else paidCents = 2000

  if (paidCents <= totalCents) {
    paidCents = totalCents <= 5000 ? 10000 : 20000
  }

  const targetCents = paidCents - totalCents
  return {
    customerName: name,
    items,
    totalCents,
    paidCents,
    targetCents,
    mode,
    instruction: `Bumili si ${name} ng ${formatPeso(totalCents)}. Nag-abot siya ng ${formatPeso(paidCents)} bill. Ilatag ang eksaktong sukli na may sentimo (${formatPeso(targetCents)})!`,
  }
}

export function CashierSimulatorScreen() {
  const { go, xp, todayXp, set: setGame } = useGame()
  const [mode, setMode] = useState<CashierMode>('medium')
  const [order, setOrder] = useState<CustomerOrder>(() => generateOrder('medium'))
  const [placed, setPlaced] = useState<Record<string, number>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const [feedback, setFeedback] = useState<{ status: 'correct' | 'wrong'; msg: string } | null>(null)
  const [customersServed, setCustomersServed] = useState(0)
  const [totalSalesCents, setTotalSalesCents] = useState(0)
  const [activeTab, setActiveTab] = useState<'all' | 'bills' | 'coins'>('all')

  // Calculate current total placed on counter
  const placedCents = useMemo(() => {
    return Object.entries(placed).reduce((sum, [id, count]) => {
      const denom = DENOM_MAP.get(id)
      return sum + (denom ? denom.cents * count : 0)
    }, 0)
  }, [placed])

  const diffCents = order.targetCents - placedCents

  const addDenom = useCallback((id: string) => {
    sfx.tap()
    haptic(10)
    setPlaced((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
    setFeedback(null)
  }, [])

  const removeDenom = useCallback((id: string) => {
    sfx.tap()
    haptic(10)
    setPlaced((prev) => {
      const count = prev[id] ?? 0
      if (count <= 1) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: count - 1 }
    })
    setFeedback(null)
  }, [])

  const clearCounter = useCallback(() => {
    sfx.tap()
    setPlaced({})
    setFeedback(null)
  }, [])

  const handleModeChange = (newMode: CashierMode) => {
    sfx.tap()
    setMode(newMode)
    setPlaced({})
    setFeedback(null)
    setOrder(generateOrder(newMode))
  }

  const handleCheckout = () => {
    if (placedCents === 0) {
      sfx.wrong()
      setFeedback({ status: 'wrong', msg: 'Maglagay muna ng pera o barya sa counter bago i-abot!' })
      return
    }

    if (diffCents === 0) {
      // Exact payment/change!
      sfx.chest()
      sfx.correct()
      haptic(30)
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      })

      setCustomersServed((prev) => prev + 1)
      setTotalSalesCents((prev) => prev + order.totalCents)
      setFeedback({ status: 'correct', msg: `Tumpak! Salamat suki! (+15 XP)` })

      // Award XP
      setGame({ xp: xp + 15, todayXp: todayXp + 15 })

      // Automatically advance to next customer
      setTimeout(() => {
        setPlaced({})
        setFeedback(null)
        setOrder(generateOrder(mode))
      }, 1200)
    } else if (diffCents > 0) {
      sfx.wrong()
      haptic(25)
      setFeedback({
        status: 'wrong',
        msg: `Kulang pa ng ${formatPeso(diffCents)}! Magdagdag pa ng barya o bills.`,
      })
    } else {
      sfx.wrong()
      haptic(25)
      setFeedback({
        status: 'wrong',
        msg: `Sobra ng ${formatPeso(Math.abs(diffCents))}! Magbawas ng pera sa counter.`,
      })
    }
  }

  // Filter denominations according to drawer tab
  const visibleDenoms = useMemo(() => {
    if (activeTab === 'bills') return DENOMINATIONS.filter((d) => d.type === 'bill')
    if (activeTab === 'coins') return DENOMINATIONS.filter((d) => d.type === 'coin')
    return DENOMINATIONS
  }, [activeTab])

  return (
    <div className="h-full flex flex-col bg-[#F7F5FA] relative select-none">
      {/* Top Navigation & Status Bar */}
      <header className="px-3 py-2 bg-white border-b-2 border-line flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
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
          <div className="min-w-0">
            <h1 className="font-black text-sm text-ink leading-tight truncate">Tindahan ni Aling Nena</h1>
            <div className="text-[11px] font-bold text-ink-soft truncate">Cashier Simulator</div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-1 rounded-xl bg-sun-soft text-ink text-xs font-black border border-sun/30 flex items-center gap-1">
            <Icon name="store" size={16} /> {customersServed} suki
          </span>
          <span className="px-2 py-1 rounded-xl bg-leaf-soft text-leaf-dark text-xs font-black border border-leaf/30">
            {formatPeso(totalSalesCents)}
          </span>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {/* Sari-Sari Store Awning Banner */}
        <div className="h-4 w-full bg-[repeating-linear-gradient(45deg,#E03E3E,#E03E3E_16px,#FFFFFF_16px,#FFFFFF_32px)] border-b-2 border-[#B32424] shadow-xs" />

        {/* Difficulty Mode Selector */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-1.5 bg-white border-b border-line">
          <span className="text-[11px] font-black uppercase text-ink-soft shrink-0">Antas:</span>
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {(
              [
                ['easy', 'Tingi (Sakto)'],
                ['medium', 'May Sukli'],
                ['hard', 'Sentimo / Decimals'],
              ] as [CashierMode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`py-1 px-1.5 rounded-xl text-[11px] font-black border-2 transition active:scale-95 cursor-pointer truncate ${
                  mode === m
                    ? 'border-sky bg-sky text-white shadow-xs'
                    : 'border-line bg-cloud text-ink-soft hover:bg-sky-soft/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer & Order Speech Card */}
        <div className="p-3.5 space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={order.customerName + order.totalCents}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border-2 border-line bg-white p-3.5 shadow-xs relative overflow-hidden"
            >
              {/* Customer Avatar & Heading */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-line/60">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-sun-soft border-2 border-sun flex items-center justify-center font-black text-sm text-ink shrink-0">
                    {order.customerName[0]}
                  </div>
                  <div>
                    <div className="font-black text-sm text-ink leading-tight">{order.customerName}</div>
                    <div className="text-[11px] font-bold text-ink-soft">Bumibili sa tindahan</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase text-ink-soft">Kabuuang Bilihin</div>
                  <div className="text-base font-black text-ink leading-none">{formatPeso(order.totalCents)}</div>
                </div>
              </div>

              {/* Items Purchased Pills */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {order.items.map((it) => (
                  <span
                    key={it.item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cloud border border-line text-xs font-bold text-ink"
                  >
                    <span>{it.item.emoji}</span>
                    <span>{it.item.name}</span>
                    <span className="font-black text-ink-soft">({formatPeso(it.item.cents)})</span>
                  </span>
                ))}
              </div>

              {/* Cashier Instruction Bubble */}
              <div className="rounded-xl p-2.5 bg-sky-soft/60 border border-sky/30 flex items-start gap-2.5">
                <Pipo mood="point" size={32} className="shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-ink leading-relaxed">
                  {order.mode === 'easy' ? (
                    <>
                      Magbabayad si {order.customerName} ng sakto:{' '}
                      <span className="font-black text-sky-dark underline decoration-2">{formatPeso(order.targetCents)}</span>.
                      Ilapag ang tamang barya at bills!
                    </>
                  ) : (
                    <>
                      Nag-abot ng{' '}
                      <span className="font-black text-ink px-1 py-0.5 rounded-md bg-white border border-line">
                        {formatPeso(order.paidCents ?? 0)}
                      </span>
                      . Ibigay ang sukling{' '}
                      <span className="font-black text-leaf-dark underline decoration-2">{formatPeso(order.targetCents)}</span>!
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mesa ng Bayaran / Counter (Drop Zone) */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              const id = e.dataTransfer.getData('text/plain')
              if (id && DENOM_MAP.has(id)) addDenom(id)
            }}
            className={`rounded-2xl border-3 border-dashed p-3.5 transition-all bg-white relative ${
              isDragOver
                ? 'border-sky bg-sky-soft/40 ring-4 ring-sky/20 scale-[1.01]'
                : diffCents === 0 && placedCents > 0
                ? 'border-leaf bg-leaf-soft/20 shadow-md ring-2 ring-leaf/30'
                : 'border-line/80 shadow-xs'
            }`}
          >
            {/* Counter Header & Live Tally */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-ink uppercase tracking-wider">Mesa ng Bayaran (Counter)</span>
                {Object.keys(placed).length > 0 && (
                  <button
                    type="button"
                    onClick={clearCounter}
                    className="text-[11px] font-black text-heart hover:underline ml-1 cursor-pointer"
                  >
                    I-clear ↺
                  </button>
                )}
              </div>

              {/* Status Pill */}
              <div className="text-right">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black inline-block transition-all ${
                    placedCents === 0
                      ? 'bg-cloud text-ink-soft border border-line'
                      : diffCents === 0
                      ? 'bg-leaf text-white shadow-xs animate-bounce'
                      : diffCents > 0
                      ? 'bg-sun-soft text-ink border border-sun/40'
                      : 'bg-heart-soft text-heart border border-heart/40'
                  }`}
                >
                  {placedCents === 0
                    ? `Target: ${formatPeso(order.targetCents)}`
                    : diffCents === 0
                    ? '🎉 Tumpak! Sakto!'
                    : diffCents > 0
                    ? `Kulang ng ${formatPeso(diffCents)}`
                    : `Sobra ng ${formatPeso(Math.abs(diffCents))}`}
                </span>
              </div>
            </div>

            {/* Placed Money Chips Area */}
            <div className="min-h-[74px] rounded-xl bg-cloud/50 border border-line/60 p-2 flex flex-wrap gap-2 items-center justify-center">
              {Object.keys(placed).length === 0 ? (
                <div className="text-center text-xs font-bold text-ink-soft/70 py-2">
                  Mag-drag o mag-tap ng barya at bills mula sa kaha sa ibaba.
                </div>
              ) : (
                Object.entries(placed).map(([id, count]) => {
                  const denom = DENOM_MAP.get(id)
                  if (!denom || count <= 0) return null
                  return (
                    <motion.button
                      key={id}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      type="button"
                      onClick={() => removeDenom(id)}
                      className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 transition active:scale-95 shadow-xs cursor-pointer hover:border-heart hover:brightness-95"
                      style={{
                        backgroundColor: denom.type === 'bill' ? denom.bg : denom.bg,
                        borderColor: denom.border,
                        color: denom.textColor,
                      }}
                      title="Pindutin para ibalik sa kaha"
                    >
                      <span className="font-black text-xs leading-none">{denom.label}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-black/25 text-white">
                        ×{count}
                      </span>
                      <span className="text-[10px] text-white/80 opacity-0 group-hover:opacity-100 transition">✕</span>
                    </motion.button>
                  )
                })
              )}
            </div>

            {/* Live Numerical Counter Bar */}
            <div className="mt-2.5 pt-2 border-t border-line/50 flex items-center justify-between text-xs">
              <span className="font-bold text-ink-soft">
                Nailatag:{' '}
                <span className="font-black text-ink text-sm">{formatPeso(placedCents)}</span>
              </span>
              <span className="font-bold text-ink-soft">
                Target:{' '}
                <span className="font-black text-sky-dark text-sm">{formatPeso(order.targetCents)}</span>
              </span>
            </div>

            {/* Feedback Alert if any */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-2 p-2 rounded-xl text-xs font-black text-center ${
                  feedback.status === 'correct' ? 'bg-leaf-soft text-leaf-dark' : 'bg-heart-soft text-heart'
                }`}
              >
                {feedback.msg}
              </motion.div>
            )}

            {/* Hand-Over Checkout Button */}
            <div className="mt-3">
              <Button
                tone={diffCents === 0 && placedCents > 0 ? 'leaf' : 'sky'}
                className="w-full text-base font-black shadow-sm"
                onClick={handleCheckout}
              >
                {order.mode === 'easy' ? 'I-abot ang Bayad' : 'I-abot ang Sukli'} ({formatPeso(placedCents)})
              </Button>
            </div>
          </div>
        </div>

        {/* Kaha ng Pera (Cashier Drawer / Denominations Tray) */}
        <div className="mt-auto bg-white border-t-2 border-line p-3.5 space-y-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="coins" size={20} />
              <span className="font-black text-xs uppercase tracking-wider text-ink">Kaha ng Pera (Drawer)</span>
            </div>

            {/* Tabs for Bill/Coin toggle */}
            <div className="flex rounded-lg bg-cloud p-0.5 border border-line text-[11px] font-black">
              {(['all', 'bills', 'coins'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    sfx.tap()
                    setActiveTab(t)
                  }}
                  className={`px-2.5 py-0.5 rounded-md transition cursor-pointer capitalize ${
                    activeTab === t ? 'bg-white shadow-xs text-sky' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {t === 'all' ? 'Lahat' : t === 'bills' ? 'Bills' : 'Barya'}
                </button>
              ))}
            </div>
          </div>

          {/* Denominations Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-0.5">
            {visibleDenoms.map((d) => {
              const countOnCounter = placed[d.id] ?? 0
              return (
                <button
                  key={d.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', d.id)
                  }}
                  onClick={() => addDenom(d.id)}
                  className={`relative p-2 rounded-xl border-2 flex flex-col items-center justify-center transition active:scale-95 hover:brightness-105 shadow-xs cursor-pointer select-none ${
                    d.type === 'bill' ? 'h-14' : 'h-14 rounded-2xl'
                  }`}
                  style={{
                    backgroundColor: d.bg,
                    borderColor: d.border,
                    color: d.textColor,
                  }}
                  title={`I-drag o i-tap para ilagay ang ${d.label}`}
                >
                  {/* Subtle Banknote / Coin Embellishment */}
                  {d.type === 'bill' ? (
                    <div className="w-full flex items-center justify-between px-1 pointer-events-none">
                      <span className="text-[10px] font-black opacity-85">₱</span>
                      <span className="font-black text-sm tracking-wide">{d.label.replace('₱', '')}</span>
                      <span className="text-[10px] font-black opacity-85">PHP</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-black text-sm leading-tight">{d.label}</span>
                      <span className="text-[9px] font-black opacity-75 uppercase">Barya</span>
                    </div>
                  )}

                  {/* Count indicator on drawer button if placed */}
                  {countOnCounter > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-sun text-ink border-2 border-white shadow-xs">
                      {countOnCounter}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="text-center text-[10px] font-bold text-ink-soft pt-1">
            Tip: Maaaring mag-drag & drop o i-tap ang barya/bill upang ilagay sa counter.
          </div>
        </div>
      </main>
    </div>
  )
}
