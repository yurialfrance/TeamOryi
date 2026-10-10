// Asserting tests for the three games' content + the report tallies + the no-emoji rule.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { NERDLE_POOL } from '../src/games/nerdlePool'
import { dailyPuzzle, practicePuzzle, nerdleTopic, validateEquation } from '../src/games/nerdle'
import { DENOMINATIONS, generateOrder, makeChange, type CashierMode } from '../src/games/cashier'
import { BANK, createDuelPicker, type Level } from '../src/games/duelBank'
import { GRADE_BANDS, TOPICS, isTopic } from '../src/engine/topics'
import { addAttempt, parseKey, sanitizeProgress } from '../src/store/progress'

let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}\n     got  ${JSON.stringify(got).slice(0, 300)}\n     want ${JSON.stringify(want)}`) }
}
const isoDay = (n: number) => new Date(Date.UTC(2026, 0, 5 + n)).toISOString().slice(0, 10)

// ---------------------------------------------------------------- Nerdle
for (const len of [8, 6] as const) {
  const all = [...NERDLE_POOL[len].easy, ...NERDLE_POOL[len].medium, ...NERDLE_POOL[len].hard]
  check(`nerdle ${len}: every puzzle is winnable (passes the game's validator)`, all.filter((e) => !validateEquation(e, len).valid), [])
  check(`nerdle ${len}: no duplicates`, new Set(all).size, all.length)
  check(`nerdle ${len}: every puzzle has a topic`, all.every((e) => isTopic(nerdleTopic(e))), true)
}
check('nerdle 8: big pool (≥ 1,000)', [...NERDLE_POOL[8].easy, ...NERDLE_POOL[8].medium, ...NERDLE_POOL[8].hard].length >= 1000, true)
check('nerdle 8: mixed / order-of-operations puzzles exist', NERDLE_POOL[8].hard.some((e) => nerdleTopic(e) === 'order-of-operations'), true)
{
  const days = Array.from({ length: 3 * 365 }, (_, n) => dailyPuzzle(isoDay(n), 8).equation)
  check('nerdle 8: daily puzzle never repeats for 3 years', new Set(days).size, days.length)
  const tiers = Array.from({ length: 7 }, (_, n) => dailyPuzzle(isoDay(n), 8).tier)
  check('nerdle 8: Mon–Tue madali, Wed–Fri katamtaman, Sat–Sun mahirap', tiers, ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard'])
  check('nerdle: same date → same puzzle', dailyPuzzle('2026-10-10', 8).equation, dailyPuzzle('2026-10-10', 8).equation)
  const mini = NERDLE_POOL[6].easy.length + NERDLE_POOL[6].medium.length
  const miniDays = Array.from({ length: mini }, (_, n) => dailyPuzzle(isoDay(n), 6).equation)
  check(`nerdle 6: daily never repeats for its whole pool (${mini} days)`, new Set(miniDays).size, mini)
  const recent = ['14+28=42']
  check('nerdle practice avoids the recently played', Array.from({ length: 200 }, () => practicePuzzle(8, recent).equation).includes('14+28=42'), false)
}

// ---------------------------------------------------------------- Cashier
const NGC = ['b1000', 'b500', 'b200', 'b100', 'b50', 'b20', 'c20', 'c10', 'c5', 'c1', 'c025', 'c005', 'c001']
check('cashier: current BSP money only (no 10-sentimo coin)', DENOMINATIONS.map((d) => d.id), NGC)
const TOPIC_BY_MODE: Record<CashierMode, string[]> = { easy: ['money-exact-payment', 'money-multi-item'], medium: ['money-sukli-whole'], hard: ['money-sukli-decimal', 'money-exact-decimal'] }
for (const mode of ['easy', 'medium', 'hard'] as CashierMode[]) {
  const orders = Array.from({ length: 4000 }, () => generateOrder(mode))
  check(`cashier ${mode}: totals add up`, orders.every((o) => o.totalCents === o.items.reduce((s, i) => s + i.item.cents * i.qty, 0)), true)
  check(`cashier ${mode}: something to hand over`, orders.every((o) => o.targetCents > 0), true)
  check(`cashier ${mode}: customer never under-pays`, orders.every((o) => o.paidCents === undefined || o.paidCents > o.totalCents), true)
  check(`cashier ${mode}: every amount can be made with real coins/bills`, orders.every((o) => makeChange(o.targetCents).length > 0), true)
  check(`cashier ${mode}: tagged with the right topics`, [...new Set(orders.map((o) => o.topic))].sort(), [...TOPIC_BY_MODE[mode]].sort())
  check(`cashier ${mode}: no duplicate item lines`, orders.every((o) => new Set(o.items.map((i) => i.item.id)).size === o.items.length), true)
}
check('cashier tingi-tingi: whole pesos only', Array.from({ length: 2000 }, () => generateOrder('easy')).every((o) => o.totalCents % 100 === 0), true)
check('cashier sukli master: whole-peso sukli', Array.from({ length: 2000 }, () => generateOrder('medium')).every((o) => o.targetCents % 100 === 0), true)
check('cashier sentimo: centavos really appear', Array.from({ length: 500 }, () => generateOrder('hard')).filter((o) => o.targetCents % 100 !== 0).length > 300, true)
check('cashier: sometimes several of one item', Array.from({ length: 500 }, () => generateOrder('easy')).some((o) => o.items.some((i) => i.qty > 1)), true)
check('cashier: realistic big-bill payments happen', Array.from({ length: 2000 }, () => generateOrder('medium')).some((o) => o.paidNote?.startsWith('Walang barya')), true)
check('cashier: ₱38.75 sukli = ₱20 + ₱10 + ₱5 + 3×₱1 + 3×25¢', makeChange(3875), [{ id: 'c20', count: 1 }, { id: 'c10', count: 1 }, { id: 'c5', count: 1 }, { id: 'c1', count: 3 }, { id: 'c025', count: 3 }])

// ---------------------------------------------------------------- Tagisan ng Talino
const SYM: Record<string, (a: number, b: number) => number> = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b }
for (const band of GRADE_BANDS) {
  const gens = BANK[band.id]
  check(`duel ${band.label}: at least 12 question types`, gens.length >= 12, true)
  for (const lvl of [1, 2, 3] as Level[]) {
    const qs = gens.flatMap((g) => Array.from({ length: 60 }, () => g(lvl)))
    const bad = qs.filter((q) => q.choices.length !== 4 || new Set(q.choices).size !== 4 || q.correct < 0 || /NaN|undefined|Infinity/.test(q.prompt + (q.tex ?? '') + q.choices.join()))
    check(`duel ${band.label} L${lvl}: 4 distinct, well-formed choices`, bad.slice(0, 2).map((q) => [q.prompt, q.tex, q.choices]), [])
    check(`duel ${band.label} L${lvl}: topics exist and fit the grade band`, qs.filter((q) => !isTopic(q.topic) || TOPICS[q.topic].grades[0] > band.grades[1] + 1 || TOPICS[q.topic].grades[1] < band.grades[0] - 1).map((q) => q.topic).slice(0, 3), [])
    // independent re-check of every plain arithmetic question
    const wrong = qs.filter((q) => {
      const m = q.prompt.match(/^(-?\d+) ([+−×÷]) \(?(-?\d+)\)? = \?$/)
      return m && String(SYM[m[2]](Number(m[1]), Number(m[3]))) !== q.choices[q.correct]
    })
    check(`duel ${band.label} L${lvl}: arithmetic answers are right`, wrong.slice(0, 2).map((q) => [q.prompt, q.choices[q.correct]]), [])
  }
  const picker = createDuelPicker(band.id)
  const keys = Array.from({ length: 30 }, () => picker.next().key)
  check(`duel ${band.label}: no repeat within a 30-round match`, new Set(keys).size, 30)
}
{
  const p = createDuelPicker('g4-6')
  p.feedback(true); p.feedback(true)
  const up = p.level
  p.feedback(false)
  check('duel adapts: 2 right → harder, a miss → easier', [up, p.level], [2, 1])
}

