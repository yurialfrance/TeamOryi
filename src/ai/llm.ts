// Local, on-device AI. Nothing leaves the device.
//  - GPU path: WebLLM (WebGPU) — fast, needs a WebGPU browser
//  - CPU path: wllama (llama.cpp → WebAssembly) — works in ANY modern browser, slower
import { create } from 'zustand'
import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm'
import type { Wllama } from '@wllama/wllama/esm/index.js'
import type { Question } from '../engine/types'

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

/** Stream a completion. Falls back to `fallback` text (typed out) when the model isn't ready. */
export async function stream(messages: ChatMsg[], onText: (full: string) => void, fallback: string, maxTokens = 220): Promise<string> {
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

const LEVEL: Record<string, string> = {
  elem: 'a Grade 3–4 child (use very simple words)',
  jhs: 'a Grade 7 student',
  shs: 'a Senior High School student',
  college: 'a college freshman',
}

const LANG_RULE: Record<AiLang, string> = {
  taglish:
    'Reply in simple, natural Taglish like a friendly Filipino tutor: mostly short, simple English sentences with common Filipino words mixed in (e.g. "kasi", "tapos", "ito", "diba", "galing", "kaya", "lang"). NEVER use deep, formal, or made-up Tagalog words.',
  english: 'Reply in simple, friendly English.',
}

export function systemPrompt(level: string, lang: AiLang = 'taglish') {
  return [
    `You are Pipo, a cheerful pig who is a math tutor for Filipino students. You are talking to ${LEVEL[level] ?? 'a student'}.`,
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
    { role: 'user', content: `${questionContext(q)}\n\nGive me hint #${hintNo + 1} only. Do NOT say the final answer. Explain just ONE small step in 1–2 sentences.` },
  ]
}

export function whyWrongMessages(level: string, q: Question, userAnswer: string, lang: AiLang = 'taglish'): ChatMsg[] {
  return [
    ...baseMessages(level, lang),
    { role: 'user', content: `${questionContext(q)}\nMy wrong answer: ${userAnswer || '(none)'}\n\nKindly explain where I probably went wrong, then walk through the correct steps above. 3–4 sentences.` },
  ]
}
