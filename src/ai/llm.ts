// Local, on-device AI. Nothing leaves the device.
//  - GPU path: WebLLM (WebGPU) — fast, needs a WebGPU browser
//  - CPU path: wllama (llama.cpp → WebAssembly) — works in ANY modern browser, slower
import { create } from 'zustand'
import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm'
import type { Wllama } from '@wllama/wllama/esm/index.js'
import type { Question } from '../engine/types'
import type { MisconceptionReport } from '../engine/diagnostics'

export type Backend = 'gpu' | 'cpu'
export interface ModelInfo { id: string; label: string; size: string; note: string; noteEn: string; backend: Backend; hf?: { repo: string; file: string } }

export const MODELS: ModelInfo[] = [
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Pipo Smart (1.5B)', size: '≈ 1.0 GB', note: 'Pinakamagaling mag-explain · WebGPU', noteEn: 'Best explanations · WebGPU', backend: 'gpu' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Pipo Lite (0.5B)', size: '≈ 0.4 GB', note: 'Para sa mas mahinang device · WebGPU', noteEn: 'For lighter devices · WebGPU', backend: 'gpu' },
  {
    id: 'cpu-qwen2.5-0.5b',
    label: 'Pipo CPU (0.5B)',
    size: '≈ 0.5 GB',
    note: 'Gumagana kahit walang WebGPU · mas mabagal',
    noteEn: 'Works without WebGPU · slower',
    backend: 'cpu',
    hf: { repo: 'Qwen/Qwen2.5-0.5B-Instruct-GGUF', file: 'qwen2.5-0.5b-instruct-q4_k_m.gguf' },
  },
]
export const modelInfo = (id: string) => MODELS.find((m) => m.id === id) ?? MODELS[0]

type Status = 'idle' | 'checking' | 'unsupported' | 'loading' | 'ready' | 'error'

interface AiState {
  status: Status
  progress: number
  progressText: string
  error: string | null
  modelId: string | null
  backend: Backend | null
  gpu: boolean | null
  lastError?: string
}

export const useAi = create<AiState>(() => ({ status: 'idle', progress: 0, progressText: '', error: null, modelId: null, backend: null, gpu: null }))

let engine: WebWorkerMLCEngine | null = null
let cpu: Wllama | null = null
let loading: Promise<void> | null = null
const CPU_CACHED_KEY = 'sipnayan-cpu-model-cached'

export async function webgpuSupported(): Promise<boolean> {
  let ok = false
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
    ok = !!gpu && !!(await gpu.requestAdapter())
  } catch {
    ok = false
  }
  useAi.setState({ gpu: ok })
  return ok
}

/** Pick the best model for this device: GPU model if WebGPU exists, otherwise the CPU model */
export async function bestModelFor(preferred: string): Promise<string> {
  const gpu = await webgpuSupported()
  const info = modelInfo(preferred)
  if (!gpu && info.backend === 'gpu') return 'cpu-qwen2.5-0.5b'
  return preferred
}

export async function isModelCached(modelId: string) {
  if (modelInfo(modelId).backend === 'cpu') {
    try { return localStorage.getItem(CPU_CACHED_KEY) === '1' } catch { return false }
  }
  try {
    const { hasModelInCache } = await import('@mlc-ai/web-llm')
    return await hasModelInCache(modelId)
  } catch {
    return false
  }
}

async function loadCpu(info: ModelInfo) {
  const [{ Wllama }, wasm] = await Promise.all([
    import('@wllama/wllama/esm/index.js'),
    import('@wllama/wllama/esm/wasm/wllama.wasm?url'),
  ])
  cpu = new Wllama({ default: wasm.default }, { allowOffline: true, parallelDownloads: 3 })
  await cpu.loadModelFromHF(info.hf!, {
    n_ctx: 2048,
    n_gpu_layers: 0,
    useCache: true,
    progressCallback: ({ loaded, total }: { loaded: number; total: number }) =>
      useAi.setState({ progress: total ? loaded / total : 0, progressText: `Dina-download ang CPU model… ${(loaded / 1e6).toFixed(0)} / ${(total / 1e6).toFixed(0)} MB` }),
  } as never)
  try { localStorage.setItem(CPU_CACHED_KEY, '1') } catch { /* ignore */ }
}

export function loadModel(modelId: string): Promise<void> {
  const info = modelInfo(modelId)
  if ((engine || cpu) && useAi.getState().modelId === modelId && useAi.getState().status === 'ready') return Promise.resolve()
  if (loading) return loading
  loading = (async () => {
    useAi.setState({ status: 'checking', error: null })
    if (info.backend === 'gpu' && !(await webgpuSupported())) {
      useAi.setState({ status: 'unsupported' })
      return
    }
    useAi.setState({ status: 'loading', progress: 0, progressText: 'Sinisimulan…', modelId, backend: info.backend })
    try {
      if (info.backend === 'cpu') {
        await loadCpu(info)
      } else {
        const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')
        const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
        engine = await CreateWebWorkerMLCEngine(worker, modelId, {
          initProgressCallback: (p) => useAi.setState({ progress: p.progress, progressText: p.text }),
        })
      }
      useAi.setState({ status: 'ready', progress: 1 })
    } catch (e) {
      engine = null
      cpu = null
      useAi.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) })
    } finally {
      loading = null
    }
  })()
  return loading
}

