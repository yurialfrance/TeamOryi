// Sipnayan Nerdle rules + puzzle selection, shared by the screen, the pool generator
// (scripts/gen-nerdle.ts) and the tests — so every pooled puzzle is checked by the game's own rules.
import type { TopicId } from '../engine/topics'
import { NERDLE_POOL, type NerdleTier } from './nerdlePool'
import { nerdleTopic, type NerdleLength } from './nerdleRules'

export * from './nerdleRules'
export type { NerdleTier }


// ---------------------------------------------------------------- daily rotation
// Difficulty follows the week like newspaper puzzles: Mon–Tue madali, Wed–Fri katamtaman,
// Sat–Sun mahirap. Each tier is walked in a fixed pre-shuffled order, so a puzzle only comes back
// after its whole tier has been used (see the horizon printed by scripts/gen-nerdle.ts).

const EPOCH = Date.UTC(2026, 0, 5) // a Monday
const DAY_MS = 86_400_000
/** Mon..Sun → tier, and which slot of that tier this weekday is */
const WEEK: { tier: NerdleTier; slot: number; perWeek: number }[] = [
  { tier: 'easy', slot: 0, perWeek: 2 }, { tier: 'easy', slot: 1, perWeek: 2 },
  { tier: 'medium', slot: 0, perWeek: 3 }, { tier: 'medium', slot: 1, perWeek: 3 }, { tier: 'medium', slot: 2, perWeek: 3 },
  { tier: 'hard', slot: 0, perWeek: 2 }, { tier: 'hard', slot: 1, perWeek: 2 },
]

export function dayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS)
}

export interface Puzzle { equation: string; tier: NerdleTier; topic: TopicId }

/**
 * Mini (6 tiles) can't hold two operators, so it has no "mahirap" tier — and only ~200 interesting
 * valid equations exist at all. It walks one interleaved list instead: the longest possible run.
 */
const MINI_ORDER: string[] = (() => {
  const { easy, medium } = NERDLE_POOL[6]
  const out: string[] = []
  for (let i = 0; i < Math.max(easy.length, medium.length); i++) {
    if (i < medium.length) out.push(medium[i])
    if (i < easy.length) out.push(easy[i])
  }
  return out
})()
export const tierOfMini = (eq: string): NerdleTier => (NERDLE_POOL[6].easy.includes(eq) ? 'easy' : 'medium')

export function dailyPuzzle(dateStr: string, length: NerdleLength): Puzzle {
  const n = dayNumber(dateStr)
  if (length === 6) {
    const equation = MINI_ORDER[((n % MINI_ORDER.length) + MINI_ORDER.length) % MINI_ORDER.length]
    return { equation, tier: tierOfMini(equation), topic: nerdleTopic(equation) }
  }
  const week = Math.floor(n / 7), dow = ((n % 7) + 7) % 7
  const { tier, slot, perWeek } = WEEK[dow]
  const list = NERDLE_POOL[length][tier]
  const i = (((week * perWeek + slot) % list.length) + list.length) % list.length
  const equation = list[i]
  return { equation, tier, topic: nerdleTopic(equation) }
}

/** Practice puzzle: random, never one of the recently played */
export function practicePuzzle(length: NerdleLength, recent: string[] = [], rand: () => number = Math.random): Puzzle {
  const tiers = (['easy', 'medium', 'hard'] as NerdleTier[]).filter((t) => NERDLE_POOL[length][t].length > 0)
  for (let tries = 0; tries < 50; tries++) {
    const tier = tiers[Math.floor(rand() * tiers.length)]
    const list = NERDLE_POOL[length][tier]
    const equation = list[Math.floor(rand() * list.length)]
    if (!recent.includes(equation)) return { equation, tier, topic: nerdleTopic(equation) }
  }
  const equation = NERDLE_POOL[length].medium[0]
  return { equation, tier: 'medium', topic: nerdleTopic(equation) }
}

export const TIER_LABEL: Record<NerdleTier, string> = { easy: 'Madali', medium: 'Katamtaman', hard: 'Mahirap' }
