import { useEffect, useRef, useState } from 'react'
import type { KeyboardTab } from '../engine/types'
import { LAYOUTS, QUICK_CHIPS, type KeyDef } from './layouts'
import { Tex } from '../lib/math'
import { haptic, sfx } from '../lib/sfx'
import { Icon } from '../components/Icon'

interface Props {
  tabs: KeyboardTab[]
  onKey: (k: KeyDef) => void
  onAction: () => void
  actionLabel?: string
  actionDisabled?: boolean
  actionColor?: 'leaf' | 'sky'
  history?: string[]
  onChip?: (text: string) => void
}

const TAB_LABEL: Record<KeyboardTab, React.ReactNode> = {
  history: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-label="History">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  basic: <span className="leading-[0.95] text-[13px] font-black tracking-wider text-center block">1 2<br />= +</span>,
  algebra: <span className="text-lg font-black italic">x²</span>,
  advanced: <span className="text-lg font-black italic">ƒ π</span>,
  abc: <span className="text-sm font-black">abc</span>,
  quick: <Icon name="bolt" size={24} />,
}

function KeyFace({ k }: { k: KeyDef }) {
  return k.tex ? <Tex tex={k.tex} /> : <span>{k.label}</span>
}

function Key({ k, onKey }: { k: KeyDef; onKey: (k: KeyDef) => void }) {
  const timer = useRef<number | null>(null)
  const longFired = useRef(false)
  const [pressed, setPressed] = useState(false)

  const start = () => {
    setPressed(true)
    longFired.current = false
    if (k.alt) {
      timer.current = window.setTimeout(() => {
        longFired.current = true
        haptic(18)
        onKey(k.alt!)
      }, 420)
    }
  }
  const end = (fire: boolean) => {
    setPressed(false)
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (fire && !longFired.current) {
      haptic(8)
      sfx.key()
      onKey(k)
    }
  }
  const color =
    k.kind === 'op' ? 'text-sky' : k.kind === 'fn' ? 'text-grape' : k.kind === 'var' ? 'text-ink italic' : 'text-ink'

  const hasAlt = !!k.alt
  const isComplexMath = k.tex && (k.tex.includes('\\sqrt') || k.tex.includes('\\frac'))

  return (
    <button
      type="button"
      onPointerDown={(e) => { e.preventDefault(); start() }}
      onPointerUp={() => end(true)}
      onPointerLeave={() => pressed && end(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative h-[52px] rounded-xl bg-white font-extrabold select-none touch-none flex items-center justify-center
        shadow-[0_3px_0_#D9D1E3] transition-transform duration-75 ${pressed ? 'translate-y-[3px] shadow-none bg-sky-soft' : ''} ${color}`}
    >
      <div className={`flex items-center justify-center leading-none ${
        isComplexMath && hasAlt
          ? 'text-[17px] translate-y-[3.5px] -translate-x-[2.5px]'
          : hasAlt
            ? 'text-[19px] translate-y-[2px] -translate-x-[1px]'
            : 'text-[21px]'
      }`}>
        <KeyFace k={k} />
      </div>
      {k.alt && (
        <span className="key-alt-badge absolute top-1 right-1 pointer-events-none flex items-center justify-end origin-top-right transform scale-[0.48] text-ink-soft/75 select-none">
          <KeyFace k={k.alt} />
        </span>
      )}
    </button>
  )
}

function ActionKey({ label, onPress, wide, children, tone = 'plain' }: { label: string; onPress: () => void; wide?: boolean; children: React.ReactNode; tone?: 'plain' }) {
  void tone
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); haptic(8); onPress() }}
      className={`h-[50px] rounded-xl bg-[#E7E1EF] text-ink-soft font-black flex items-center justify-center shadow-[0_3px_0_#CFC6DA] active:translate-y-[3px] active:shadow-none ${wide ? 'col-span-2' : ''}`}
    >
      {children}
    </button>
  )
}