// ---------------------------------------------------------------- report tallies
{
  let p = addAttempt({}, '2026-10-10', 'duel', 'fractions-comparing', true, 4000)
  p = addAttempt(p, '2026-10-10', 'duel', 'fractions-comparing', false, 6000)
  p = addAttempt(p, '2026-10-10', 'landas:g4', 'fractions-comparing', true, 3000)
  check('tallies per source + topic per day', p['2026-10-10'], { 'duel|fractions-comparing': [2, 1, 10000], 'landas:g4|fractions-comparing': [1, 1, 3000] })
  p = addAttempt(p, '2029-01-01', 'nerdle', 'order-of-operations', true, 1)
  check('days older than two years are dropped', Object.keys(p), ['2029-01-01'])
  check('keys parse back', parseKey('landas:g10|quadratic-equations'), { source: 'landas:g10', topic: 'quadratic-equations' })
  check('backup restore drops junk', sanitizeProgress({ '2026-10-10': { 'duel|fractions-comparing': [3, 2, 900], 'evil|x': [1, 1, 1], 'duel|not-a-topic': [1, 1, 1] }, bad: {} }), { '2026-10-10': { 'duel|fractions-comparing': [3, 2, 900] } })
}

// ---------------------------------------------------------------- no emoji in the UI
{
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{1F004}-\u{1F251}]/u
  // allowed: the Nerdle share grid (copied as text, the standard Wordle format) and the
  // solver's character maps that READ pasted × ✕ symbols and turn them into TeX
  const ALLOW = [/🟩|🟪|⬜/, /replace\(\/\[×✕/]
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
  const hits = walk('src').filter((f) => /\.tsx?$/.test(f)).flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => [f, i + 1, l] as const)).filter(([, , l]) => EMOJI.test(l) && !ALLOW.some((a) => a.test(l)))
  check('no emoji anywhere in UI source', hits.map(([f, n]) => `${f}:${n}`), [])
}

console.log(`games-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
