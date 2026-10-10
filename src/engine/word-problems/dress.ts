// Layer 2 of "Kwento ni Pipo": the on-device AI retells the code-written facts as a short local
// story. It is given the exact numbers and told to keep them; validate.ts checks that it did.
// One retry, then the code-written facts are used — a broken story is never shown.
import type { InputQuestion } from '../types'
import { audience, LANG_REMINDER, LANG_RULE, type ChatMsg } from '../../ai/llm'
import { cleanStory, isNearCopy, maxSentences, validateStory } from './validate'
import { peso, type WPSpec } from './spec'

/** The model call (the real one is llm.generate). Returns null when there's no text to use. */
export type StoryModel = (messages: ChatMsg[], opts: { temperature: number; maxTokens: number }) => Promise<string | null>

export interface DressResult {
  /** what the learner reads before the question sentence */
  story: string
  /** 'ai' = the AI's story passed every check · 'template' = the code-written facts */
  source: 'ai' | 'template'
  attempts: number
  /** why each rejected AI story failed (for tests, logs and the demo) */
  rejected: { text: string; reasons: string[] }[]
}

const numbersLine = (spec: WPSpec) => spec.givens.map((g) => (g.unit === 'peso' ? peso(g.value) : String(g.value))).join(', ')

/**
 * One worked example teaches a small model the transformation far better than rules alone. It is set
 * somewhere else (a bakery) with a different name and numbers, so a copied example can never pass
 * validation — the numbers and name would not match the spec.
 */
const EXAMPLE: Record<'taglish' | 'english', [string, string]> = {
  taglish: [
    'FACTS: Bumili si Liza ng pandesal na ₱36 sa panaderya ni Mang Tonyo. Nagbayad siya ng ₱50.',
    'Maagang gumising si Liza at dumaan sa panaderya ni Mang Tonyo. Kumuha siya ng mainit na pandesal na ₱36 at iniabot niya ang ₱50.',
  ],
  english: [
    "FACTS: Liza bought pandesal for ₱36 at Mang Tonyo's bakery. Liza paid ₱50.",
    "Liza woke up early and walked to Mang Tonyo's bakery. She picked warm pandesal for ₱36 and handed over ₱50.",
  ],
}

export function storyMessages(spec: WPSpec, strict = false): ChatMsg[] {
  const fil = spec.lang === 'taglish'
  const c = spec.context
  // no persona here: "you are a pig" leaked into the stories ("Juan, the pig, …")
  const system = [
    `You rewrite math FACTS into a very short, lively scene for a Filipino kids' word problem. The reader is ${audience(`grade${spec.grade}`)}.`,
    LANG_RULE[spec.lang],
    'Write ONLY the scene. Never calculate, never ask a question, never give an answer.',
  ].join(' ')
  const rules = [
    `At most ${maxSentences(spec.grade)} short sentences.`,
    `Use exactly these numbers, in this order, with ₱ and digits: ${numbersLine(spec)}. No other numbers. Never write numbers as words.`,
    `Keep the name ${spec.person} and the item${spec.items.length > 1 ? 's' : ''} ${spec.items.map((i) => (fil ? i.name : i.en)).join(', ')}.`,
    'No question. No answer.',
  ]
  if (strict) rules.unshift(`IMPORTANT: use ONLY ${numbersLine(spec)} — nothing else.`)
  const [exFacts, exScene] = EXAMPLE[spec.lang]
  const user = [
    `Example:\n${exFacts}\nSCENE: ${exScene}`,
    '',
    `Now yours.\nFACTS: ${spec.facts}`,
    `SETTING: ${fil ? c.place : c.placeEn} — ${c.flavor}. Words you may use: ${c.vocab.slice(0, 6).join(', ')}.`,
    ...rules,
    LANG_REMINDER[spec.lang],
    'SCENE:',
  ].join('\n')
  return [{ role: 'system', content: system }, { role: 'user', content: user }]
}

/**
 * Ask the model for a story, validate it, retry once, else fall back to the facts.
 * Resolves to null only when the model produced NO text at all (not loaded, busy, interrupted) —
 * then the lesson keeps its own question instead of a word problem.
 */
export async function dressSpec(spec: WPSpec, model: StoryModel): Promise<DressResult | null> {
  const rejected: DressResult['rejected'] = []
  for (let attempt = 1; attempt <= 2; attempt++) {
    // small on-device models get incoherent when hot: 0.5, then a cooler, stricter retry
    const raw = await model(storyMessages(spec, attempt > 1), { temperature: attempt > 1 ? 0.3 : 0.5, maxTokens: spec.grade <= 3 ? 60 : 90 })
    if (raw === null) return rejected.length ? { story: spec.facts, source: 'template', attempts: attempt - 1, rejected } : null
    const story = cleanStory(raw)
    const v = validateStory(story, spec)
    // a valid near-copy of the facts is shown as the plain template: no badge for text the AI didn't write
    if (v.ok && isNearCopy(story, spec)) return { story: spec.facts, source: 'template', attempts: attempt, rejected: [...rejected, { text: story, reasons: ['copied-facts'] }] }
    if (v.ok) return { story, source: 'ai', attempts: attempt, rejected }
    rejected.push({ text: story, reasons: v.reasons })
  }
  return { story: spec.facts, source: 'template', attempts: 2, rejected }
}

/** The lesson question: the story (AI or facts) + the code's question; answer key from the spec */
export function storyQuestion(spec: WPSpec, d: Pick<DressResult, 'story' | 'source'>): InputQuestion {
  return {
    id: `wp-${Math.random().toString(36).slice(2, 9)}`,
    kind: 'input',
    prompt: `${d.story} ${spec.question}`,
    answers: [String(spec.answer)],
    answerDisplay: spec.answerUnit === 'peso' ? peso(spec.answer) : String(spec.answer),
    prefix: spec.answerUnit === 'peso' ? '₱' : undefined,
    hints: spec.hints,
    solution: spec.solution,
    topic: spec.topic,
    origin: d.source === 'ai' ? 'ai-story' : 'story-template',
  }
}
