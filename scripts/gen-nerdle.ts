// Generates src/games/nerdlePool.ts — every Nerdle puzzle, enumerated and checked with the game's
// own validator. Run: npx tsx scripts/gen-nerdle.ts   (deterministic: same output every run)
import { writeFileSync } from 'node:fs'
import { nerdleTopic, validateEquation } from '../src/games/nerdleRules'

type Tier = 'easy' | 'medium' | 'hard'
const OPS = ['+', '-', '*', '/']

/** mulberry32 — seeded so the daily order never changes between builds */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const shuffle = <T,>(a: T[], r: () => number) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

/** Numbers with exactly `len` digits, no leading zero, no zero */
const numsOfLen = (len: number) => Array.from({ length: 9 * 10 ** (len - 1) }, (_, i) => 10 ** (len - 1) + i)

/** All splits of `total` into `parts` lengths of 1..3 */
function splits(total: number, parts: number): number[][] {
  if (parts === 1) return total >= 1 && total <= 3 ? [[total]] : []
  const out: number[][] = []
  for (let a = 1; a <= 3; a++) for (const rest of splits(total - a, parts - 1)) out.push([a, ...rest])
  return out
}

function tierOf(left: string): Tier {
  const ops = left.match(/[+\-*/]/g) ?? []
  const mulDiv = ops.filter((o) => o === '*' || o === '/').length
  if (mulDiv > 0 && mulDiv < ops.length) return 'hard' // precedence: × ÷ before + −
  if (mulDiv >= 2) return 'hard'
  if (mulDiv === 1 || ops.length >= 2) return 'medium'
  return 'easy'
}

/** Puzzles a person would enjoy: no ×1 ÷1 +0, no x−x, no 0 result */
function boring(left: string, result: number): boolean {
  if (result === 0) return true
  if (/(^|[^\d])1[*/]|[*/]1($|[^\d])/.test(left)) return true
  const m = left.match(/^(\d+)-(\d+)$/)
  return !!m && m[1] === m[2]
}

function enumerate(length: number): Record<Tier, string[]> {
  const out: Record<Tier, string[]> = { easy: [], medium: [], hard: [] }
  const seen = new Set<string>()
  for (let rightLen = 1; rightLen <= 3; rightLen++) {
    const leftLen = length - 1 - rightLen
    for (let nOps = 1; nOps <= 2; nOps++) {
      const digitLen = leftLen - nOps
      for (const lens of splits(digitLen, nOps + 1)) {
        const pools = lens.map(numsOfLen)
        const opCombos = nOps === 1 ? OPS.map((o) => [o]) : OPS.flatMap((a) => OPS.map((b) => [a, b]))
        // explicit loops are faster than the generic walk for 2–3 operands
        if (pools.length === 2) {
          for (const a of pools[0]) for (const b of pools[1]) for (const [o] of opCombos) consider(`${a}${o}${b}`)
        } else {
          for (const a of pools[0]) for (const b of pools[1]) for (const c of pools[2]) for (const [o1, o2] of opCombos) consider(`${a}${o1}${b}${o2}${c}`)
        }
      }
    }
  }
  function consider(left: string) {
    // value via the game's own validator: build the equation and check it
    const v = evalLeft(left)
    if (v === null || boring(left, v)) return
    const eq = `${left}=${v}`
    if (eq.length !== length || seen.has(eq)) return
    if (!validateEquation(eq, length).valid) return
    seen.add(eq)
    out[tierOf(left)].push(eq)
  }
  return out
}

/** quick value for candidate generation; validateEquation re-checks every keeper */
function evalLeft(left: string): number | null {
  const t = left.match(/\d+|[+\-*/]/g)!
  const nums = [Number(t[0])]
  const add: string[] = []
  for (let i = 1; i < t.length; i += 2) {
    const op = t[i], n = Number(t[i + 1])
    if (op === '*') nums[nums.length - 1] *= n
    else if (op === '/') { if (nums[nums.length - 1] % n) return null; nums[nums.length - 1] /= n }
    else { add.push(op); nums.push(n) }
  }
  let r = nums[0]
  add.forEach((op, i) => { r = op === '+' ? r + nums[i + 1] : r - nums[i + 1] })
  return r < 0 ? null : r
}

/** Interleave by topic so a tier isn't 300 additions in a row */
function pick(cands: string[], cap: number, r: () => number): string[] {
  const groups = new Map<string, string[]>()
  for (const e of shuffle([...cands], r)) { const k = nerdleTopic(e); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(e) }
  const lists = [...groups.values()]
  const out: string[] = []
  while (out.length < cap && lists.some((l) => l.length)) for (const l of lists) if (l.length && out.length < cap) out.push(l.pop()!)
  return out
}

const PER_WEEK: Record<Tier, number> = { easy: 2, medium: 3, hard: 2 }
const CAPS: Record<6 | 8, Record<Tier, number>> = {
  8: { easy: 320, medium: 480, hard: 320 }, // ≈ 3 years before any tier repeats
  6: { easy: 1000, medium: 1000, hard: 1000 }, // Mini: take everything there is (6 tiles can't hold 2 operators → no hard tier)
}

const pool: Record<string, Record<Tier, string[]>> = {}
const report: string[] = []
for (const len of [8, 6] as const) {
  const all = enumerate(len)
  const r = rng(len === 8 ? 20260105 : 60600)
  pool[len] = { easy: pick(all.easy, CAPS[len].easy, r), medium: pick(all.medium, CAPS[len].medium, r), hard: pick(all.hard, CAPS[len].hard, r) }
  if (len === 6) {
    // Mini walks one interleaved list (src/games/nerdle.ts MINI_ORDER), one puzzle per day
    const days = pool[6].easy.length + pool[6].medium.length
    report.push(`6-tile all   : ${days} valid (no 2-operator equations fit in 6 tiles) → no repeat for ${days} days (~${(days / 30.4).toFixed(1)} months)`)
    continue
  }
  for (const tier of ['easy', 'medium', 'hard'] as Tier[]) {
    const weeks = Math.floor(pool[len][tier].length / PER_WEEK[tier])
    report.push(`${len}-tile ${tier.padEnd(6)}: ${String(all[tier].length).padStart(6)} valid, ${String(pool[len][tier].length).padStart(4)} pooled → no repeat for ${weeks} weeks (~${(weeks / 52).toFixed(1)} years)`)
  }
}

const body = (list: string[]) => list.map((e) => `'${e}'`).join(', ')
writeFileSync('src/games/nerdlePool.ts', `// GENERATED by scripts/gen-nerdle.ts — do not edit by hand.
// Every equation passes the game's validateEquation(); order is a fixed seeded shuffle, interleaved
// by operation so each tier mixes +, −, ×, ÷ and order-of-operations puzzles.
export type NerdleTier = 'easy' | 'medium' | 'hard'

export const NERDLE_POOL: Record<6 | 8, Record<NerdleTier, readonly string[]>> = {
  8: {
    easy: [${body(pool[8].easy)}],
    medium: [${body(pool[8].medium)}],
    hard: [${body(pool[8].hard)}],
  },
  6: {
    easy: [${body(pool[6].easy)}],
    medium: [${body(pool[6].medium)}],
    hard: [${body(pool[6].hard)}],
  },
}
`)
console.log(report.join('\n'))
