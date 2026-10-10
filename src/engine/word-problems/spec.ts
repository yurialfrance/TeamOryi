// Layer 1 of "Kwento ni Pipo": the MATH, decided by code. A spec fixes every number, the answer,
// the worked solution, a deterministic Taglish/English story ("facts") and the question sentence.
// The AI may later retell the facts more vividly, but it never chooses or computes a number.
import type { TopicId } from '../topics'
import type { AiLang } from '../../ai/llm'
import { tender } from '../../games/cashier'
import { contextsFor, type WPContext, type WPItem, type WPKind } from '../word-problem-contexts'

export type WPUnit = 'peso' | 'count'

/** One number the story must state, in the order the facts state it */
export interface Given { value: number; unit: WPUnit; label: string }

export interface WPSpec {
  kind: WPKind
  /** the topic this question is recorded under (the stage topic it stands in for) */
  topic: TopicId
  grade: number
  lang: AiLang
  context: WPContext
  person: string
  items: WPItem[]
  /** every number in the story, in story order — exactly these, no others */
  givens: Given[]
  answer: number
  answerUnit: WPUnit
  /** deterministic story written by code: the AI's input, and the fallback when the AI's retelling fails */
  facts: string
  /** the question sentence — always written by code, never by the AI (it defines the unknown) */
  question: string
  solution: string[]
  hints: string[]
}

type Rand = () => number
const pick = <T,>(xs: readonly T[], r: Rand): T => xs[Math.floor(r() * xs.length)]
export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`

/** Topics each kind of story can stand in for (a Landas stage swaps in a story only for these) */
export const KIND_TOPICS: Record<WPKind, TopicId[]> = {
  change: ['money-sukli-whole', 'money-word-problems', 'whole-numbers-subtraction', 'money-multi-item'],
}
/** Grades each kind is used for — beyond these, stages keep their own questions */
export const KIND_GRADES: Record<WPKind, [number, number]> = {
  change: [1, 6],
}

export const kindsForTopic = (topic: TopicId, grade: number): WPKind[] =>
  (Object.keys(KIND_TOPICS) as WPKind[]).filter((k) => KIND_TOPICS[k].includes(topic) && grade >= KIND_GRADES[k][0] && grade <= KIND_GRADES[k][1] && contextsFor(k, grade).length > 0)

// ---------------------------------------------------------------- change (sukli)
/** Grade-sized: how many items, and the largest amount the learner should handle */
const CHANGE_SCALE: Record<number, { items: [number, number]; maxPaid: number }> = {
  1: { items: [1, 1], maxPaid: 99 }, // MATATAG G1: subtraction, both numbers below 100
  2: { items: [1, 2], maxPaid: 500 },
  3: { items: [2, 2], maxPaid: 1000 },
  4: { items: [2, 2], maxPaid: 1000 },
  5: { items: [2, 3], maxPaid: 1000 },
  6: { items: [2, 3], maxPaid: 1000 },
}

function changeSpec(topic: TopicId, grade: number, lang: AiLang, r: Rand): WPSpec | null {
  const scale = CHANGE_SCALE[grade]
  const context = pick(contextsFor('change', grade), r)
  const n = scale.items[0] + Math.floor(r() * (scale.items[1] - scale.items[0] + 1))
  const pool = [...context.items]
  const items: WPItem[] = []
  while (items.length < n && pool.length) items.push(pool.splice(Math.floor(r() * pool.length), 1)[0])
  const total = items.reduce((s, i) => s + i.price, 0)
  // pay like a real suki (cashier logic): usually the smallest bill that covers it, sometimes more
  let paid = tender(total * 100, r).paid / 100
  if (paid > scale.maxPaid || !Number.isInteger(paid)) paid = [20, 50, 100, 200, 500, 1000].find((b) => b > total) ?? 0
  if (!paid || paid > scale.maxPaid) return null
  const answer = paid - total
  const values = [...items.map((i) => i.price), paid]
  // the validator ignores "isa/isang/one" (an article in Filipino), so 1 never appears; the answer must
  // not already be one of the givens (or it would look "leaked"); prices must be distinct per story
  if (answer <= 0 || values.includes(1) || values.includes(answer) || new Set(values).size !== values.length) return null

  const person = pick(context.people, r)
  const list = (xs: string[], and: string) => (xs.length < 2 ? xs[0] : `${xs.slice(0, -1).join(', ')} ${and} ${xs[xs.length - 1]}`)
  const fil = lang === 'taglish'
  const bought = list(items.map((i) => (fil ? `${i.name} na ${peso(i.price)}` : `${i.en} for ${peso(i.price)}`)), fil ? 'at' : 'and')
  const place = fil ? context.place : context.placeEn
  const facts = fil
    ? `Bumili si ${person} ng ${bought} sa ${place}. Nagbayad siya ng ${peso(paid)}.`
    : `${person} bought ${bought} at ${place}. ${person} paid ${peso(paid)}.`
  const question = fil ? `Magkano ang sukli ni ${person}?` : `How much change did ${person} get?`
  const sumLine = items.length > 1 ? `${items.map((i) => peso(i.price)).join(' + ')} = ${peso(total)}` : null
  return {
    kind: 'change', topic, grade, lang, context, person, items,
    givens: [...items.map((i) => ({ value: i.price, unit: 'peso' as const, label: i.name })), { value: paid, unit: 'peso', label: 'bayad' }],
    answer, answerUnit: 'peso', facts, question,
    solution: [
      ...(sumLine ? [fil ? `Kabuuang presyo: ${sumLine}` : `Total price: ${sumLine}`] : []),
      `${fil ? 'Sukli' : 'Change'} = ${peso(paid)} − ${peso(total)} = ${peso(answer)}`,
    ],
    hints: fil
      ? [...(items.length > 1 ? ['I-add muna ang presyo ng lahat ng binili.'] : []), 'Sukli = ibinayad − kabuuang presyo.']
      : [...(items.length > 1 ? ['First add the prices of everything bought.'] : []), 'Change = amount paid − total price.'],
  }
}

/** A spec for this kind/topic/grade (retries internally; null only if the kind can't serve this grade) */
export function makeSpec(kind: WPKind, topic: TopicId, grade: number, lang: AiLang, r: Rand = Math.random): WPSpec | null {
  if (!kindsForTopic(topic, grade).includes(kind)) return null
  for (let i = 0; i < 50; i++) {
    const s = kind === 'change' ? changeSpec(topic, grade, lang, r) : null
    if (s) return s
  }
  return null
}

/** Recompute the answer from the givens alone — used by tests to prove the spec's math, independently */
export function recompute(spec: WPSpec): number {
  const v = spec.givens.map((g) => g.value)
  switch (spec.kind) {
    case 'change': return v[v.length - 1] - v.slice(0, -1).reduce((a, b) => a + b, 0)
  }
}
