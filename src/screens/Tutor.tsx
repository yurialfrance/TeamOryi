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
import { DISAGREE, isGrounded, recheckReply, stepLabel, templateExplain } from '../ai/guard'
import { AiSetupCard } from './AiSetup'

type Source = 'ai' | 'verified' | 'recheck'
interface Msg { role: 'user' | 'assistant'; text: string; latex?: string; calc?: CalcResult; fixed?: number; done?: boolean; aiError?: string; source?: Source }

const LANGS: { id: AiLang; label: string }[] = [
  { id: 'taglish', label: 'Taglish' },
  { id: 'english', label: 'English' },
]

const T = {
  taglish: {
    title: 'Tutor si Pipo',
    lang: 'Wika ni Pipo:',
    hello: 'Hi! Ako si Pipo. I-type ang math problem sa math box (hal. $2x + 3 = 11$ o $\\sqrt{50}$) — ang calculator ang magco-compute, tapos ipapaliwanag ko.',
    ask: 'Itanong kay Pipo… (hal. Bakit ganito ang sagot?)',
    math: '\\text{Math dito…}',
    send: 'IPADALA',
    turnOn: 'I-on ang offline AI ni Pipo',
    answer: 'Sagot',
    verifiedNote: 'Verified na paliwanag mula sa calculator',
    recheckNote: 'Ni-recheck ng calculator',
    fixed: (n: number) => `Itinama ng calculator ang ${n} numero`,
    keys: 'Math keys',
    noAi: 'Para makapag-chat tayo nang malaya, i-on muna ang offline AI ko sa itaas. Pero pwede ka nang mag-type ng math problem — ico-compute ko agad step by step!',
    cant: (m: string) => `Hmm, hindi ko ma-compute: ${m}. Pakicheck ang expression.`,
  },
  english: {
    title: 'Pipo the Tutor',
    lang: "Pipo's language:",
    hello: "Hi! I'm Pipo. Type a math problem in the math box (e.g. $2x + 3 = 11$ or $\\sqrt{50}$) — the calculator computes it, then I explain.",
    ask: 'Ask Pipo… (e.g. Why is this the answer?)',
    math: '\\text{Math here…}',
    send: 'SEND',
    turnOn: "Turn on Pipo's offline AI",
    answer: 'Answer',
    verifiedNote: 'Verified explanation from the calculator',
    recheckNote: 'Re-checked by the calculator',
    fixed: (n: number) => `The calculator corrected ${n} number(s)`,
    keys: 'Math keys',
    noAi: 'Turn on my offline AI above so we can chat freely. You can already type any math problem — I will compute it step by step!',
    cant: (m: string) => `Hmm, I couldn't compute that: ${m}. Please check the expression.`,
  },
}

function CalcCard({ calc, lang }: { calc: CalcResult; lang: AiLang }) {
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
              <div className="text-[11px] font-black uppercase tracking-wide text-ink-soft">{stepLabel(s.label, lang)}</div>
              <div className="text-[19px] overflow-x-auto no-scrollbar"><Tex tex={s.tex} /></div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mx-3 mb-3 rounded-xl bg-sun-soft border-2 border-sun px-3 py-2 flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wide text-sun-dark">{T[lang].answer}</span>
        <span className="text-[22px] font-bold overflow-x-auto no-scrollbar"><Tex tex={calc.answer} /></span>
      </div>
    </div>
  )
}

