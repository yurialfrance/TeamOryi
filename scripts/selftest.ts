import { WORLDS } from '../src/curriculum/worlds'
import { checkAnswer } from '../src/engine/check'
let fails = 0, n = 0
for (const w of WORLDS) for (const s of w.stages) for (const g of s.gens) for (let i = 0; i < 150; i++) {
  const q = g(); n++
  let v: unknown
  if (q.kind === 'choice') { v = q.correctIndex; if (q.correctIndex < 0 || new Set(q.choices.map(c=>c.latex??c.text)).size !== q.choices.length) { fails++; console.log('BAD CHOICES', s.id, q.choices, q.correctIndex) } }
  else if (q.kind === 'numberline') v = q.answerIndex
  else if (q.kind === 'tiles') { v = q.answerSeq[0]; if (!q.answerSeq[0].every(t => q.tiles.includes(t))) { fails++; console.log('TILES MISSING', q) } }
  else v = q.answers[0]
  const r = checkAnswer(q, v)
  if (r !== 'correct') { fails++; if (fails < 15) console.log('FAIL', s.id, q.kind, JSON.stringify(v), q.latex, r) }
  if (q.kind === 'input') {
    const wrong = checkAnswer(q, String(Number(q.answers[0].replace(/[^\d.-]/g,'')) + 1))
    if (wrong === 'correct' && !/n/.test(q.answers[0])) { fails++; console.log('WRONG ACCEPTED', s.id, q.answers) }
  }
}
console.log(`checked ${n}, fails ${fails}`)
