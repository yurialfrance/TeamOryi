// Asserting tests for "Kwento ni Pipo" word problems: the math comes only from code (recomputed here
// independently), the validator rejects every way an AI story can break the math, accepts real
// paraphrases, and the pipeline falls back to the code-written facts when the AI misbehaves.
import { makeSpec, recompute, KIND_TOPICS, kindsForTopic, type WPSpec } from '../src/engine/word-problems/spec'
import { validateStory, cleanStory, findNumbers } from '../src/engine/word-problems/validate'
import { dressSpec, storyQuestion, storyMessages, type StoryModel } from '../src/engine/word-problems/dress'
import { planWordProblems, StoryBuffer } from '../src/engine/word-problems/buffer'
import { audience, generate } from '../src/ai/llm'
import { checkInput } from '../src/engine/check'
import { WORLDS } from '../src/curriculum/worlds'

let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}\n     got  ${JSON.stringify(got).slice(0, 400)}\n     want ${JSON.stringify(want)}`) }
}
/** seeded RNG so failures are reproducible */
const mulberry = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`

// ---------------------------------------------------------------- 1. the math layer
const MAX_PAID: Record<number, number> = { 1: 99, 2: 500, 3: 1000, 4: 1000, 5: 1000, 6: 1000 }
let specs: WPSpec[] = []
const bad: string[] = []
for (let grade = 1; grade <= 6; grade++) {
  for (const topic of KIND_TOPICS.change) {
    if (!kindsForTopic(topic, grade).includes('change')) continue
    for (let i = 0; i < 200; i++) {
      for (const lang of ['taglish', 'english'] as const) {
        const s = makeSpec('change', topic, grade, lang, mulberry(grade * 100000 + i * 7 + (lang === 'english' ? 3 : 0)))
        if (!s) { bad.push(`no spec G${grade} ${topic}`); continue }
        specs.push(s)
        const v = s.givens.map((g) => g.value)
        if (recompute(s) !== s.answer) bad.push(`answer G${grade}: ${s.facts} → ${s.answer}`)
        if (s.answer <= 0 || v.includes(1) || v.includes(s.answer) || new Set(v).size !== v.length) bad.push(`shape G${grade}: ${s.facts}`)
        if (v[v.length - 1] > MAX_PAID[grade]) bad.push(`too big for G${grade}: ${s.facts}`)
        if (grade === 1 && s.items.length !== 1) bad.push(`G1 has one item: ${s.facts}`)
        // the answer key accepts the spec answer and nothing next to it
        const q = storyQuestion(s, { story: s.facts, source: 'template' })
        if (checkInput(q, String(s.answer)) !== 'correct' || checkInput(q, String(s.answer + 1)) === 'correct') bad.push(`answer key: ${s.facts}`)
      }
    }
  }
}
check(`${specs.length} change specs (G1–6, Taglish + English): answers recomputed independently, sized to the grade`, bad.slice(0, 4), [])
check('grade 7+ and unrelated topics get no story (stage keeps its own questions)', [kindsForTopic('money-sukli-whole', 7), kindsForTopic('quadratic-equations', 9), kindsForTopic('fractions-concept', 3)], [[], [], []])

// ---------------------------------------------------------------- 2. the fallback is always valid
const failingFacts = specs.map((s) => [s.facts, validateStory(s.facts, s).reasons] as const).filter(([, r]) => r.length)
check('every code-written fallback story passes its own validator', failingFacts.slice(0, 3), [])

// ---------------------------------------------------------------- 3. bad stories are rejected
const s = makeSpec('change', 'money-sukli-whole', 3, 'taglish', mulberry(42))!
const [p1, p2] = s.items.map((i) => i.price)
const [i1, i2] = s.items.map((i) => i.name)
const paid = s.givens[s.givens.length - 1].value
const P = s.person
const reasonsOf = (story: string) => validateStory(story, s).reasons
const rejects = (name: string, story: string, expectReason: RegExp) => {
  const r = reasonsOf(story)
  check(`rejects: ${name}`, r.some((x) => expectReason.test(x)), true)
}
const good = `Mainit ang hapon nang pumunta si ${P} sa tindahan ni Aling Nena. Kinuha niya ang ${i1} na ${peso(p1)} at ${i2} na ${peso(p2)}, tapos iniabot niya ang ${peso(paid)}.`
check('sanity: the "good" story passes', reasonsOf(good), [])
rejects('a changed number', good.replace(peso(p1), peso(p1 + 1)), /^numbers:/)
rejects('a dropped number', good.replace(` at ${i2} na ${peso(p2)}`, ` at ${i2}`), /^numbers:/)
rejects('an extra number', good.replace('Mainit ang hapon', 'Alas 3 ng hapon'), /^numbers:/)
rejects('swapped order (roles swapped)', good.replace(peso(p1), '§').replace(peso(paid), peso(p1)).replace('§', peso(paid)), /^order$/)
rejects('the answer leaked', `${good.slice(0, -1)}, kaya ${peso(s.answer)} ang sukli niya.`, /answer-leak|numbers:/)
rejects('a peso amount lost its ₱', good.replace(peso(p2), String(p2)), /^unit:/)
rejects('a number written in words', good.replace('Mainit ang hapon', 'Dalawang beses siyang bumalik'), /number-in-words/)
rejects('an all-English sentence', `${P} went to the store with ${peso(paid)}. ${P} bought ${i1} for ${peso(p1)} and ${i2} for ${peso(p2)} at the store.`, /language/)
rejects('a question of its own', `${good} Magkano kaya ang sukli?`.replace(/\.\s*Magkano/, ' — magkano'), /asks-question/)
rejects('math notation', good.replace(peso(p1), `$${p1}$`), /math-notation|unit:/)
rejects('the person renamed', good.replace(new RegExp(P, 'g'), P === 'Juan' ? 'Pedro' : 'Juan'), /person-missing/)
rejects('an item dropped', good.replace(i1, 'kendi'), /item-missing/)
rejects('too long for the grade', `${good} Masaya siya. Umuwi siya agad.`, /too-many-sentences/)
rejects('empty', '  ', /empty/)