export const aiReady = () => (!!engine || !!cpu) && useAi.getState().status === 'ready'

/**
 * Word-problem stories ("Kwento ni Pipo") are written ONLY by the 1.5B WebGPU model. Tested on real
 * output: the 0.5B models (WebGPU Lite and the CPU build) produced Tagalog-shaped noise and took
 * 1–3 minutes per story on CPU, so with them the plain code-written story is used instead.
 */
export const STORY_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC'
export const storyModelReady = () => aiReady() && useAi.getState().backend === 'gpu' && useAi.getState().modelId === STORY_MODEL

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

/** System first, then strictly alternating user/assistant, ending with user (merges duplicates) */
function tidy(messages: ChatMsg[]): ChatMsg[] {
  const sys = messages.filter((m) => m.role === 'system')
  const rest: ChatMsg[] = []
  for (const m of messages.filter((x) => x.role !== 'system' && x.content.trim())) {
    const last = rest[rest.length - 1]
    if (last && last.role === m.role) last.content += '\n' + m.content
    else if (!last && m.role === 'assistant') continue
    else rest.push({ ...m })
  }
  return [...sys.slice(0, 1), ...rest]
}

// ---------------------------------------------------------------- one job at a time
// WebLLM and wllama each run ONE generation at a time. Live requests (Tutor, hints, "bakit mali")
// always win: they interrupt a running background job (word-problem stories) and go first.
let chain: Promise<unknown> = Promise.resolve()
let liveWaiting = 0
let stopBackground: (() => void) | null = null
function exclusive<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job)
  chain = run.catch(() => undefined)
  return run
}

/** Stream a completion. Falls back to `fallback` text (typed out) when the model isn't ready. */
export async function stream(messages: ChatMsg[], onText: (full: string) => void, fallback: string, maxTokens = 220): Promise<string> {
  if (aiReady()) {
    liveWaiting++
    stopBackground?.()
    try {
      return await exclusive(() => streamNow(messages, onText, fallback, maxTokens))
    } finally {
      liveWaiting--
    }
  }
  return streamNow(messages, onText, fallback, maxTokens)
}

/**
 * Background, non-streaming generation (word-problem stories). Yields to live requests: returns
 * null without running if one is waiting, and is interrupted (→ null) if one arrives mid-way.
 * Never throws; null means "no text — use the deterministic fallback".
 */
export async function generate(messages: ChatMsg[], opts: { temperature?: number; maxTokens?: number } = {}): Promise<string | null> {
  if (!aiReady() || liveWaiting > 0) return null
  return exclusive(async () => {
    if (!aiReady() || liveWaiting > 0) return null
    let aborted = false
    const ctrl = new AbortController()
    stopBackground = () => {
      aborted = true
      ctrl.abort()
      void engine?.interruptGenerate()
    }
    try {
      const msgs = tidy(messages)
      const params = { messages: msgs, temperature: opts.temperature ?? 0.7, top_p: 0.95, max_tokens: opts.maxTokens ?? 90 }
      let text = ''
      if (useAi.getState().backend === 'cpu' && cpu) {
        const r = (await cpu.createChatCompletion({ ...params, stream: false, abortSignal: ctrl.signal } as never)) as unknown as { choices: { message?: { content?: string } }[] }
        text = r.choices[0]?.message?.content ?? ''
      } else if (engine) {
        const r = await engine.chat.completions.create({ ...params, stream: false })
        text = r.choices[0]?.message?.content ?? ''
      }
      return aborted ? null : text
    } catch (e) {
      if (!aborted) console.warn('[Pipo AI] background generation failed', e)
      return null
    } finally {
      stopBackground = null
    }
  })
}

async function streamNow(messages: ChatMsg[], onText: (full: string) => void, fallback: string, maxTokens: number): Promise<string> {
  if (!aiReady()) {
    let out = ''
    for (const word of fallback.split(/(\s+)/)) {
      out += word
      onText(out)
      await new Promise((r) => setTimeout(r, 18))
    }
    return out
  }
  let out = ''
  try {
    messages = tidy(messages)
    if (useAi.getState().backend === 'cpu' && cpu) {
      const chunks = (await cpu.createChatCompletion({ messages, stream: true, temperature: 0.3, top_p: 0.9, max_tokens: maxTokens } as never)) as unknown as AsyncIterable<{ choices: { delta?: { content?: string } }[] }>
      for await (const c of chunks) {
        out += c.choices[0]?.delta?.content ?? ''
        onText(out)
      }
    } else {
      const chunks = await engine!.chat.completions.create({ messages, stream: true, temperature: 0.3, top_p: 0.9, max_tokens: maxTokens })
      for await (const c of chunks) {
        out += c.choices[0]?.delta?.content ?? ''
        onText(out)
      }
    }
  } catch (e) {
    console.warn('[Pipo AI] generation failed, using fallback', e)
    useAi.setState({ lastError: e instanceof Error ? e.message : String(e) })
    out = fallback
    onText(out)
  }
  return out
}

