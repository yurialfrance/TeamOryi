// Local, on-device AI via WebLLM (WebGPU). Nothing leaves the device.
import { create } from 'zustand'
import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm'
import type { Question } from '../engine/types'

export const MODELS = [
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Pipo Smart (1.5B)', size: '≈ 1.0 GB', note: 'Mas magaling mag-explain' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Pipo Lite (0.5B)', size: '≈ 0.4 GB', note: 'Para sa mas mahinang phone' },
]

type Status = 'idle' | 'checking' | 'unsupported' | 'loading' | 'ready' | 'error'

interface AiState {
  status: Status
  progress: number
  progressText: string
  error: string | null
  modelId: string | null
  lastError?: string
}

export const useAi = create<AiState>(() => ({ status: 'idle', progress: 0, progressText: '', error: null, modelId: null }))

let engine: WebWorkerMLCEngine | null = null
let loading: Promise<void> | null = null

export async function webgpuSupported(): Promise<boolean> {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
    if (!gpu) return false
    return !!(await gpu.requestAdapter())
  } catch {
    return false
  }
}

export async function isModelCached(modelId: string) {
  try {
    const { hasModelInCache } = await import('@mlc-ai/web-llm')
    return await hasModelInCache(modelId)
  } catch {
    return false
  }
}

export function loadModel(modelId: string): Promise<void> {
  if (engine && useAi.getState().modelId === modelId) return Promise.resolve()
  if (loading) return loading
  loading = (async () => {
    useAi.setState({ status: 'checking', error: null })
    if (!(await webgpuSupported())) {
      useAi.setState({ status: 'unsupported' })
      return
    }
    useAi.setState({ status: 'loading', progress: 0, progressText: 'Sinisimulan…', modelId })
    try {
      const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
      engine = await CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback: (p) => useAi.setState({ progress: p.progress, progressText: p.text }),
      })
      useAi.setState({ status: 'ready', progress: 1 })
    } catch (e) {
      engine = null
      useAi.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) })
    } finally {
      loading = null
    }
  })()
  return loading
}

export const aiReady = () => !!engine && useAi.getState().status === 'ready'

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
    const chunks = await engine!.chat.completions.create({ messages, stream: true, temperature: 0.3, top_p: 0.9, max_tokens: maxTokens })
    for await (const c of chunks) {
      out += c.choices[0]?.delta?.content ?? ''
      onText(out)
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
    'Keep answers short: 2–4 sentences.',
    'Write EVERY math expression inside $...$ using LaTeX, e.g. $\\frac{1}{2}$ or $2x + 3 = 11$.',
    'IMPORTANT: Do NOT calculate anything yourself. A calculator already computed the correct answer; only explain the steps you are given, using exactly those numbers.',
    'If the student asks for a computation and no calculator result is given, ask them to type the problem in the math box.',
  ].join(' ')
}

/** Few-shot examples teach small models the tone + format far better than instructions alone */
const FEW_SHOT: Record<AiLang, ChatMsg[]> = {
  taglish: [
    { role: 'user', content: 'Paano mag-add ng fractions na pareho ang denominator?' },
    { role: 'assistant', content: 'Easy lang! Kapag pareho ang denominator, i-add mo lang ang numerators, tapos same pa rin ang denominator. Halimbawa: $\\frac{1}{5} + \\frac{2}{5} = \\frac{3}{5}$. Kaya mo \'yan!' },
    { role: 'user', content: 'CALCULATOR RESULT (correct, do not recompute)\nProblem: $2x + 3 = 11$\nSteps: $2x - 8 = 0$ → $2x = 8$ → $x = 4$\nAnswer: $x = 4$\nExplain this to me.' },
    { role: 'assistant', content: 'Una, ilipat natin ang constant: ibawas ang 3 sa both sides, kaya $2x = 8$. Tapos i-divide sa 2 para maiwan si x, kaya $x = 4$. Ganun lang kasimple!' },
  ],
  english: [
    { role: 'user', content: 'How do I add fractions with the same denominator?' },
    { role: 'assistant', content: 'Just add the numerators and keep the denominator the same. Example: $\\frac{1}{5} + \\frac{2}{5} = \\frac{3}{5}$. You got this!' },
    { role: 'user', content: 'CALCULATOR RESULT (correct, do not recompute)\nProblem: $2x + 3 = 11$\nSteps: $2x - 8 = 0$ → $2x = 8$ → $x = 4$\nAnswer: $x = 4$\nExplain this to me.' },
    { role: 'assistant', content: 'First, subtract 3 from both sides so we get $2x = 8$. Then divide both sides by 2 to get $x = 4$. Nice and easy!' },
  ],
}

export function baseMessages(level: string, lang: AiLang): ChatMsg[] {
  return [{ role: 'system', content: systemPrompt(level, lang) }, ...FEW_SHOT[lang]]
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
