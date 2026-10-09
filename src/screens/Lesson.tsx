import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { buildLesson, findStage } from '../curriculum/worlds'
import type { Question } from '../engine/types'
import { checkAnswer, type Verdict } from '../engine/check'
import { useGame } from '../store/game'
import { MathField, Tex, type MathFieldHandle } from '../lib/math'
import { MathKeyboard } from '../keyboard/MathKeyboard'
import { Pipo, type Mood } from '../components/Pipo'
import { VisualView } from '../components/Visuals'
import { Button, ProgressBar } from '../components/ui'
import { Icon } from '../components/Icon'
import { RichText } from '../components/RichText'
import { verifyAiMath } from '../engine/solver'
import { isGrounded } from '../ai/guard'
import { gcd, shuffle } from '../engine/rand'
import { aiReady as isAiReady } from '../ai/llm'
import { sfx } from '../lib/sfx'
import { hintMessages, stream, useAi, whyWrongMessages } from '../ai/llm'
import { diagnoseMisconception, type MisconceptionReport } from '../engine/diagnostics'
import { speakText, stopSpeaking } from '../lib/tts'
import { Scratchpad } from '../components/Scratchpad'

const PRAISE = ['Ang galing mo!', 'Tumpak!', 'Lodi!', 'Sakto!', 'Petmalu!', 'Galing-galing!']
const COMFORT = ['Okay lang, matututo tayo!', 'Muntik na!', 'Next time makukuha mo na!']

type Phase = 'answer' | 'correct' | 'wrong'

