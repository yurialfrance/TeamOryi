import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/game'
import { WORLDS } from '../curriculum/worlds'
import { MathField, Tex, type MathFieldHandle } from '../lib/math'
import { MathKeyboard } from '../keyboard/MathKeyboard'
import { Pipo } from '../components/Pipo'
import { OfflineBadge } from '../components/ui'
import { Icon } from '../components/Icon'
import { RichText } from '../components/RichText'
import { baseMessages, stream, useAi, type AiLang, type ChatMsg } from '../ai/llm'
import { extractMath, solveLatex, verifyAiMath, type CalcResult } from '../engine/solver'
import { AiSetupCard } from './AiSetup'

interface Msg { role: 'user' | 'assistant'; text: string; latex?: string; calc?: CalcResult; fixed?: number; done?: boolean; aiError?: string }

const LANGS: { id: AiLang; label: string }[] = [
  { id: 'taglish', label: 'Taglish' },
  { id: 'english', label: 'English' },
]

/** Explanation used when the AI model is not loaded — built from the calculator steps */
function offlineExplain(calc: CalcResult | undefined, lang: AiLang): string {
  if (!calc) {
    return lang === 'english'
      ? 'I can chat freely once my offline AI is downloaded (see the card above). You can already type any math problem in the math box and I will compute it step by step!'
      : 'Para makapag-chat tayo nang malaya, i-download muna ang offline AI ko sa itaas. Pero pwede ka nang mag-type ng math problem sa math box — ico-compute ko agad step by step!'
  }
  if (calc.kind === 'error') return lang === 'english' ? `Hmm, I couldn't compute that: ${calc.plain}. Please check the expression.` : `Hmm, hindi ko ma-compute: ${calc.plain}. Pakicheck ang expression.`
  return lang === 'english'
    ? `The calculator solved it — follow the steps above. The answer is $${calc.answer}$.`
    : `Na-compute na ng calculator — sundan lang ang steps sa itaas. Ang sagot ay $${calc.answer}$.`
}

function CalcCard({ calc }: { calc: CalcResult }) {
  if (calc.kind === 'error') return null
  const steps = calc.steps.filter((s) => s.label !== 'Sagot')
  return (
    <div className="rounded-2xl bg-white border-2 border-leaf/40 overflow-hidden mb-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-leaf-soft text-leaf-dark text-[11px] font-black uppercase tracking-wider">
        <Icon name="abacus" size={18} /> Sipnayan Calculator
        <span className="ml-auto flex items-center gap-1 normal-case tracking-normal"><Icon name="shield" size={14} /> verified</span>
      </div>
      <ol className="px-3 py-2 space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className="w-5 h-5 shrink-0 rounded-full bg-cloud text-ink-soft text-[11px] font-black flex items-center justify-center translate-y-[-2px]">{i + 1}</span>
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wide text-ink-soft">{s.label}</div>
              <div className="text-[19px] overflow-x-auto no-scrollbar"><Tex tex={s.tex} /></div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mx-3 mb-3 rounded-xl bg-sun-soft border-2 border-sun px-3 py-2 flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wide text-sun-dark">Sagot</span>
        <span className="text-[22px] font-bold overflow-x-auto no-scrollbar"><Tex tex={calc.answer} /></span>
      </div>
    </div>
  )
}

