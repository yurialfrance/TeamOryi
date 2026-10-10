// Attempt history for the assessment reports — stored as compact daily tallies inside the existing
// persisted game store (localStorage 'sipnayan-v1'), so it travels with backups and needs no new DB.
//   progress[YYYY-MM-DD]["landas:g4|fractions-equivalent"] = [attempts, correct, totalMs]
import { isTopic, type TopicId } from '../engine/topics'

/** Where an answer came from. Landas carries its island id, so reports know the grade. */
export type AttemptSource = `landas:${string}` | 'duel' | 'cashier' | 'nerdle'
export type Tally = [attempts: number, correct: number, ms: number]
export type Progress = Record<string, Record<string, Tally>>

/** Two-player Tagisan matches that weren't attributed to this learner — totals only */
export interface DuelPvpStats { matches: number; rounds: number; p1Correct: number; p2Correct: number }

const KEEP_DAYS = 730

export const tallyKey = (source: AttemptSource, topic: TopicId) => `${source}|${topic}`

export function parseKey(key: string): { source: AttemptSource; topic: TopicId } | null {
  const i = key.lastIndexOf('|')
  const source = key.slice(0, i), topic = key.slice(i + 1)
  if (i < 0 || !isTopic(topic) || !/^(landas:[a-z0-9-]+|duel|cashier|nerdle)$/.test(source)) return null
  return { source: source as AttemptSource, topic }
}

/** Add one answer to the tallies (returns a new object; old days beyond two years are dropped) */
export function addAttempt(p: Progress, day: string, source: AttemptSource, topic: TopicId, correct: boolean, ms: number): Progress {
  const key = tallyKey(source, topic)
  const dayT = p[day] ?? {}
  const [n, c, t] = dayT[key] ?? [0, 0, 0]
  const next: Progress = { ...p, [day]: { ...dayT, [key]: [n + 1, c + (correct ? 1 : 0), t + Math.max(0, Math.min(ms, 600_000))] } }
  if (!p[day]) {
    const cutoff = new Date(day)
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS)
    const c0 = cutoff.toISOString().slice(0, 10)
    for (const d of Object.keys(next)) if (d < c0) delete next[d]
  }
  return next
}

/** Keep only well-formed entries (used when restoring a backup file) */
export function sanitizeProgress(raw: unknown): Progress {
  const out: Progress = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [day, entries] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !entries || typeof entries !== 'object') continue
    for (const [key, v] of Object.entries(entries as Record<string, unknown>)) {
      if (!parseKey(key) || !Array.isArray(v) || v.length !== 3) continue
      const [n, c, t] = v.map((x) => Math.max(0, Math.floor(Number(x) || 0)))
      if (n === 0 || c > n) continue
      ;(out[day] ??= {})[key] = [n, c, t]
    }
  }
  return out
}
