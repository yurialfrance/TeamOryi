// Asserting tests for Pipo's voice-overs: the clips exist and are real audio, every line is wired
// to a moment, random picks don't repeat, and the event classifiers pick the right line for real
// curriculum questions.
import { readFileSync, readdirSync } from 'node:fs'
import { EVENTS, LINES, completeEvents, correctEvent, hintEvent, isFindX, pickLine, wrongEvent, type LineId, type VoiceEvent } from '../src/lib/voice'
import { WORLDS } from '../src/curriculum/worlds'

let fails = 0, passed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) passed++
  else { fails++; console.log(`FAIL ${name}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`) }
}

// ---------------------------------------------------------------- the audio files
const DIR = 'public/voice-overs'
const onDisk = readdirSync(DIR).filter((f) => f.endsWith('.mp3')).sort()
const mapped = Object.values(LINES).map((l) => l.file).sort()
check('23 lines mapped', Object.keys(LINES).length, 23)
check('every mapped clip exists in public/voice-overs', mapped.filter((f) => !onDisk.includes(f)), [])
check('no clip on disk is left unmapped', onDisk.filter((f) => !mapped.includes(f)), [])
check('no two lines share a clip', new Set(mapped).size, mapped.length)

/** Duration from MPEG audio frame headers — proves it's real audio, not an empty placeholder */
function mp3Seconds(b: Uint8Array): number {
  let i = 0, secs = 0
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) i = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9])
  const BR = { v1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], v2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] }
  const SR: Record<number, number[]> = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] }
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) { i++; continue }
    const ver = (b[i + 1] >> 3) & 3, layer = (b[i + 1] >> 1) & 3, bri = b[i + 2] >> 4, sri = (b[i + 2] >> 2) & 3
    if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { i++; continue }
    const rate = SR[ver][sri], br = (ver === 3 ? BR.v1 : BR.v2)[bri] * 1000, spf = ver === 3 ? 1152 : 576
    const len = Math.floor(((spf / 8) * br) / rate) + ((b[i + 2] >> 1) & 1)
    if (len < 4) { i++; continue }
    secs += spf / rate
    i += len
  }
  return secs
}
for (const [id, l] of Object.entries(LINES)) {
  const s = mp3Seconds(readFileSync(`${DIR}/${l.file}`))
  check(`${id}: real audio, 1.5–6 s (${s.toFixed(1)} s)`, s > 1.5 && s < 6, true)
}

// ---------------------------------------------------------------- mapping
const used = new Set(Object.values(EVENTS).flat() as LineId[])
check('every one of the 23 lines is reachable from some moment', Object.keys(LINES).filter((id) => !used.has(id as LineId)), [])
check('every moment has at least one line', Object.entries(EVENTS).filter(([, ls]) => !ls.length).map(([e]) => e), [])

// ---------------------------------------------------------------- random choice
for (const event of ['correct', 'correctFast', 'wrong'] as VoiceEvent[]) {
  const picks = Array.from({ length: 300 }, () => pickLine(event))
  check(`${event}: never the same line twice in a row`, picks.some((p, i) => i > 0 && p === picks[i - 1]), false)
  check(`${event}: every variant gets played`, [...new Set(picks)].sort(), [...EVENTS[event]].sort())
}
check('single-line moments always give that line', [pickLine('combo3'), pickLine('combo3')], ['tatlongSunod', 'tatlongSunod'])

// ---------------------------------------------------------------- which moment is it?
check('3 in a row', correctEvent({ combo: 3, firstTry: true, seconds: 20 }), 'combo3')
check('5 in a row', correctEvent({ combo: 5, firstTry: false, seconds: 20 }), 'combo5')
check('fast first try → "kuha mo agad"', correctEvent({ combo: 1, firstTry: true, seconds: 3 }), 'correctFast')
check('slow or retried → general praise', [correctEvent({ combo: 1, firstTry: true, seconds: 30 }), correctEvent({ combo: 2, firstTry: false, seconds: 2 })], ['correct', 'correct'])
check('last heart left → "walang sumusuko"', wrongEvent({ heartsLeft: 1, practice: false, wrongRun: 1, misconception: 'general_arithmetic' }), 'wrongPersist')
check('second miss in a row → "walang sumusuko"', wrongEvent({ heartsLeft: 4, practice: false, wrongRun: 2 }), 'wrongPersist')
check('careless slip → "hinga, dahan-dahan"', wrongEvent({ heartsLeft: 4, practice: false, wrongRun: 1, misconception: 'off_by_one' }), 'wrongSlip')
check('formula misconception → "balikan ang formula"', wrongEvent({ heartsLeft: 4, practice: false, wrongRun: 1, misconception: 'fraction_denominator_add' }), 'wrongRule')
check('other misses → general comfort', wrongEvent({ heartsLeft: 4, practice: false, wrongRun: 1, misconception: 'general_arithmetic' }), 'wrong')
check('out of hearts → quiet (results screen speaks)', wrongEvent({ heartsLeft: 0, practice: false, wrongRun: 1 }), null)
check('practice has no hearts to run out of', wrongEvent({ heartsLeft: 0, practice: true, wrongRun: 1 }), 'wrong')
check('perfect lesson', completeEvents({ failed: false, correct: 8, total: 8, streakUp: false }), ['perfectLesson'])
check('stage complete + day streak', completeEvents({ failed: false, correct: 6, total: 8, streakUp: true }), ['stageComplete', 'streakUp'])
check('new badge beats the streak line (two lines max)', completeEvents({ failed: false, correct: 8, total: 8, streakUp: true, newBadges: ['perfect'] }), ['perfectLesson', 'levelUp'])
check('practice is never "perfect lesson"', completeEvents({ failed: false, practice: true, correct: 6, total: 6, streakUp: false }), ['stageComplete'])
check('failed lesson → gentle retry', completeEvents({ failed: true, correct: 2, total: 8, streakUp: false }), ['lessonFailed'])

// hints and "find x", on real generated curriculum questions
const sample = (stageId: string) => {
  const st = WORLDS.flatMap((w) => w.stages).find((s) => s.id === stageId)!
  return Array.from({ length: 40 }, () => st.gens[0].make())
}
check('one-step equations: "nasaan si x" lesson opener', sample('j2').every((q) => isFindX(q)), true)
check('one-step equations: transpose hint', sample('j2').every((q) => hintEvent(q) === 'hintEquation'), true)
check('two-step equations: transpose hint', sample('j3').every((q) => hintEvent(q) === 'hintEquation'), true)
check('fraction lessons: pizza hint', sample('e1').filter((q) => hintEvent(q) === 'hintFraction').length >= 30, true)
check('addition is not an equation to solve', sample('p2').some((q) => isFindX(q)), false)
check('order of operations: parenthesis hint', hintEvent({ latex: '3 \\times (4 + 2)', prompt: '', kind: 'input' }), 'hintParens')
check('anything else: the generic "Psst!" hint', hintEvent({ latex: '25 + 17', prompt: '', kind: 'input' }), 'hint')
check('an equation with a fraction is still "find x" first', hintEvent({ latex: '\\frac{x}{3} = 5', prompt: '', kind: 'input' }), 'hintEquation')

// ---------------------------------------------------------------- offline: precached by the service worker
const vite = readFileSync('vite.config.ts', 'utf8')
check('service worker precaches mp3 (voice-overs) and webp (mascot art)', /globPatterns:.*mp3.*\]/.test(vite) && /globPatterns:.*webp.*\]/.test(vite), true)

console.log(`voice-test: ${passed} passed, ${fails} failed`)
if (fails) process.exit(1)