export function MathKeyboard({ tabs, onKey, onAction, actionLabel = 'CHECK', actionDisabled, actionColor = 'leaf', history = [], onChip }: Props) {
  const allTabs: KeyboardTab[] = ['history', ...tabs, ...(onChip ? (['quick'] as KeyboardTab[]) : [])]
  const [tab, setTab] = useState<KeyboardTab>(tabs[0] ?? 'basic')
  const [prevTab, setPrevTab] = useState<KeyboardTab>(tab)
  useEffect(() => { if (!allTabs.includes(tab) && tab !== 'abc') setTab(tabs[0] ?? 'basic') }, [tabs.join()]) // eslint-disable-line

  const backTimer = useRef<number | null>(null)
  const grid = tab === 'history' || tab === 'quick' ? null : LAYOUTS[tab]

  return (
    <div className="bg-[#F1EDF6] border-t-2 border-line safe-bottom select-none">
      {/* Tabs — like Symbolab: icon tabs with an underline on the active one */}
      <div className="flex justify-center gap-1 px-2 pt-1">
        {allTabs.map((t) => (
          <button
            key={t}
            type="button"
            onPointerDown={(e) => { e.preventDefault(); setTab(t) }}
            className={`relative w-16 h-11 flex items-center justify-center transition-colors ${tab === t ? 'text-sky' : 'text-ink-soft'}`}
          >
            {TAB_LABEL[t]}
            <span className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-full transition-all ${tab === t ? 'bg-sky' : 'bg-transparent'}`} />
          </button>
        ))}
      </div>

      <div className="px-2 pt-2 pb-1">
        {grid && (
          <div className="grid grid-cols-7 gap-1.5">
            {grid.flat().map((k, i) => <Key key={tab + i} k={k} onKey={onKey} />)}
          </div>
        )}
        {tab === 'history' && (
          <div className="h-[226px] overflow-y-auto no-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-ink-soft font-bold text-sm gap-1">
                <Icon name="history" size={40} />Wala pang history. Sagutan muna!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <button key={i} type="button" onPointerDown={(e) => { e.preventDefault(); onKey({ ins: h }) }}
                    className="px-3 py-2 rounded-xl bg-white shadow-[0_3px_0_#D9D1E3] text-lg active:translate-y-[3px] active:shadow-none">
                    <Tex tex={h} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === 'quick' && (
          <div className="h-[226px] overflow-y-auto no-scrollbar">
            <div className="text-ink font-black mb-2 text-[15px]">Itanong kay Pipo:</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_CHIPS.map((c) => (
                <button key={c} type="button" onPointerDown={(e) => { e.preventDefault(); onChip?.(c) }}
                  className="px-4 py-2 rounded-full bg-white text-ink font-bold shadow-[0_3px_0_#D9D1E3] active:translate-y-[3px] active:shadow-none">
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action row: ABC ← → ⌫ CHECK */}
      <div className="grid grid-cols-7 gap-1.5 px-2 pb-2 pt-1">
        <ActionKey label="Letters" onPress={() => { if (tab === 'abc') setTab(prevTab); else { setPrevTab(tab); setTab('abc') } }}>
          <span className={`text-sm ${tab === 'abc' ? 'text-sky' : ''}`}>{tab === 'abc' ? '123' : 'ABC'}</span>
        </ActionKey>
        <ActionKey label="Left" onPress={() => onKey({ action: 'left' })}><span className="text-2xl">←</span></ActionKey>
        <ActionKey label="Right" onPress={() => onKey({ action: 'right' })}><span className="text-2xl">→</span></ActionKey>
        <button
          type="button"
          aria-label="Backspace (hold to clear)"
          onPointerDown={(e) => {
            e.preventDefault(); haptic(8); onKey({ action: 'back' })
            backTimer.current = window.setTimeout(() => { haptic(25); onKey({ action: 'clear' }) }, 550)
          }}
          onPointerUp={() => backTimer.current && clearTimeout(backTimer.current)}
          onPointerLeave={() => backTimer.current && clearTimeout(backTimer.current)}
          className="h-[50px] rounded-xl bg-[#E7E1EF] text-ink-soft flex items-center justify-center shadow-[0_3px_0_#CFC6DA] active:translate-y-[3px] active:shadow-none"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"><path d="M21 5H9l-6 7 6 7h12z" /><path d="m15 9-4 6M11 9l4 6" /></svg>
        </button>
        <button
          type="button"
          disabled={actionDisabled}
          onPointerDown={(e) => { e.preventDefault(); if (!actionDisabled) { haptic(12); onAction() } }}
          style={{ ['--shadow' as string]: actionColor === 'leaf' ? 'var(--color-leaf-dark)' : 'var(--color-sky-dark)' }}
          className={`btn3d col-span-3 h-[50px] text-white text-lg ${actionColor === 'leaf' ? 'bg-leaf' : 'bg-sky'}`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
