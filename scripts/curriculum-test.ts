// Asserting tests for the Landas curriculum: one island per grade (MATATAG G1–10) plus the SHS /
// college sampler, saved progress survives the restructure, every question is topic-tagged, and the
// calculus sampler's answers agree with the Tutor's own calculus engine.
import { ComputeEngine } from '@cortex-js/compute-engine'
import { WORLDS, buildLesson, findStage, worldIdOrDefault, LEGACY_WORLD, DEFAULT_WORLD } from '../src/curriculum/worlds'
import { TOPICS, isTopic } from '../src/engine/topics'
import { ICON_NAMES } from '../src/components/iconNames'
import { solveLatex } from '../src/engine/solver'
import { checkInput } from '../src/engine/check'
import { islandLayout } from '../src/components/islandLayout'
import * as STEM from '../src/curriculum/stem'

let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}\n     got  ${JSON.stringify(got).slice(0, 400)}\n     want ${JSON.stringify(want)}`) }
}

// ---------------------------------------------------------------- structure
const grades = WORLDS.filter((w) => w.tier === 'grade')
check('one island per grade, Grade 1 → Grade 10 in order', grades.map((w) => w.level), Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`))
check('every grade island has at least 8 stages', grades.filter((w) => w.stages.length < 8).map((w) => [w.level, w.stages.length]), [])
check('sampler tier: SHS General Math (×2), Stats, STEM, College GE (×2)', WORLDS.filter((w) => w.tier === 'sampler').map((w) => w.id), ['shs', 'genmath', 'stats', 'stem', 'college', 'mmw'])
check('sampler islands come after Grade 10', WORLDS.findIndex((w) => w.tier === 'sampler') > WORLDS.findIndex((w) => w.id === 'grade10'), true)
const allStages = WORLDS.flatMap((w) => w.stages)
check('stage ids are unique', allStages.length, new Set(allStages.map((s) => s.id)).size)
console.log(`  ${WORLDS.length} islands, ${allStages.length} stages, ${grades.reduce((a, w) => a + w.stages.length, 0)} in Grade 1–10`)

// saved progress: `completed` is keyed by stage id, so every pre-restructure stage must still exist
const LEGACY_STAGES = ['p', 'e', 'i', 'j', 'g', 's', 't', 'c'].flatMap((p) => [1, 2, 3, 4, 5].map((n) => `${p}${n}`))
check('all 40 pre-restructure stage ids still exist (stars and progress survive)', LEGACY_STAGES.filter((id) => !findStage(id)), [])
check('old band ids map to a grade island', Object.keys(LEGACY_WORLD).map(worldIdOrDefault), ['grade2', 'grade4', 'grade6', 'grade7', 'grade9'])
check('kept ids stay, unknown ids fall back to the default', [worldIdOrDefault('shs'), worldIdOrDefault('college'), worldIdOrDefault('grade8'), worldIdOrDefault('__proto__'), worldIdOrDefault(undefined)], ['shs', 'college', 'grade8', DEFAULT_WORLD, DEFAULT_WORLD])

// ---------------------------------------------------------------- authoring
check('every stage has a "Matuto muna" guide', allStages.filter((s) => !s.guide.length || s.guide.some((g) => !g.title || !g.text)).map((s) => s.id), [])
check('every stage / island icon exists', [...WORLDS.map((w) => w.icon), ...allStages.map((s) => s.icon)].filter((i) => !(ICON_NAMES as readonly string[]).includes(i)), [])
check('every generator is tagged with a real topic', allStages.flatMap((s) => s.gens.filter((g) => !isTopic(g.topic)).map(() => s.id)), [])

// every question that reaches the learner carries a topic, and that topic belongs to the island's grade (±1)
const offGrade = new Set<string>(), untagged = new Set<string>()
for (const w of WORLDS) {
  const grade = w.tier === 'grade' ? Number(w.level.replace('Grade ', '')) : null
  for (const s of w.stages) for (let i = 0; i < 25; i++) for (const q of buildLesson(s)) {
    if (!q.topic || !isTopic(q.topic)) { untagged.add(s.id); continue }
    const [lo, hi] = TOPICS[q.topic].grades
    if (grade !== null && (grade < lo - 1 || grade > hi + 1)) offGrade.add(`${s.id}:${q.topic}`)
    if (grade === null && hi < 9) offGrade.add(`${s.id}:${q.topic}`)
  }
}
check('every lesson question is topic-tagged', [...untagged], [])
check('question topics fit the island grade (±1)', [...offGrade], [])
check('a grade island covers several strands (not just one skill)', grades.filter((w) => new Set(w.stages.flatMap((s) => s.gens.map((g) => TOPICS[g.topic].strand))).size < 3).map((w) => w.id), [])

// ---------------------------------------------------------------- calculus sampler vs the Tutor's engine
const ce = new ComputeEngine()
let calcBad: string[] = []
for (let i = 0; i < 40; i++) {
  for (const g of [STEM.limits, STEM.integrals]) {
    const q = g()
    if (q.kind !== 'input') continue
    const r = solveLatex(q.latex!)
    if (r.answer === undefined || checkInput({ ...q, answers: [r.answer], requireSimplest: false }, q.answers[0]) !== 'correct') calcBad.push(`${q.latex} want ${q.answers[0]} engine ${r.answer}`)
  }
  const d = STEM.derivatives()
  const poly = d.latex!.replace(/^f\(x\) = /, '')
  if (d.kind === 'choice') {
    const r = solveLatex(`\\frac{d}{dx}\\left(${poly}\\right)`)
    const want = d.choices[d.correctIndex].latex!
    const engine = r.answer?.replace(/^.*=\s*/, '') // engine answers "f'(x) = …"
    if (engine === undefined || checkInput({ id: '', kind: 'input', prompt: '', hints: [], solution: [], answerDisplay: '', answers: [engine] }, want) !== 'correct') calcBad.push(`d/dx ${poly}: want ${want} engine ${r.answer}`)
  } else if (d.kind === 'input') {
    const a = Number(/x = (-?\d+)/.exec(d.prompt)![1]), h = 1e-4
    const f = (x: number) => Number(ce.parse(poly).subs({ x }).N().re)
    const slope = (f(a + h) - f(a - h)) / (2 * h)
    if (Math.abs(slope - Number(d.answers[0])) > 1e-3) calcBad.push(`f'(${a}) of ${poly}: want ${d.answers[0]} numeric ${slope}`)
  }
}
check('limits, integrals and derivatives agree with the calculus engine', calcBad.slice(0, 4), [])
calcBad = []

// ---------------------------------------------------------------- island map scales with stage count
for (const n of [5, 8, 9, 12]) {
  const L = islandLayout(n)
  const nodes = [...L.s, L.chest, L.trophy]
  const overlap = nodes.some((p, i) => nodes.some((q, j) => i < j && Math.abs(p.y - q.y) < 40 && Math.abs(p.x - q.x) < 15))
  check(`island with ${n} stages: ${n} nodes + chest + trophy, inside the island, no overlaps`, [L.s.length, nodes.every((p) => p.y > 20 && p.y < L.H && p.x > 0 && p.x < 100), overlap], [n, true, false])
}

console.log(`curriculum-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