// ---------------------------------------------------------------- 4. real paraphrases are accepted
const paraphrases = [
  good,
  `Si ${P} ay inutusan ni Nanay sa sari-sari store. Binili niya ang ${i1} na ${peso(p1)} at ang ${i2} na ${peso(p2)}, at nag-abot siya kay Aling Nena ng ${peso(paid)}.`,
  `Pagkatapos ng klase, dumaan si ${P} sa tindahan. Kumuha siya ng ${i1} (${peso(p1)}) at ${i2} (${peso(p2)}) at nagbayad ng ${peso(paid)} sa tindera.`,
  `Gutom na si ${P} kaya bumili siya ng ${i1} na ${peso(p1)} at ${i2} na ${peso(p2)} sa isang tindahan. Iniabot niya ang ${peso(paid)}.`, // "isang" = the article "a"
  `Si ${P} ay bumili ng ${i1} na P${p1} at ${i2} na ${p2} pesos kay Aling Nena. Nagbayad siya ng ${peso(paid)}.`, // P-prefix and "pesos" both count as peso marks
]
check('accepts natural Taglish retellings (incl. "isang", P-prefix, "pesos")', paraphrases.map((t) => reasonsOf(t)), paraphrases.map(() => []))
check('model output is cleaned: labels, quotes and a trailing question are dropped', cleanStory(`Kwento: "${good} Magkano ang sukli?"`), good)
check('numbers with thousands separators and ₱ are read', findNumbers('₱1,250 at P45 at 30 pesos at 7').map((f) => [f.value, f.peso]), [[1250, true], [45, true], [30, true], [7, false]])

// ---------------------------------------------------------------- 4b. stricter checks, on REAL outputs of the 0.5B model
// (these passed the numbers/order/units/anchors/grammar-word checks — the words themselves are noise)
{
  const g1 = makeSpec('change', 'whole-numbers-subtraction', 1, 'taglish', mulberry(3))!
  const w = (t: string) => t.replace(/\{P\}/g, g1.person).replace(/\{I\}/g, g1.items[0].name).replace(/\{a\}/g, peso(g1.items[0].price)).replace(/\{paid\}/g, peso(g1.givens[1].value))
  const real = [
    w('{P} ng {I} na {a} sa sari-sari store ni Aling Nena. At i-kayag ng {paid}.'),
    w('Facto, maaapakay ng {P} ng {I} na {a} sa sari-sari store ni Aling Nena. Nagbayad, sa {paid}.'),
  ]
  check('real 0.5B gibberish is rejected by the known-word check', real.map((t) => validateStory(t, g1).reasons.find((r) => r.startsWith('unknown-words')) ?? 'PASSED'), ['unknown-words:i-kayag', 'unknown-words:facto,maaapakay'])
  check('prompt echo is rejected', validateStory(w('FACTS: Bumili si {P} ng {I} na {a}. SETTING: nagbayad ng {paid}.'), g1).reasons.includes('prompt-echo'), true)
  const copy = w('Bumili si {P} ng {I} na {a} sa sari-sari store ni Aling Nena. Nagbayad siya ng {paid} kay Aling Nena.')
  const r = await dressSpec(g1, async () => copy)
  check('a near-copy of the facts passes the checks but is shown as the template — no badge, no AI credit', [validateStory(copy, g1).ok, r?.source, r?.story === g1.facts, r?.rejected[0]?.reasons], [true, 'template', true, ['copied-facts']])
  const real2 = w('Maagang gumising si {P} at dumaan sa tindahan ni Aling Nena. Kinuha niya ang {I} na {a} at iniabot ang {paid}.')
  check('a real retelling still earns the badge', (await dressSpec(g1, async () => real2))?.source, 'ai')
}

