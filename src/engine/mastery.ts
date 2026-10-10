// Reusable scoring for every assessment report (and anything else that needs "how is this learner
// doing on X"). Pure functions over plain tallies — no store, no DOM.
import { STRANDS, TOPICS, type Strand, type TopicId } from './topics'

export type MasteryLevel = 'malakas' | 'umuunlad' | 'mahina' | 'kulang'

/** Thresholds, in one place so every report agrees */
export const MASTERY = {
  /** at or above → Malakas */
  strong: 0.8,
  /** below → Mahina (in between → Umuunlad) */
  weak: 0.5,
  /** fewer attempts than this → "kulang pa ang datos" (too little evidence to judge) */
  minAttempts: 5,
} as const

export const LEVEL_LABEL: Record<MasteryLevel, string> = {
  malakas: 'Malakas',
  umuunlad: 'Umuunlad',
  mahina: 'Mahina',
  kulang: 'Kulang pa ang datos',
}

export function masteryLevel(attempts: number, correct: number): MasteryLevel {
  if (attempts < MASTERY.minAttempts) return 'kulang'
  const acc = correct / attempts
  return acc >= MASTERY.strong ? 'malakas' : acc < MASTERY.weak ? 'mahina' : 'umuunlad'
}

export interface Totals { attempts: number; correct: number; ms: number }
export interface TopicScore extends Totals { topic: TopicId; strand: Strand; label: string; accuracy: number; avgSeconds: number; level: MasteryLevel }
export interface StrandScore extends Totals { strand: Strand; label: string; accuracy: number; level: MasteryLevel; topics: number }

const acc = (t: Totals) => (t.attempts ? t.correct / t.attempts : 0)

/** Score each topic; sorted weakest first within those with enough data */
export function scoreTopics(totals: Partial<Record<TopicId, Totals>>): TopicScore[] {
  const out: TopicScore[] = []
  for (const [topic, t] of Object.entries(totals) as [TopicId, Totals][]) {
    if (!t || !t.attempts) continue
    out.push({
      ...t, topic, strand: TOPICS[topic].strand, label: TOPICS[topic].label,
      accuracy: acc(t), avgSeconds: t.ms / t.attempts / 1000, level: masteryLevel(t.attempts, t.correct),
    })
  }
  const rank: Record<MasteryLevel, number> = { mahina: 0, umuunlad: 1, malakas: 2, kulang: 3 }
  return out.sort((a, b) => rank[a.level] - rank[b.level] || a.accuracy - b.accuracy || b.attempts - a.attempts)
}

export function scoreStrands(topics: TopicScore[]): StrandScore[] {
  const by = new Map<Strand, Totals & { topics: number }>()
  for (const t of topics) {
    const s = by.get(t.strand) ?? { attempts: 0, correct: 0, ms: 0, topics: 0 }
    s.attempts += t.attempts; s.correct += t.correct; s.ms += t.ms; s.topics++
    by.set(t.strand, s)
  }
  return [...by.entries()]
    .map(([strand, s]) => ({ ...s, strand, label: STRANDS[strand], accuracy: acc(s), level: masteryLevel(s.attempts, s.correct) }))
    .sort((a, b) => b.attempts - a.attempts)
}

export interface Summary extends Totals { accuracy: number; avgSeconds: number; level: MasteryLevel; topicsPracticed: number }

export function summarize(topics: TopicScore[]): Summary {
  const t = topics.reduce((s, x) => ({ attempts: s.attempts + x.attempts, correct: s.correct + x.correct, ms: s.ms + x.ms }), { attempts: 0, correct: 0, ms: 0 })
  return { ...t, accuracy: acc(t), avgSeconds: t.attempts ? t.ms / t.attempts / 1000 : 0, level: masteryLevel(t.attempts, t.correct), topicsPracticed: topics.length }
}

/** "Malakas sa" / "Mahina sa" / "Umuunlad sa" lists */
export function strengths(topics: TopicScore[]) {
  return {
    malakas: topics.filter((t) => t.level === 'malakas').sort((a, b) => b.accuracy - a.accuracy),
    umuunlad: topics.filter((t) => t.level === 'umuunlad'),
    mahina: topics.filter((t) => t.level === 'mahina'),
    kulang: topics.filter((t) => t.level === 'kulang'),
  }
}

/**
 * Plain-language recommendations for a parent or teacher. Weakest topics first, then the ones
 * close to mastery; always ends with something the child is doing well, when there is one.
 */
export function recommendations(topics: TopicScore[], max = 4): string[] {
  const { malakas, umuunlad, mahina, kulang } = strengths(topics)
  const out: string[] = []
  for (const t of mahina.slice(0, 2)) out.push(`Dapat pagtuunan ng pansin: ${t.label} (${pct(t.accuracy)} tama sa ${t.attempts} sagot). Balikan ang mga halimbawa at magsanay ng 5–10 tanong araw-araw.`)
  for (const t of umuunlad.sort((a, b) => b.accuracy - a.accuracy).slice(0, 2)) out.push(`Malapit nang ma-master: ${t.label} (${pct(t.accuracy)}). Kaunting practice pa para umabot sa ${pct(MASTERY.strong)}.`)
  const slow = topics.filter((t) => t.level !== 'kulang' && t.accuracy >= MASTERY.strong && t.avgSeconds > 30)
  for (const t of slow.slice(0, 1)) out.push(`Tama pero mabagal sa ${t.label} (mga ${Math.round(t.avgSeconds)} segundo bawat tanong). Makakatulong ang mabilisang drills para maging mas mabilis.`)
  if (!out.length && kulang.length) out.push(`Kailangan pa ng mas maraming sagot para makapagbigay ng tiyak na payo. Hikayatin ang bata na maglaro o mag-aral ng ilang araw pa.`)
  const best = malakas[0]
  if (best && out.length < max) out.push(`Ipagpatuloy: magaling sa ${best.label} (${pct(best.accuracy)}). Purihin ang bata dito!`)
  return out.slice(0, max)
}

export const pct = (x: number) => `${Math.round(x * 100)}%`