export function LessonScreen() {
  const { stageId, hearts, loseHeart, finishLesson, go, pushHistory, level, aiLang, practice, completed } = useGame()
  const found = stageId ? findStage(stageId) : null
  const [queue, setQueue] = useState<Question[]>(() => {
    if (!found) return []
    if (!practice) return buildLesson(found.stage)
    // Practice: mix questions from finished stages of this world (or this stage) — no hearts lost
    const pool = found.world.stages.filter((st) => completed[st.id] || st.id === found.stage.id)
    return shuffle(pool.flatMap((st) => buildLesson(st).slice(0, 2))).slice(0, 6)
  })
  const total = useMemo(() => queue.length, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('answer')
  const [value, setValue] = useState<unknown>(null)
  const [latex, setLatex] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [firstTry, setFirstTry] = useState<Set<string>>(new Set())
  const [missed, setMissed] = useState<Set<string>>(new Set())
  const [nudge, setNudge] = useState<string | null>(null)
  const [shake, setShake] = useState(0)
  const [aiText, setAiText] = useState('')
  const [aiOpen, setAiOpen] = useState<null | 'hint' | 'why'>(null)
  const [hintNo, setHintNo] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [diagnostic, setDiagnostic] = useState<MisconceptionReport | null>(null)
  const [speakingTarget, setSpeakingTarget] = useState<'why' | 'hint' | 'diag' | null>(null)
  const [scratchpadOpen, setScratchpadOpen] = useState(false)
  const start = useRef(Date.now())
  const mf = useRef<MathFieldHandle>(null)
  const aiReady = useAi((s) => s.status === 'ready')

  const toggleSpeak = (text: string, target: 'why' | 'hint' | 'diag') => {
    if (speakingTarget === target) {
      stopSpeaking()
      setSpeakingTarget(null)
      return
    }
    sfx.tap()
    speakText(text, {
      onStart: () => setSpeakingTarget(target),
      onEnd: () => setSpeakingTarget(null),
      onError: () => setSpeakingTarget(null),
    })
  }

  if (!found) return null
  const { world, stage } = found
  const q = queue[idx]
  if (import.meta.env.DEV) (window as unknown as { __q: Question }).__q = q
  const progress = correctCount / total

  const CHEER: Mood[] = ['jump', 'thumbsup', 'clap']
  const mood: Mood = phase === 'correct' ? (combo >= 3 ? 'dance' : CHEER[idx % 3]) : phase === 'wrong' ? (idx % 2 ? 'oops' : 'sad') : aiOpen ? 'eureka' : q.kind === 'pizzaChef' ? 'pizza' : q.kind === 'input' ? 'typing' : 'think'

  const answerDisplayLatex = (q: Question) =>
    q.kind === 'input'
      ? q.answers[0]
      : q.kind === 'choice'
        ? q.choices[q.correctIndex].latex ?? ''
        : q.kind === 'pizzaChef'
          ? `\\frac{${q.targetNum}}{${q.targetDen}}`
          : ''

  const current = q.kind === 'input' ? latex : value

  const check = () => {
    if (phase !== 'answer') return
    const v: Verdict = checkAnswer(q, current)
    if (v === 'empty') { setShake((s) => s + 1); return }
    if (v === 'notSimplest') { setNudge('Tama ang value! Pero i-simplify pa sa lowest terms.'); setShake((s) => s + 1); return }
    setNudge(null)
    if (q.kind === 'input' && latex) pushHistory(latex)
    if (v === 'correct') {
      sfx.correct()
      setPhase('correct')
      setCombo((c) => { setBestCombo((b) => Math.max(b, c + 1)); return c + 1 })
      setCorrectCount((c) => c + 1)
      if (!missed.has(q.id)) setFirstTry((s) => new Set(s).add(q.id))
    } else {
      sfx.wrong()
      setTimeout(() => sfx.heart(), 380)
      setPhase('wrong')
      setCombo(0)
      setMissed((s) => new Set(s).add(q.id))
      const diag = diagnoseMisconception(q, current)
      setDiagnostic(diag)
      if (!practice) loseHeart()
      // Duolingo-style: missed questions come back at the end
      setQueue((qs) => [...qs, { ...q, id: q.id }])
    }
  }

  const next = () => {
    stopSpeaking()
    setSpeakingTarget(null)
    setDiagnostic(null)
    setAiOpen(null); setAiText(''); setHintNo(0); setNudge(null)
    const heartsLeft = useGame.getState().hearts
    const seconds = Math.round((Date.now() - start.current) / 1000)
    if (!practice && heartsLeft <= 0 && phase === 'wrong') {
      finishLesson({ stageId: stage.id, correct: firstTry.size, total, xp: correctCount * 5, seconds, failed: true, bestCombo, practice })
      return
    }
    if (idx + 1 >= queue.length) {
      const perfect = missed.size === 0
      const xp = total * 10 + (perfect ? 10 : 0)
      sfx.complete()
      finishLesson({ stageId: stage.id, correct: firstTry.size, total, xp: practice ? total * 5 : xp, seconds, failed: false, bestCombo, practice })
      return
    }
    setIdx(idx + 1)
    setPhase('answer')
    setValue(null)
    setLatex('')
    mf.current?.clear()
  }

  const askHint = async () => {
    const n = hintNo
    setAiOpen('hint')
    setAiText('')
    setHintNo(n + 1)
    const fallback = q.hints[Math.min(n, q.hints.length - 1)]
    const out = await stream(hintMessages(level, q, n, aiLang), setAiText, fallback, 120)
    const src = [q.prompt, q.latex ?? '', q.answerDisplay, ...q.solution, ...q.hints]
    setAiText(isAiReady() && !isGrounded(out, src) ? fallback : verifyAiMath(out).text)
  }

  const askWhy = async () => {
    setAiOpen('why')
    setAiText('')
    const fallback = `Ganito ang tamang paraan:\n${q.solution.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    const typed =
      q.kind === 'input'
        ? latex
        : q.kind === 'choice'
          ? (q.choices[value as number]?.latex ?? q.choices[value as number]?.text ?? '')
          : q.kind === 'pizzaChef' && value && typeof value === 'object' && 'num' in value
            ? `${(value as { num: number; den: number }).num}/${(value as { num: number; den: number }).den}`
            : String(value)
    const out = await stream(whyWrongMessages(level, q, typed, aiLang, diagnostic ?? undefined), setAiText, fallback, 260)
    const src = [q.prompt, q.latex ?? '', q.answerDisplay, typed, ...q.solution, ...q.hints]
    setAiText(isAiReady() && !isGrounded(out, src) ? fallback : verifyAiMath(out).text)
  }

  const quit = () => {
    stopSpeaking()
    go('path')
  }

  return (
    <div className="h-full flex flex-col bg-white relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={quit} className="w-8 h-8 flex items-center justify-center text-ink-soft/70" aria-label="Quit">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" /></svg>
        </button>
        <ProgressBar value={progress} color={combo >= 3 ? 'var(--color-flame)' : world.color} height={18} />
        {practice ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-heart-soft text-heart-dark text-[11px] font-black uppercase"><Icon name="heartPlus" size={20} /> Practice</div>
        ) : (
          <div className="flex items-center gap-1 font-black text-heart text-lg"><Icon name={hearts > 0 ? 'heart' : 'heartBroken'} size={28} />{hearts}</div>
        )}
      </div>
      <AnimatePresence>
        {combo >= 2 && phase === 'correct' && (
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pl-1.5 pr-3 py-1 rounded-full bg-flame text-white font-black text-sm flex items-center gap-1 shadow-[0_3px_0_#D96A00]">
            <Icon name="bolt" size={20} /> {combo} sunod-sunod!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-2 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mb-2" style={{ color: world.colorDark }}>
              {missed.has(q.id) && idx >= total ? (
                <><Icon name="history" size={20} /> Balikan natin</>
              ) : (
                <><span className="px-2 py-0.5 rounded-lg text-white" style={{ background: world.color }}>{q.kind === 'input' ? 'Sagutan' : q.kind === 'choice' ? 'Piliin' : q.kind === 'tiles' ? 'Buuin' : q.kind === 'pizzaChef' ? 'Pizza Chef' : 'I-tap'}</span><Icon name={stage.icon} size={20} /> {stage.title}</>
              )}
            </div>
            <div className="flex items-start gap-3 mb-4">
              <Pipo mood={mood} size={84} className="shrink-0" />
              <div className="relative mt-2 rounded-2xl border-2 border-line px-4 py-3 font-bold text-[17px] leading-snug flex-1">
                {q.prompt}
                <span className="absolute -left-2 top-6 w-4 h-4 rotate-45 bg-white border-l-2 border-b-2 border-line" />
              </div>
            </div>

            {q.visual && <div className="flex justify-center my-4"><VisualView v={q.visual} /></div>}
            {q.latex && q.visual?.type !== 'scale' && q.kind !== 'pizzaChef' && (
              <div className="text-center text-[30px] my-4 font-semibold"><Tex tex={q.latex} /></div>
            )}

            <div key={shake} className={shake ? 'shake' : ''}>
              {q.kind === 'input' && (
                <div className="flex items-center gap-2 mt-2">
                  {q.prefix && <span className="text-2xl font-black text-ink-soft whitespace-nowrap"><Tex tex={q.prefix === '₱' ? '\\text{₱}' : q.prefix} /></span>}
                  <MathField ref={mf} key={q.id + idx} className="flex-1" onChange={setLatex} onEnter={() => (phase === 'answer' ? check() : next())} disabled={phase !== 'answer'} />
                  {q.suffix && <span className="text-xl font-black text-ink-soft">{q.suffix}</span>}
                </div>
              )}
              {q.kind === 'choice' && <ChoiceList q={q} value={value as number | null} onPick={(i) => phase === 'answer' && (sfx.tap(), setValue(i))} locked={phase !== 'answer'} />}
              {q.kind === 'tiles' && <TilesBoard q={q} value={(value as string[]) ?? []} onChange={setValue} locked={phase !== 'answer'} />}
              {q.kind === 'numberline' && <NumberLine q={q} value={value as number | null} onPick={(i) => phase === 'answer' && (sfx.tap(), setValue(i))} />}
              {q.kind === 'pizzaChef' && <PizzaChefBoard q={q} value={value as { den: number; num: number } | null} onChange={(v) => setValue(v)} locked={phase !== 'answer'} />}
            </div>

            {nudge && <div className="mt-3 rounded-xl bg-sun-soft text-ink font-bold px-3 py-2 text-[15px] flex items-center gap-2"><Icon name="bulb" size={22} /> {nudge}</div>}

            {phase === 'answer' && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button onClick={askHint} className="btn3d inline-flex items-center gap-2 pl-2 pr-3 py-1.5 border-2 border-line bg-white font-black text-grape text-sm" style={{ ['--shadow' as string]: '#E0D9E8' }}>
                  <Icon name="bulb" size={22} /> {hintNo === 0 ? 'Hint kay Pipo' : 'Isa pang hint'} {aiReady && <span className="text-[10px] px-1.5 py-0.5 rounded bg-leaf-soft text-leaf-dark">AI</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setScratchpadOpen((o) => !o)}
                  className={`btn3d inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 border-2 font-black text-sm transition-all ${
                    scratchpadOpen ? 'bg-sky-soft border-sky text-sky-dark' : 'bg-white border-line text-ink'
                  }`}
                  style={{ ['--shadow' as string]: scratchpadOpen ? 'var(--color-sky)' : '#E0D9E8' }}
                >
                  <span className="text-base">✏️</span>
                  <span>{scratchpadOpen ? 'Itago ang Kwaderno' : 'Kwaderno (Scratchpad)'}</span>
                </button>
              </div>
            )}

            {/* In-lesson Scratchpad drawing canvas */}
            <Scratchpad open={scratchpadOpen} onClose={() => setScratchpadOpen(false)} />

            {aiOpen === 'hint' && phase === 'answer' && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl bg-[#F2EAFD] border-2 border-grape/30 p-3 font-semibold text-[15px] whitespace-pre-line flex items-start gap-2">
                <Icon name="tutor" size={24} className="shrink-0 mt-0.5" />
                <span className="min-w-0 flex-1">{aiText ? <RichText text={aiText} /> : '…'}</span>
                <button
                  type="button"
                  onClick={() => toggleSpeak(aiText || q.hints[Math.max(0, hintNo - 1)] || '', 'hint')}
                  className={`p-1.5 rounded-xl border border-grape/30 bg-white shrink-0 transition-transform active:scale-95 flex items-center gap-1 ${speakingTarget === 'hint' ? 'text-sky bg-sky-soft animate-pulse' : 'text-ink-soft hover:text-ink'}`}
                  title="Pakinggan si Pipo"
                  aria-label="Pakinggan si Pipo"
                >
                  <Icon name="speaker" size={18} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Answer controls */}
      {q.kind === 'input' ? (
        <MathKeyboard
          tabs={world.tabs}
          onKey={(k) => mf.current?.press(k)}
          onAction={phase === 'answer' ? check : next}
          actionLabel={phase === 'answer' ? 'CHECK' : 'TULOY'}
          history={useGame.getState().history}
        />
      ) : (
        <div className="px-5 pb-6 pt-3 border-t-2 border-line safe-bottom">
          <Button
            tone="leaf"
            className="w-full"
            disabled={
              phase === 'answer' &&
              (value === null ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === 'object' && value !== null && 'num' in value && (value as { num: number }).num === 0))
            }
            onClick={phase === 'answer' ? check : next}
          >
            {phase === 'answer' ? 'Check' : 'Tuloy'}
          </Button>
        </div>
      )}

      {/* Feedback sheet */}
      <AnimatePresence>
        {phase !== 'answer' && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`absolute left-0 right-0 bottom-0 z-30 px-5 pt-4 pb-6 safe-bottom max-h-[88vh] overflow-y-auto no-scrollbar ${phase === 'correct' ? 'bg-leaf-soft' : 'bg-heart-soft'}`}
          >
            <div className={`flex items-center gap-2.5 text-2xl font-black mb-2 ${phase === 'correct' ? 'text-leaf-dark' : 'text-heart-dark'}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${phase === 'correct' ? 'bg-leaf' : 'bg-heart'}`}>
                {phase === 'correct' ? <Icon name="check" size={22} /> : <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6l12 12M18 6 6 18" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>}
              </span>
              {phase === 'correct' ? PRAISE[idx % PRAISE.length] : COMFORT[idx % COMFORT.length]}
            </div>

            {phase === 'wrong' && (
              <div className="text-heart-dark font-bold mb-2.5 text-[15px]">
                Tamang sagot: {answerDisplayLatex(q) ? <Tex tex={answerDisplayLatex(q)} /> : q.answerDisplay}
                {q.kind === 'tiles' && <span className="ml-1"><Tex tex={q.answerSeq[0].join(' ')} /></span>}
              </div>
            )}

            {/* "Bakit Mali Ako?" Misconception Diagnostic AI Card */}
            {phase === 'wrong' && diagnostic && (
              <div className="rounded-2xl bg-white border-2 border-heart/25 p-3.5 mb-3 shadow-[0_2px_8px_rgba(217,51,85,0.08)]">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-line">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide ${diagnostic.badgeBg} ${diagnostic.badgeText}`}>
                      {diagnostic.badge}
                    </span>
                    <span className="font-black text-sm text-ink">{diagnostic.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSpeak(diagnostic.speechText, 'diag')}
                    className={`px-2 py-1 rounded-xl border border-line bg-cloud/50 shrink-0 transition-transform active:scale-95 flex items-center gap-1 ${speakingTarget === 'diag' ? 'text-sky bg-sky-soft animate-pulse' : 'text-ink-soft hover:text-ink'}`}
                    title="Pakinggan si Pipo"
                    aria-label="Pakinggan si Pipo"
                  >
                    <Icon name="speaker" size={18} />
                    <span className="text-[11px] font-black">{speakingTarget === 'diag' ? 'Nagsasalita…' : 'Basahin'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 my-2 text-xs">
                  <div className="p-2 rounded-xl bg-heart-soft/60 border border-heart/20">
                    <div className="font-black uppercase text-[10px] text-heart-dark mb-0.5">Nagawa mo:</div>
                    <div className="font-bold text-ink text-[13px] overflow-x-auto whitespace-nowrap">
                      {diagnostic.userDid.startsWith('\\') || diagnostic.userDid.includes('^') || diagnostic.userDid.includes('\\frac') ? (
                        <Tex tex={diagnostic.userDid} />
                      ) : (
                        diagnostic.userDid
                      )}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-leaf-soft/60 border border-leaf/20">
                    <div className="font-black uppercase text-[10px] text-leaf-dark mb-0.5">Dapat na hakbang:</div>
                    <div className="font-bold text-ink text-[13px] overflow-x-auto whitespace-nowrap">
                      {diagnostic.correctStep.startsWith('\\') || diagnostic.correctStep.includes('^') || diagnostic.correctStep.includes('\\frac') ? (
                        <Tex tex={diagnostic.correctStep} />
                      ) : (
                        diagnostic.correctStep
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[13px] font-semibold text-ink leading-snug mb-2">
                  {diagnostic.taglishSummary}
                </div>
                <div className="text-[11px] font-bold text-ink-soft bg-cloud/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                  <Icon name="bulb" size={16} className="shrink-0 text-sun-dark" />
                  <span>{diagnostic.ruleTip}</span>
                </div>
              </div>
            )}

            {/* Socratic Deep Guidance from Pipo */}
            {phase === 'wrong' && (
              <>
                {aiOpen === 'why' ? (
                  <div className="max-h-44 overflow-y-auto rounded-2xl bg-white p-3 mb-3 font-semibold text-[14px] whitespace-pre-line border-2 border-heart/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-line pb-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-ink">
                        <Icon name="tutor" size={20} /> Paliwanag ni Pipo
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSpeak(aiText || 'Nag-iisip pa si Pipo…', 'why')}
                        className={`px-2 py-0.5 rounded-lg border border-line bg-cloud/50 shrink-0 transition-transform active:scale-95 flex items-center gap-1 ${speakingTarget === 'why' ? 'text-sky bg-sky-soft animate-pulse' : 'text-ink-soft'}`}
                        title="Pakinggan si Pipo"
                      >
                        <Icon name="speaker" size={16} />
                        <span className="text-[10px] font-black">{speakingTarget === 'why' ? 'Nagsasalita…' : 'Makinig'}</span>
                      </button>
                    </div>
                    <span className="min-w-0">{aiText ? <RichText text={aiText} /> : 'Nag-iisip si Pipo…'}</span>
                  </div>
                ) : (
                  <button onClick={askWhy} className="btn3d mb-3 w-full justify-center inline-flex items-center gap-2 px-3 py-1.5 bg-white font-black text-heart-dark text-sm border-2 border-heart/30" style={{ ['--shadow' as string]: 'rgba(217,51,85,.25)' }}>
                    <Icon name="tutor" size={20} /> {aiReady ? 'Tanungin si Pipo (AI Socratic Guide)' : 'Bakit mali? (Buong paliwanag ni Pipo)'}
                  </button>
                )}
              </>
            )}

            {phase === 'correct' && q.solution.length > 0 && (
              <div className="text-leaf-dark font-bold text-[15px] mb-3 opacity-90">{q.solution[q.solution.length - 1]}</div>
            )}
            <Button tone={phase === 'correct' ? 'leaf' : 'heart'} className="w-full" onClick={next}>
              {phase === 'correct' ? 'Tuloy' : 'Sige, gets ko na'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChoiceList({ q, value, onPick, locked }: { q: Extract<Question, { kind: 'choice' }>; value: number | null; onPick: (i: number) => void; locked: boolean }) {
  return (
    <div className={`grid gap-3 ${q.choices.length > 3 || q.choices.every((c) => c.latex) ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {q.choices.map((c, i) => {
        const sel = value === i
        const showRight = locked && i === q.correctIndex
        const showWrong = locked && sel && i !== q.correctIndex
        return (
          <button key={i} onClick={() => onPick(i)}
            className={`btn3d min-h-16 px-4 py-3 border-2 text-xl bg-white ${showRight ? 'border-leaf bg-leaf-soft' : showWrong ? 'border-heart bg-heart-soft' : sel ? 'border-sky bg-sky-soft' : 'border-line'}`}
            style={{ ['--shadow' as string]: showRight ? 'var(--color-leaf)' : showWrong ? 'var(--color-heart)' : sel ? 'var(--color-sky)' : '#E0D9E8' }}>
            {c.latex ? <Tex tex={c.latex} className="text-2xl" /> : <span className="text-[17px] font-bold">{c.text}</span>}
          </button>
        )
      })}
    </div>
  )
}

function TilesBoard({ q, value, onChange, locked }: { q: Extract<Question, { kind: 'tiles' }>; value: string[]; onChange: (v: string[]) => void; locked: boolean }) {
  // track tiles by pool index so duplicates work
  const [picked, setPicked] = useState<number[]>([])
  const pool = useMemo(() => q.tiles, [q.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const sync = (p: number[]) => { setPicked(p); onChange(p.map((i) => pool[i])) }
  void value
  return (
    <div>
      <div className="min-h-[68px] border-b-2 border-line flex flex-wrap gap-2 pb-2 mb-5 items-end">
        {picked.map((pi, k) => (
          <button key={k} disabled={locked} onClick={() => { sfx.tap(); sync(picked.filter((_, j) => j !== k)) }}
            className="btn3d px-4 py-2 bg-white border-2 border-line text-xl" style={{ ['--shadow' as string]: '#E0D9E8' }}>
            <Tex tex={pool[pi]} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {pool.map((t, i) => {
          const used = picked.includes(i)
          return (
            <button key={i} disabled={locked || used} onClick={() => { sfx.tap(); sync([...picked, i]) }}
              className={`btn3d px-4 py-2 border-2 text-xl ${used ? 'bg-line border-line text-transparent shadow-none' : 'bg-white border-line'}`}
              style={{ ['--shadow' as string]: used ? 'transparent' : '#E0D9E8' }}>
              <span className={used ? 'invisible' : ''}><Tex tex={t} /></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NumberLine({ q, value, onPick }: { q: Extract<Question, { kind: 'numberline' }>; value: number | null; onPick: (i: number) => void }) {
  const ticks = Array.from({ length: q.divisions + 1 }, (_, i) => i)
  return (
    <div className="px-2 py-6">
      <div className="relative h-24">
        <div className="absolute left-0 right-0 top-10 h-1.5 rounded-full bg-ink/70" />
        {ticks.map((i) => {
          const left = `${(i / q.divisions) * 100}%`
          const label = i === 0 ? String(q.min) : i === q.divisions ? String(q.max) : null
          return (
            <button key={i} onClick={() => onPick(i)} className="absolute -translate-x-1/2 top-0 w-10 h-24 flex flex-col items-center" style={{ left }} aria-label={`tick ${i}`}>
              <span className={`transition-all ${value === i ? 'opacity-100 -translate-y-1' : 'opacity-0'}`}><Icon name="pin" size={28} /></span>
              <span className={`w-1.5 h-6 rounded-full -mt-1 ${value === i ? 'bg-sky' : 'bg-ink/70'}`} />
              {label && <span className="mt-1 font-black text-lg">{label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PizzaChefBoard({
  q,
  onChange,
  locked,
}: {
  q: Extract<Question, { kind: 'pizzaChef' }>
  value?: { den: number; num: number } | null
  onChange: (val: { den: number; num: number }) => void
  locked: boolean
}) {
  const [slices, setSlices] = useState<number>(() => q.allowedSlices[0] || q.targetDen)
  const [topped, setTopped] = useState<Set<number>>(new Set())

  const toggleSlice = (i: number) => {
    if (locked) return
    sfx.tap()
    const next = new Set(topped)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setTopped(next)
    onChange({ den: slices, num: next.size })
  }

  const changeSlices = (count: number) => {
    if (locked) return
    sfx.tap()
    setSlices(count)
    setTopped(new Set())
    onChange({ den: count, num: 0 })
  }

  const r = 84, cx = 100, cy = 100
  const slicePaths = Array.from({ length: slices }, (_, i) => {
    const a0 = (i / slices) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 1) / slices) * Math.PI * 2 - Math.PI / 2
    const large = a1 - a0 > Math.PI ? 1 : 0
    const d = `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`
    const isTopped = topped.has(i)
    const mid = (a0 + a1) / 2
    return { d, isTopped, mid }
  })

  const toppedCount = topped.size
  const g = gcd(toppedCount, slices)
  const simplifiedTex = toppedCount > 0 && g > 1 ? ` = \\frac{${toppedCount / g}}{${slices / g}}` : ''

  return (
    <div className="flex flex-col items-center">
      {/* Slicing Controls */}
      {q.allowedSlices.length > 1 && (
        <div className="mb-3 flex items-center gap-1.5 bg-cloud p-1 rounded-2xl border-2 border-line">
          <span className="text-[11px] font-black uppercase text-ink-soft px-2">Hiwain:</span>
          {q.allowedSlices.map((count) => {
            const active = slices === count
            return (
              <button
                key={count}
                type="button"
                disabled={locked}
                onClick={() => changeSlices(count)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  active ? 'bg-sun text-ink shadow-[0_2px_0_var(--color-sun-dark)]' : 'bg-white text-ink-soft hover:text-ink'
                }`}
              >
                {count} hiwa
              </button>
            )
          })}
        </div>
      )}

      {/* Interactive Pizza */}
      <div className="relative select-none touch-manipulation my-1">
        <svg viewBox="0 0 200 200" width="220" height="220" className="drop-shadow-[0_8px_16px_rgba(200,140,60,.25)]">
          {/* Crust background */}
          <circle cx={cx} cy={cy} r={r + 6} fill="#E2A65E" stroke="#C48438" strokeWidth="2.5" />
          {/* Pizza Slices */}
          {slicePaths.map((s, i) => (
            <g
              key={i}
              onClick={() => toggleSlice(i)}
              className="cursor-pointer transition-transform active:scale-[0.98]"
            >
              <path
                d={s.d}
                fill={s.isTopped ? '#FFC83D' : '#FFF5E0'}
                stroke="#C48438"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-colors duration-200"
              />
              {/* Toppings (Pepperoni / Cheese) */}
              {s.isTopped && (
                <>
                  <circle cx={cx + r * 0.58 * Math.cos(s.mid)} cy={cy + r * 0.58 * Math.sin(s.mid)} r="8" fill="#E2483D" />
                  <circle cx={cx + r * 0.58 * Math.cos(s.mid) - 2} cy={cy + r * 0.58 * Math.sin(s.mid) - 2} r="2.5" fill="#FFA59E" opacity="0.8" />
                  {slices <= 6 && (
                    <>
                      <circle cx={cx + r * 0.78 * Math.cos(s.mid + 0.14)} cy={cy + r * 0.78 * Math.sin(s.mid + 0.14)} r="5.5" fill="#E2483D" />
                      <circle cx={cx + r * 0.78 * Math.cos(s.mid + 0.14) - 1.5} cy={cy + r * 0.78 * Math.sin(s.mid + 0.14) - 1.5} r="1.8" fill="#FFA59E" opacity="0.8" />
                    </>
                  )}
                  <circle cx={cx + r * 0.35 * Math.cos(s.mid)} cy={cy + r * 0.35 * Math.sin(s.mid)} r="2" fill="#3DBE6B" />
                </>
              )}
              {/* Subtle tap target dot if untouched */}
              {!s.isTopped && (
                <circle cx={cx + r * 0.58 * Math.cos(s.mid)} cy={cy + r * 0.58 * Math.sin(s.mid)} r="3" fill="#D9CBB0" opacity="0.6" />
              )}
            </g>
          ))}
          {/* Center crust ring */}
          <circle cx={cx} cy={cy} r={6} fill="#E2A65E" stroke="#C48438" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Real-time fraction indicator */}
      <div className="mt-3 px-4 py-2 rounded-2xl bg-sun-soft border-2 border-sun text-ink flex items-center gap-2">
        <Icon name="pizza" size={24} />
        <span className="text-sm font-bold">
          May toppings: <b>{toppedCount}</b> sa <b>{slices}</b>
        </span>
        <span className="text-xl font-bold ml-1">
          <Tex tex={`\\frac{${toppedCount}}{${slices}}${simplifiedTex}`} />
        </span>
      </div>
      <div className="text-[12px] font-bold text-ink-soft mt-1.5 flex items-center gap-1">
        <Icon name="bulb" size={16} /> I-tap ang hiwa para lagyan o alisin ang toppings
      </div>
    </div>
  )
}