export function TutorScreen() {
  const { level, history, go, aiLang, set, pushHistory } = useGame()
  const [showKb, setShowKb] = useState(true)
  const ai = useAi()
  const ready = ai.status === 'ready'
  const world = WORLDS.find((w) => w.id === level)!
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', done: true, text: 'Hi! Ako si Pipo. Type mo ang math problem sa math box (hal. $2x + 3 = 11$ o $\\sqrt{50}$) — ang calculator ang magco-compute, tapos ipapaliwanag ko.' },
  ])
  const [text, setText] = useState('')
  const [latex, setLatex] = useState('')
  const [busy, setBusy] = useState(false)
  const mf = useRef<MathFieldHandle>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => { scroller.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [msgs])

  const send = async () => {
    if (busy || (!text.trim() && !latex.trim())) return
    const typedMath = latex.trim()
    const mathSrc = typedMath || extractMath(text) || ''
    // 1) CODE computes
    const calc = mathSrc ? solveLatex(mathSrc) : undefined
    if (typedMath) pushHistory(typedMath)
    const user: Msg = { role: 'user', text: text.trim(), latex: typedMath || undefined }
    const prior = msgs.slice(1).filter((m) => m.done || m.role === 'user').slice(-4)
    setMsgs((ms) => [...ms, user, { role: 'assistant', text: '', calc }])
    setText(''); setLatex(''); mf.current?.clear()
    setBusy(true)

    // 2) AI only explains the computed result
    const ask = calc && calc.kind !== 'error'
      ? [
          'CALCULATOR RESULT (correct, do not recompute)',
          `Problem: $${calc.input}$`,
          `Steps: ${calc.steps.filter((s) => s.label !== 'Ibinigay').map((s) => `$${s.tex}$`).join(' → ')}`,
          `Answer: $${calc.answer}$`,
          text.trim() ? `Student's question: ${text.trim()}` : 'Explain this to me.',
        ].join('\n')
      : [text.trim(), typedMath ? `Math: $${typedMath}$` : ''].filter(Boolean).join('\n')
    const chat: ChatMsg[] = [
      ...baseMessages(level, aiLang),
      ...prior.map((m) => ({ role: m.role, content: [m.text, m.latex ? `$${m.latex}$` : ''].filter(Boolean).join('\n') })),
      { role: 'user', content: ask },
    ]
    const update = (t: string, extra: Partial<Msg> = {}) => setMsgs((ms) => [...ms.slice(0, -1), { ...ms[ms.length - 1], text: t, ...extra }])
    useAi.setState({ lastError: undefined })
    const out = await stream(chat, (t) => update(t), offlineExplain(calc, aiLang), 220)
    const aiError = ready ? useAi.getState().lastError : undefined
    // 3) CODE double-checks any numbers the AI wrote
    const checked = verifyAiMath(out)
    update(checked.text, { fixed: checked.fixed, done: true, aiError })
    setBusy(false)
  }

  return (
    <div className="h-full flex flex-col bg-cloud">
      <header className="flex items-center gap-2 px-3 py-2 bg-white border-b-2 border-line">
        <button onClick={() => go('path')} className="w-8 h-8 flex items-center justify-center text-ink-soft" aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <Pipo mood="tutor" size={42} />
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg leading-tight">Tutor si Pipo</div>
          <OfflineBadge ready={ready} />
        </div>
        <button onClick={() => setShowKb((v) => !v)} aria-label="Math keyboard"
          className={`w-11 h-10 rounded-xl border-2 flex items-center justify-center ${showKb ? 'border-sky bg-sky-soft' : 'border-line'}`}>
          <Icon name="abacus" size={26} />
        </button>
      </header>

      <div className="flex justify-center gap-1 py-1.5 bg-white border-b-2 border-line">
        {LANGS.map((l) => (
          <button key={l.id} onClick={() => set({ aiLang: l.id })}
            className={`px-3 py-1 rounded-full text-xs font-black border-2 ${aiLang === l.id ? 'bg-sky text-white border-sky' : 'border-line text-ink-soft'}`}>
            {l.label}
          </button>
        ))}
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">
        {!ready && (
          <div className="rounded-2xl bg-white border-2 border-line p-4">
            <div className="font-black mb-2 flex items-center gap-2"><Icon name="chip" size={26} /> I-on ang offline AI ni Pipo</div>
            <AiSetupCard compact />
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 font-semibold text-[15px] bg-sky text-white">
                {m.text && <RichText text={m.text} />}
                {m.latex && <div className={`text-[22px] ${m.text ? 'mt-1' : ''}`}><Tex tex={m.latex} /></div>}
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <Pipo mood={m.calc?.kind === 'error' ? 'confused' : 'tutor'} size={34} className="shrink-0 mt-1" />
              <div className="max-w-[88%] min-w-0">
                {m.calc && <CalcCard calc={m.calc} />}
                <div className="rounded-2xl rounded-tl-md px-4 py-2.5 font-semibold text-[15px] leading-relaxed bg-white border-2 border-line">
                  {m.text ? <RichText text={m.text} /> : (
                    <span className="inline-flex gap-1 text-ink-soft"><span className="animate-bounce">•</span><span className="animate-bounce [animation-delay:.1s]">•</span><span className="animate-bounce [animation-delay:.2s]">•</span></span>
                  )}
                  {m.done && m.aiError && (
                    <div className="mt-1.5 text-[11px] font-bold text-ink-soft">AI error: {m.aiError}</div>
                  )}
                  {!!m.fixed && (
                    <div className="mt-1.5 text-[11px] font-black text-leaf-dark flex items-center gap-1"><Icon name="shield" size={14} /> Itinama ng calculator ang {m.fixed} numero</div>
                  )}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="bg-white border-t-2 border-line px-3 pt-2 space-y-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Itanong kay Pipo… (hal. Bakit ganito ang sagot?)"
          className="w-full h-11 px-3 rounded-xl bg-cloud border-2 border-line font-semibold outline-none focus:border-sky" />
        <div className={showKb ? '' : 'hidden'}>
          <MathField ref={mf} onChange={setLatex} onEnter={send} placeholder="\text{Math dito…}" className="[&_math-field]:text-[24px] [&_math-field]:py-1.5" />
        </div>
        {!showKb && (
          <button onClick={send} disabled={busy} className="btn3d w-full h-11 mb-2 bg-sky text-white" style={{ ['--shadow' as string]: 'var(--color-sky-dark)' }}>IPADALA</button>
        )}
      </div>
      {showKb && (
        <MathKeyboard
          tabs={world.tabs.includes('advanced') ? world.tabs : [...world.tabs, 'advanced']}
          onKey={(k) => mf.current?.press(k)}
          onAction={send}
          actionLabel={busy ? '…' : 'IPADALA'}
          actionDisabled={busy}
          actionColor="sky"
          history={history}
          onChip={(c) => setText((t) => (t ? t + ' ' : '') + c)}
        />
      )}
    </div>
  )
}
