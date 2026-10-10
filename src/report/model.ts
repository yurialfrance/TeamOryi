// Assessment report data: everything a PDF shows, computed from the stored tallies. Pure — the PDF
// renderer (pdf.ts) only draws this, and scripts/report-test.ts checks it directly.
import { recommendations, scoreStrands, scoreTopics, strengths, summarize, masteryLevel, type MasteryLevel, type StrandScore, type Summary, type Totals, type TopicScore } from '../engine/mastery'
import type { TopicId } from '../engine/topics'
import { parseKey, type DuelPvpStats, type Progress } from '../store/progress'

export type ReportKind = 'landas' | 'duel' | 'cashier' | 'nerdle'
export interface DateRange { from: string; to: string } // inclusive, YYYY-MM-DD

export const REPORT_TITLE: Record<ReportKind, string> = {
  landas: 'Landas — Ulat ng Pag-aaral',
  duel: 'Tagisan ng Talino — Assessment Report',
  cashier: 'Sari-Sari Store Cashier — Assessment Report',
  nerdle: 'Sipnayan Nerdle — Assessment Report',
}
export const REPORT_SUBTITLE: Record<ReportKind, string> = {
  landas: 'Lahat ng aralin sa Landas (stage path), ayon sa grade level at paksa',
  duel: 'Mabilisang math duel: bilis at katumpakan sa iba\'t ibang paksa',
  cashier: 'Pagbibilang ng pera at pagbibigay ng sukli',
  nerdle: 'Pang-araw-araw na math puzzle: operasyon at order of operations',
}

export interface GradeRow { id: string; grade: string; attempts: number; accuracy: number; level: MasteryLevel; stagesDone: number; stagesTotal: number }
export interface WeekRow { weekOf: string; attempts: number; accuracy: number }

export interface ReportModel {
  kind: ReportKind
  title: string
  subtitle: string
  learnerName: string
  range: DateRange
  generatedOn: string
  summary: Summary
  topics: TopicScore[]
  strands: StrandScore[]
  lists: ReturnType<typeof strengths>
  recommendations: string[]
  /** Landas: mastery per grade level / island */
  grades?: GradeRow[]
  /** Landas: progress over time, by week */
  trend?: WeekRow[]
  /** game-specific facts (wins, streaks, unattributed 2-player totals) */
  facts: { label: string; value: string }[]
  empty: boolean
}

export interface ReportInput {
  progress: Progress
  name: string
  completed: Record<string, { stars: number; best: number }>
  duelWins: number
  duelsPlayed: number
  duelPvp: DuelPvpStats
  nerdleWins: number
  nerdlePlayed: number
  nerdleStreak: number
}

/** Landas islands, so the model can name grades without importing the curriculum */
export interface IslandInfo { id: string; grade: string; stageIds: string[] }

const inRange = (d: string, r: DateRange) => d >= r.from && d <= r.to
const matches = (kind: ReportKind, source: string) => (kind === 'landas' ? source.startsWith('landas:') : source === kind)

/** Monday of the week containing day d (YYYY-MM-DD) */
function weekOf(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, day))
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7))
  return t.toISOString().slice(0, 10)
}

export function buildReport(kind: ReportKind, input: ReportInput, range: DateRange, generatedOn: string, islands: IslandInfo[] = []): ReportModel {
  const byTopic: Partial<Record<TopicId, Totals>> = {}
  const byIsland = new Map<string, Totals>()
  const byWeek = new Map<string, Totals>()
  for (const [day, entries] of Object.entries(input.progress)) {
    if (!inRange(day, range)) continue
    for (const [key, [n, c, ms]] of Object.entries(entries)) {
      const k = parseKey(key)
      if (!k || !matches(kind, k.source)) continue
      const t = (byTopic[k.topic] ??= { attempts: 0, correct: 0, ms: 0 })
      t.attempts += n; t.correct += c; t.ms += ms
      const w = byWeek.get(weekOf(day)) ?? { attempts: 0, correct: 0, ms: 0 }
      w.attempts += n; w.correct += c; w.ms += ms
      byWeek.set(weekOf(day), w)
      if (kind === 'landas') {
        const id = k.source.slice('landas:'.length)
        const g = byIsland.get(id) ?? { attempts: 0, correct: 0, ms: 0 }
        g.attempts += n; g.correct += c; g.ms += ms
        byIsland.set(id, g)
      }
    }
  }
  const topics = scoreTopics(byTopic)
  const summary = summarize(topics)
  const facts: { label: string; value: string }[] = []
  if (kind === 'duel') {
    facts.push({ label: 'Panalo laban kay Pipo Bot / lahat ng laban', value: `${input.duelWins} / ${input.duelsPlayed}` })
    if (input.duelPvp.matches) facts.push({ label: '2-player na laban (hindi naka-assign sa batang ito)', value: `${input.duelPvp.matches} laban, ${input.duelPvp.rounds} rounds` })
  }
  if (kind === 'nerdle') {
    facts.push({ label: 'Nalutas / nilaro', value: `${input.nerdleWins} / ${input.nerdlePlayed}` })
    facts.push({ label: 'Daily streak', value: `${input.nerdleStreak} araw` })
  }

  const model: ReportModel = {
    kind, title: REPORT_TITLE[kind], subtitle: REPORT_SUBTITLE[kind], learnerName: input.name.trim() || 'Mag-aaral',
    range, generatedOn, summary, topics, strands: scoreStrands(topics), lists: strengths(topics), recommendations: recommendations(topics),
    facts, empty: summary.attempts === 0,
  }
  if (kind === 'landas') {
    model.grades = islands
      .map((isl) => {
        const t = byIsland.get(isl.id) ?? { attempts: 0, correct: 0, ms: 0 }
        const stagesDone = isl.stageIds.filter((id) => input.completed[id]).length
        return { id: isl.id, grade: isl.grade, attempts: t.attempts, accuracy: t.attempts ? t.correct / t.attempts : 0, level: masteryLevel(t.attempts, t.correct), stagesDone, stagesTotal: isl.stageIds.length }
      })
      .filter((g) => g.attempts > 0 || g.stagesDone > 0)
    model.trend = [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([w, t]) => ({ weekOf: w, attempts: t.attempts, accuracy: t.correct / t.attempts }))
    if (model.grades.some((g) => g.stagesDone > 0)) model.empty = false
  }
  return model
}

/** The ranges offered in the app */
export function presetRange(preset: '7' | '30' | 'all', today: string, progress: Progress): DateRange {
  if (preset === 'all') {
    const days = Object.keys(progress).sort()
    return { from: days[0] ?? today, to: today }
  }
  const [y, m, d] = today.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  t.setUTCDate(t.getUTCDate() - (Number(preset) - 1))
  return { from: t.toISOString().slice(0, 10), to: today }
}