// ---------------------------------------------------------------- 5. the pipeline with a fake model
const fake = (outputs: (string | null)[]): StoryModel => async () => (outputs.length ? outputs.shift()! : null)
const broken = good.replace(peso(p1), peso(p1 + 5))
const run = async (outs: (string | null)[]) => {
  const r = await dressSpec(s, fake(outs))
  return r && [r.source, r.attempts, r.rejected.length, r.source === 'template' ? r.story === s.facts : r.story === good]
}
check('good story → used as AI story on the first try', await run([good]), ['ai', 1, 0, true])
check('bad then good → AI story on the retry', await run([broken, good]), ['ai', 2, 1, true])
check('bad twice → code-written facts (never a broken problem)', await run([broken, broken]), ['template', 2, 2, true])
check('bad, then the AI goes quiet → facts', await run([broken, null]), ['template', 1, 1, true])
check('AI unavailable / interrupted → no word problem (lesson keeps its own question)', await run([null]), null)
{
  const r = (await dressSpec(s, fake([broken, broken])))!
  const q = storyQuestion(s, r)
  check('fallback question: facts + code question, template origin, spec answer', [q.prompt, q.origin, q.answers[0]], [`${s.facts} ${s.question}`, 'story-template', String(s.answer)])
  const a = storyQuestion(s, (await dressSpec(s, fake([good])))!)
  check('AI question: story + code question, ai-story origin (the badge), same answer key', [a.prompt.endsWith(s.question), a.origin, a.answers[0], a.topic], [true, 'ai-story', String(s.answer), 'money-sukli-whole'])
}
{
  const m = storyMessages(s)
  const u = m[1].content
  check('prompt gives the exact numbers, the facts, the setting, and the Taglish rule', [u.includes(s.facts), u.includes(`${peso(p1)}, ${peso(p2)}, ${peso(paid)}`), /sari-sari/.test(u), /Taglish/.test(u), /Grade 3/.test(m[0].content)], [true, true, true, true, true])
}

// ---------------------------------------------------------------- 6. lesson planning and the buffer
const stage = (id: string) => WORLDS.flatMap((w) => w.stages).find((x) => x.id === id)!
const topicsOf = (id: string) => stage(id).gens.map((g) => g.topic)
check('Grade 1 subtraction and money stages get story slots', [planWordProblems(topicsOf('gr1-5'), 1).length, planWordProblems(topicsOf('gr1-6'), 1).length, planWordProblems(topicsOf('p3'), 2).length], [2, 2, 2])
check('stages without a story kind get none (e.g. Grade 9 quadratics, Grade 1 shapes)', [planWordProblems(topicsOf('g2'), 9).length, planWordProblems(topicsOf('gr1-8'), 1).length], [0, 0])
{
  let changes = 0
  const buf = new StoryBuffer(planWordProblems(topicsOf('gr1-5'), 1, 2, mulberry(7)), 1, 'taglish', async (msgs) => {
    // a fake model that retells the facts it was given faithfully (as a good model would)
    // a fake model that really retells the facts (the last FACTS line is this lesson's; the first is
    // the prompt's worked example). Grade 1 = one item.
    const facts = [...msgs[1].content.matchAll(/FACTS: (.*)/g)].pop()![1]
    const [, who, item, price, paid] = /Bumili si (\S+) ng (.+?) na (₱\d+) sa .*Nagbayad siya ng (₱\d+)/.exec(facts)!
    return `Maagang pumunta si ${who} sa tindahan ni Aling Nena. Kinuha niya ang ${item} na ${price} at iniabot ang ${paid}.`
  }, () => changes++)
  check('buffer starts with every slot pending', [buf.pending, buf.ready], [2, 0])
  await buf.run()
  const q1 = buf.take(), q2 = buf.take(), q3 = buf.take()
  check('buffer fills both slots, hands each out once, AI-origin, Grade 1 subtraction topic', [buf.ready, !!q1, !!q2, q3, q1?.origin, q1?.topic], [0, true, true, null, 'ai-story', 'whole-numbers-subtraction'])
  check('buffer reports progress for the "gumagawa si Pipo…" chip (once per finished story)', changes, 2)
  const plain = new StoryBuffer(planWordProblems(topicsOf('gr1-5'), 1), 1, 'taglish', null)
  await plain.run()
  const pq = plain.take()
  check('no story model on this device (not the 1.5B WebGPU model) → code-written stories, no badge, no generation', [pq?.origin, pq?.prompt.startsWith('Bumili si'), plain.take()?.origin], ['story-template', true, 'story-template'])
  const quiet = new StoryBuffer(planWordProblems(topicsOf('gr1-5'), 1), 1, 'taglish', async () => null)
  await quiet.run()
  check('AI quiet → slots skipped, nothing to take', [quiet.slots.map((x) => x.state), quiet.take()], [['skipped', 'skipped'], null])
}

// ---------------------------------------------------------------- 7. the AI plumbing
check('grade-aware audience (the fixed LEVEL lookup)', [audience('grade1').includes('Grade 1'), audience('grade8'), audience('elem').includes('Grade 4'), audience('shs'), audience('mmw'), audience('???')],
  [true, 'a Grade 8 student', true, 'a Senior High School student', 'a college freshman', 'a student'])
check('background generate() without a loaded model → null (never throws, never blocks)', await generate([{ role: 'user', content: 'x' }]), null)

console.log(`wordproblem-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