export type AiLang = 'taglish' | 'english'

/**
 * Who Pipo is talking to, from a Landas island id (grade1…grade10, or an SHS / college sampler).
 * The old band ids (elem, jhs…) are mapped too, for anything still passing them.
 */
export function audience(level: string): string {
  const legacy: Record<string, number> = { primary: 2, elem: 4, inter: 6, jhs: 7, g9: 9 }
  const g = Number(/^grade(\d+)$/.exec(level)?.[1] ?? legacy[level] ?? NaN)
  if (g >= 1 && g <= 3) return `a Grade ${g} child (age ${g + 5}–${g + 6}; use very short sentences and very simple words)`
  if (g >= 4 && g <= 6) return `a Grade ${g} child (use simple words)`
  if (g >= 7 && g <= 10) return `a Grade ${g} student`
  if (['shs', 'genmath', 'stats', 'stem'].includes(level)) return 'a Senior High School student'
  if (['college', 'mmw'].includes(level)) return 'a college freshman'
  return 'a student'
}

export const LANG_RULE: Record<AiLang, string> = {
  // Was "mostly short, simple English sentences with Filipino words mixed in" — the model obeyed and
  // answered in English. Taglish = Filipino sentence structure, English math words.
  taglish:
    'Reply ONLY in natural Taglish like a friendly Filipino tutor: build every sentence in Filipino (use words like "ang", "ng", "natin", "ito", "kasi", "tapos", "kaya", "lang", "una", "sunod") and keep math words in English (factor, term, equation, fraction). Example style: "Una, i-factor natin ang 2 sa bawat term." NEVER answer in full English sentences. NEVER use deep, formal, or made-up Tagalog words.',
  english: 'Reply in simple, friendly English.',
}

/** Repeated at the END of every request — small models follow the last message far more than the system prompt */
export const LANG_REMINDER: Record<AiLang, string> = {
  taglish: 'Sagutin sa Taglish (Filipino ang pangungusap, English ang math words). Huwag sumagot sa buong English.',
  english: 'Answer in simple English.',
}

export function systemPrompt(level: string, lang: AiLang = 'taglish') {
  return [
    `You are Pipo, a cheerful pig who is a math tutor for Filipino students. You are talking to ${audience(level)}.`,
    LANG_RULE[lang],
    'Keep answers short: 2–3 sentences. Never invent a new problem or new numbers. Never use letters like a, b unless they are in the problem.',
    'If the student says the answer is wrong, do not agree just to be polite — the calculator result is correct; kindly explain it again.',
    'Write EVERY math expression inside $...$ using LaTeX, e.g. $\\frac{1}{2}$ or $2x + 3 = 11$.',
    'IMPORTANT: Do NOT calculate anything yourself. A calculator already computed the correct answer; only explain the steps you are given, using exactly those numbers.',
    'If the student asks for a computation and no calculator result is given, ask them to type the problem in the math box.',
  ].join(' ')
}

/** Few-shot examples teach small models the tone + format far better than instructions alone */
export function baseMessages(level: string, lang: AiLang): ChatMsg[] {
  // No few-shot examples: small models copy them word-for-word. Grounding comes from the calculator steps instead.
  return [{ role: 'system', content: systemPrompt(level, lang) }]
}

function questionContext(q: Question) {
  return [
    'CALCULATOR RESULT (correct, do not recompute)',
    `Problem: ${q.prompt}${q.latex ? ` $${q.latex}$` : ''}`,
    `Steps: ${q.solution.join(' → ')}`,
    `Answer: ${q.answerDisplay}`,
  ].join('\n')
}

export function hintMessages(level: string, q: Question, hintNo: number, lang: AiLang = 'taglish'): ChatMsg[] {
  return [
    ...baseMessages(level, lang),
    { role: 'user', content: `${questionContext(q)}\n\nGive me hint #${hintNo + 1} only. Do NOT say the final answer. Explain just ONE small step in 1–2 sentences.
${LANG_REMINDER[lang]}` },
  ]
}

export function whyWrongMessages(
  level: string,
  q: Question,
  userAnswer: string,
  lang: AiLang = 'taglish',
  diagnostic?: MisconceptionReport
): ChatMsg[] {
  const diagText = diagnostic
    ? `\nDIAGNOSED MISCONCEPTION: ${diagnostic.title} (${diagnostic.badge})\nWhat happened: ${diagnostic.taglishSummary}\nKey Rule: ${diagnostic.ruleTip}`
    : ''
  return [
    ...baseMessages(level, lang),
    {
      role: 'user',
      content: `${questionContext(q)}\nMy wrong answer: ${userAnswer || '(none)'}${diagText}\n\nKindly address this exact mistake warmly, explain why this misconception occurs, and walk through the correct solution. 3–4 sentences.
${LANG_REMINDER[lang]}`,
    },
  ]
}