export function TutorScreen() {
  const { level, history, go, aiLang, set, pushHistory } = useGame()
  const L = T[aiLang]
  const [showKb, setShowKb] = useState(true)
  const ai = useAi()
  const ready = ai.status === 'ready'
  const world = WORLDS.find((w) => w.id === level) ?? WORLDS[0]
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', done: true, text: '' }])
  const [text, setText] = useState('')
  const [latex, setLatex] = useState('')
  const [busy, setBusy] = useState(false)
  const mf = useRef<MathFieldHandle>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => { scroller.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [msgs])

  const lastCalc = (): CalcResult | undefined => [...msgs].reverse().find((m) => m.calc && m.calc.kind !== 'error')?.calc

  const send = async () => {
    if (busy || (!text.trim() && !latex.trim())) return
    const typedMath = latex.trim()
    const userText = text.trim()
    const user: Msg = { role: 'user', text: userText, latex: typedMath || undefined }
    setText(''); setLatex(''); mf.current?.clear()
    if (typedMath) pushHistory(typedMath)

    // 0) Learner says "mali" → the CODE re-checks; Pipo does not just agree.
    const prev = lastCalc()
    if (!typedMath && DISAGREE.test(userText) && prev) {
      const again = solveLatex(prev.input)
      setMsgs((ms) => [...ms, user, { role: 'assistant', text: recheckReply(again, userText, aiLang), calc: again, done: true, source: 'recheck' }])
      return
    }

    // 1) CODE computes
    const mathSrc = typedMath || extractMath(userText) || ''
    const calc = mathSrc ? solveLatex(mathSrc) : undefined
    const prior = msgs.slice(1).filter((m) => m.done || m.role === 'user').slice(-4)
    setMsgs((ms) => [...ms, user, { role: 'assistant', text: '', calc }])
    setBusy(true)

    const update = (t: string, extra: Partial<Msg> = {}) => setMsgs((ms) => [...ms.slice(0, -1), { ...ms[ms.length - 1], text: t, ...extra }])

    // Calculator could not parse → no AI guessing
    if (calc?.kind === 'error') {
      update(L.cant(calc.plain), { done: true, source: 'verified' })
      setBusy(false)
      return
    }

    const verified = calc ? templateExplain(calc, aiLang) : L.noAi

    // 2) AI only explains the computed result
    const ask = calc
      ? [
          'CALCULATOR RESULT (correct — do not recompute, do not change any number):',
          `Problem: $${calc.input}$`,
          `Steps: ${calc.steps.filter((s) => s.label !== 'Ibinigay').map((s) => `$${s.tex}$`).join(' → ')}`,
          `Answer: $${calc.answer}$`,
          userText ? `Student says: ${userText}` : 'Explain these steps to the student in 2 short sentences.',
        ].join('\n')
      : [userText, typedMath ? `Math: $${typedMath}$` : ''].filter(Boolean).join('\n')
    const chat: ChatMsg[] = [
      ...baseMessages(level, aiLang),
      ...prior.map((m) => ({ role: m.role, content: [m.text, m.latex ? `$${m.latex}$` : ''].filter(Boolean).join('\n') })),
      { role: 'user', content: ask },
    ]
    useAi.setState({ lastError: undefined })
    const out = await stream(chat, (t) => update(t), verified, 200)
    const aiError = ready ? useAi.getState().lastError : undefined

    // 3) CODE checks the AI: ungrounded numbers/variables → use the verified explanation instead
    if (calc && ready && !aiError) {
      const sources = [calc.input, calc.answer, ...calc.steps.map((s) => s.tex), userText]
      if (!isGrounded(out, sources)) {
        update(verified, { done: true, source: 'verified' })
        setBusy(false)
        return
      }
    }
    const checked = verifyAiMath(out)
    update(checked.text, { fixed: checked.fixed, done: true, aiError, source: ready && !aiError ? 'ai' : 'verified' })
    setBusy(false)
  }

  return (
    <div className="h-full flex flex-col bg-cloud">
      <header className="flex items-center gap-2 px-3 py-2 bg-white border-b-2 border-line">
        <button onClick={() => go('path')} className="w-8 h-8 flex items-center justify-center text-ink-soft" aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <Pipo mood="tutor" size={44} />
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg leading-tight">{L.title}</div>
          <OfflineBadge ready={ready} />
        </div>
        <button onClick={() => setShowKb((v) => !v)} aria-label="Math keyboard"
          className={`h-10 px-2.5 rounded-xl border-2 flex items-center gap-1 text-xs font-black ${showKb ? 'border-sky bg-sky-soft text-sky' : 'border-line text-ink-soft'}`}>
          <Icon name="abacus" size={22} /> {L.keys}
        </button>
      </header>

      <div className="flex items-center justify-center gap-1.5 py-1.5 bg-white border-b-2 border-line">
        <span className="text-[11px] font-black text-ink-soft uppercase tracking-wide">{L.lang}</span>
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
            <div className="font-black mb-2 flex items-center gap-2"><Icon name="chip" size={26} /> {L.turnOn}</div>
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
              <Pipo mood={m.calc?.kind === 'error' ? 'confused' : m.source === 'recheck' ? 'determined' : 'tutor'} size={36} className="shrink-0 mt-1" />
              <div className="max-w-[88%] min-w-0">
                {m.calc && <CalcCard calc={m.calc} lang={aiLang} />}
                <div className="rounded-2xl rounded-tl-md px-4 py-2.5 font-semibold text-[15px] leading-relaxed bg-white border-2 border-line">
                  {i === 0 ? <RichText text={L.hello} /> : m.text ? <RichText text={m.text} /> : (
                    <span className="inline-flex gap-1 text-ink-soft"><span className="animate-bounce">•</span><span className="animate-bounce [animation-delay:.1s]">•</span><span className="animate-bounce [animation-delay:.2s]">•</span></span>
                  )}
                  {m.done && i > 0 && (m.source === 'verified' || m.source === 'recheck') && m.calc && (
                    <div className="mt-1.5 text-[11px] font-black text-leaf-dark flex items-center gap-1"><Icon name="shield" size={14} /> {m.source === 'recheck' ? L.recheckNote : L.verifiedNote}</div>
                  )}
                  {m.done && m.aiError && <div className="mt-1.5 text-[11px] font-bold text-ink-soft">AI error: {m.aiError}</div>}
                  {!!m.fixed && <div className="mt-1.5 text-[11px] font-black text-leaf-dark flex items-center gap-1"><Icon name="shield" size={14} /> {L.fixed(m.fixed)}</div>}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="bg-white border-t-2 border-line px-3 pt-2 pb-2 space-y-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={L.ask}
          className="w-full h-11 px-3 rounded-xl bg-cloud border-2 border-line font-semibold outline-none focus:border-sky" />
        {/* Math box always visible; tapping it brings the keyboard back */}
        <div onPointerDown={() => setShowKb(true)}>
          <MathField ref={mf} onChange={setLatex} onEnter={send} placeholder={L.math} className="[&_math-field]:text-[22px] [&_math-field]:py-1" />
        </div>
        {!showKb && (
          <button onClick={send} disabled={busy} className="btn3d w-full h-11 bg-sky text-white" style={{ ['--shadow' as string]: 'var(--color-sky-dark)' }}>{L.send}</button>
        )}
      </div>
      {showKb && (
        <MathKeyboard
          tabs={world.tabs.includes('advanced') ? world.tabs : [...world.tabs, 'advanced']}
          onKey={(k) => mf.current?.press(k)}
          onAction={send}
          actionLabel={busy ? '…' : L.send}
          actionDisabled={busy}
          actionColor="sky"
          history={history}
          onChip={(c) => setText((t) => (t ? t + ' ' : '') + c)}
        />
      )}
    </div>
  )
}
