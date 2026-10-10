// Asserting tests for the assessment reports: scoring thresholds, the report model, and real PDF
// rendering (jsPDF in node, same code as the app).
import { readFileSync } from 'node:fs'
import { masteryLevel, recommendations, scoreTopics, strengths, MASTERY } from '../src/engine/mastery'
import { buildReport, presetRange, type ReportInput } from '../src/report/model'
import { renderReportPdf } from '../src/report/pdf'
import { addAttempt, type Progress } from '../src/store/progress'
import { TOPICS, type TopicId } from '../src/engine/topics'

let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}\n     got  ${JSON.stringify(got).slice(0, 300)}\n     want ${JSON.stringify(want)}`) }
}

// ---------------------------------------------------------------- thresholds
check('thresholds are 80% / 50% / 5 attempts', [MASTERY.strong, MASTERY.weak, MASTERY.minAttempts], [0.8, 0.5, 5])
check('exactly 80% → malakas', masteryLevel(10, 8), 'malakas')
check('79% → umuunlad', masteryLevel(100, 79), 'umuunlad')
check('exactly 50% → umuunlad', masteryLevel(10, 5), 'umuunlad')
check('49% → mahina', masteryLevel(100, 49), 'mahina')
check('fewer than 5 answers → kulang pa ang datos (even 4/4)', masteryLevel(4, 4), 'kulang')

// ---------------------------------------------------------------- scoring & recommendations
const T = (attempts: number, correct: number, sec = 8) => ({ attempts, correct, ms: attempts * sec * 1000 })
const scored = scoreTopics({
  'decimals-addition-subtraction': T(20, 6),
  'fractions-comparing': T(20, 13),
  'whole-numbers-multiplication': T(30, 29),
  'percent-of-a-number': T(3, 3),
  'geometry-angles': T(10, 9, 45),
})
check('weakest topics come first', scored.map((s) => s.topic), ['decimals-addition-subtraction', 'fractions-comparing', 'geometry-angles', 'whole-numbers-multiplication', 'percent-of-a-number'])
const lists = strengths(scored)
check('malakas / umuunlad / mahina / kulang lists', [lists.malakas.length, lists.umuunlad.length, lists.mahina.length, lists.kulang.length], [2, 1, 1, 1])
const recs = recommendations(scored)
check('first recommendation targets the weakest topic', recs[0].startsWith(`Dapat pagtuunan ng pansin: ${TOPICS['decimals-addition-subtraction'].label}`), true)
check('almost-there topic gets an encouragement line', recs.some((r) => r.startsWith('Malapit nang ma-master')), true)
check('slow-but-right topic is pointed out', recs.some((r) => r.startsWith('Tama pero mabagal') && r.includes(TOPICS['geometry-angles'].label)), true)
check('ends on a strength', recs.some((r) => r.startsWith('Ipagpatuloy')), true)
check('no recommendation for too-little data', recommendations(scoreTopics({ 'percent-of-a-number': T(2, 1) }))[0].startsWith('Kailangan pa ng mas maraming sagot'), true)

// ---------------------------------------------------------------- report model
let p: Progress = {}
const add = (day: string, source: string, topic: TopicId, n: number, ok: number) => {
  for (let i = 0; i < n; i++) p = addAttempt(p, day, source as never, topic, i < ok, 5000)
}
add('2026-09-01', 'duel', 'fractions-comparing', 10, 4)
add('2026-10-08', 'duel', 'fractions-comparing', 10, 9)
add('2026-10-08', 'cashier', 'money-sukli-decimal', 12, 6)
add('2026-10-01', 'landas:g4', 'fractions-equivalent', 8, 7)
add('2026-10-09', 'landas:g5', 'decimals-multiplication-division', 6, 2)
const input: ReportInput = {
  progress: p, name: 'Juan', completed: { a1: { stars: 3, best: 1 }, a2: { stars: 2, best: 1 } },
  duelWins: 3, duelsPlayed: 5, duelPvp: { matches: 2, rounds: 10, p1Correct: 6, p2Correct: 4 }, nerdleWins: 0, nerdlePlayed: 0, nerdleStreak: 0,
}
const all = { from: '2026-01-01', to: '2026-10-10' }
const duel = buildReport('duel', input, all, '2026-10-10')
check('duel report only counts duel answers', [duel.summary.attempts, duel.summary.correct], [20, 13])
check('date range filters days', buildReport('duel', input, { from: '2026-10-01', to: '2026-10-10' }, '2026-10-10').summary.attempts, 10)
check('unattributed 2-player matches shown as totals only', duel.facts.some((f) => f.value === '2 laban, 10 rounds'), true)
check('cashier report: money topic, 6/12 = 50% → umuunlad', [buildReport('cashier', input, all, '2026-10-10').topics[0].topic, buildReport('cashier', input, all, '2026-10-10').topics[0].level], ['money-sukli-decimal', 'umuunlad'])
const islands = [{ id: 'g4', grade: 'Grade 4', stageIds: ['a1', 'a2', 'a3'] }, { id: 'g5', grade: 'Grade 5', stageIds: ['b1'] }, { id: 'g6', grade: 'Grade 6', stageIds: ['c1'] }]
const landas = buildReport('landas', input, all, '2026-10-10', islands)
check('landas: only Landas answers', landas.summary.attempts, 14)
check('landas: grade rows for islands with activity', landas.grades?.map((g) => [g.grade, g.stagesDone, g.attempts, g.level]), [['Grade 4', 2, 8, 'malakas'], ['Grade 5', 0, 6, 'mahina']])
check('landas: weekly trend, oldest first', landas.trend?.map((w) => w.weekOf), ['2026-09-28', '2026-10-05'])
check('empty range → empty report', buildReport('nerdle', input, all, '2026-10-10').empty, true)
check('preset: last 7 days', presetRange('7', '2026-10-10', p), { from: '2026-10-04', to: '2026-10-10' })
check('preset: all time starts at the first recorded day', presetRange('all', '2026-10-10', p), { from: '2026-09-01', to: '2026-10-10' })

// ---------------------------------------------------------------- PDF
const fonts = { regular: readFileSync('node_modules/@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'), bold: readFileSync('node_modules/@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf') }
const head = (b: Uint8Array) => new TextDecoder().decode(b.subarray(0, 5))
const pages = (b: Uint8Array) => (new TextDecoder('latin1').decode(b).match(/\/Type\s*\/Page[^s]/g) ?? []).length
for (const m of [duel, landas, buildReport('nerdle', input, all, '2026-10-10')]) {
  const pdf = renderReportPdf(m, fonts)
  check(`${m.kind} PDF renders (${pdf.length} bytes, ${pages(pdf)} page/s)`, [head(pdf), pages(pdf) >= 1], ['%PDF-', true])
}
{
  // every topic at once must paginate cleanly
  let big: Progress = {}
  for (const id of Object.keys(TOPICS) as TopicId[]) for (let i = 0; i < 6; i++) big = addAttempt(big, '2026-10-01', 'duel', id, i % 2 === 0, 9000)
  const pdf = renderReportPdf(buildReport('duel', { ...input, progress: big }, all, '2026-10-10'), fonts)
  check(`report with all ${Object.keys(TOPICS).length} topics spans several pages`, pages(pdf) >= 3, true)
}

console.log(`report-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
