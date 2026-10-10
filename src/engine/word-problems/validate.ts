// Layer 3 of "Kwento ni Pipo": the CODE decides whether an AI-written story may be shown.
//
// HOW CORRECTNESS IS GUARANTEED — what is and isn't checked
// ----------------------------------------------------------
// The answer, the answer key, the hints and the worked solution are NEVER produced by the AI. They
// come from the spec (word-problems/spec.ts), computed by code; tests recompute every answer
// independently from the numbers alone. The AI only retells the code-written facts as a story,
// and the question sentence that defines the unknown ("Magkano ang sukli ni Ana?") is always
// appended by code, never written by the AI.
//
// Before an AI story is shown, this file checks, deterministically:
//   1. NUMBERS  — the story states exactly the spec's numbers (same values, same count), nothing
//                 more and nothing less; numbers written as words (dalawa, three, dosena, kalahati…)
//                 are rejected, so no number can hide from the check.
//   2. ORDER    — the numbers appear in the same order as in the code-written facts, so two values
//                 cannot swap roles ("₱28 ang hawak, bumili ng ₱45").
//   3. UNITS    — every peso amount carries its peso marker (₱ / P / piso / pesos).
//   4. NO LEAK  — the answer value does not appear anywhere in the story.
//   5. ANCHORS  — the same person and every item from the facts are named.
//   6. LANGUAGE — Taglish mode: enough Filipino grammar words and no all-English sentence
//                 (English mode: the reverse). Same rules as the Tutor's guard.ts.
//   7. SHAPE    — no question of its own, no LaTeX or math symbols, sentence count and length
//                 capped by grade, not empty, no echo of the prompt ("FACTS:", "SETTING:").
//   8. REAL WORDS — every word is a known Filipino/English word (Tagalog affixes stripped), a name,
//                 or a word from the facts/setting (lexicon.ts). Catches Tagalog-shaped noise such as
//                 "At i-kayag ng ₱50" that a grammar-word count lets through.
//   9. NOT A COPY — a story that is nearly the facts word for word is shown as the plain template,
//                 WITHOUT the "Kwento ni Pipo" badge: no credit for text the AI didn't really write.
// If any check fails (after one retry), the code-written facts are shown instead, without the badge.
// Stories are only written by the 1.5B WebGPU model (Pipo Smart); otherwise the facts are used.
//
// What is NOT checked: whether the story keeps the RELATIONSHIP between the numbers. A story can
// keep every number, in order, with units, and still describe different math — e.g. turn "paid
// ₱50 for a ₱28 item" into "earned ₱50 and then earned ₱28 more". Checking meaning would need
// language understanding that rule-based code cannot do reliably. Mitigations: the code-written
// question still asks for the right unknown, the answer key never changes, and the order check
// catches swapped roles. In the worst case the story reads oddly; the math being checked is
// still the spec's.
import { languageCounts, isLanguage } from '../../ai/guard'
import type { WPSpec } from './spec'
import { unknownWords } from './lexicon'

export interface StoryVerdict { ok: boolean; reasons: string[] }

/** A number found in a story: value, where it is, and whether it was marked as pesos */
interface Found { value: number; index: number; peso: boolean }

// "isa/isang/one/a" are left out on purpose: in Filipino "isang" is the article "a" ("isang
// tindahan"). Specs never use 1 as a given, so ignoring them is safe.
const NUMBER_WORDS = new RegExp(
  '\\b(' +
    [
      'dalawa', 'tatlo', 'apat', 'lima', 'anim', 'pito', 'walo', 'siyam', 'sampu', 'labing\\w*', 'dalawampu\\w*', 'tatlumpu\\w*',
      'apatnapu\\w*', 'limampu\\w*', 'isandaan', 'sandaan', '\\w+ndaan', 'libo', 'sanlibo', 'kalahati', 'dosena', 'pares',
      'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
      'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
      'eighty', 'ninety', 'hundred', 'thousand', 'half', 'dozen', 'twice', 'double',
    ].join('|') +
    ')(ng|na|g)?\\b',
  'i',
)
// \b keeps look-alikes out ("dapat" is not "apat"). "daan" alone is left out too: it also means
// "road". The hundreds are still caught as "sandaan", "dalawandaan"… and as digits anyway.

/** All numbers written with digits, with their peso marking */
export function findNumbers(text: string): Found[] {
  const out: Found[] = []
  const re = /(₱|\bphp\s?|\bp(?=\d))?\s?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(\s*(piso|pesos?)\b)?/gi
  for (const m of text.matchAll(re)) {
    const value = Number((m[2] + (m[3] ?? '')).replace(/,/g, ''))
    out.push({ value, index: m.index ?? 0, peso: !!m[1] || !!m[4] })
  }
  return out
}

/** Clean what the model returned: labels, quotes, markdown, and any question it asked itself */
export function cleanStory(raw: string): string {
  let s = raw.replace(/\r/g, '').replace(/[*_#`]/g, '').replace(/^\s*(scene|kwento|story|sagot|answer|here.*?:)\s*:?\s*/i, '')
  s = s.split('\n').map((l) => l.trim()).filter(Boolean).join(' ')
  s = s.replace(/^["“”']+|["“”']+$/g, '').trim()
  // the question is the code's job: drop any sentence the model ended with "?"
  const sentences = s.split(/(?<=[.!?])\s+/).filter((x) => !/\?\s*$/.test(x))
  return sentences.join(' ').trim()
}

const sentencesOf = (s: string) => s.split(/(?<=[.!?])\s+/).filter((x) => x.trim())
/** Grade-sized story length */
export const maxSentences = (grade: number) => (grade <= 3 ? 2 : 3)
const maxChars = (grade: number) => (grade <= 3 ? 200 : 300)

export function validateStory(story: string, spec: WPSpec): StoryVerdict {
  const reasons: string[] = []
  const text = story.trim()
  if (text.length < 15) return { ok: false, reasons: ['empty'] }

  // 7. shape
  if (/\b(facts|setting|scene|example|task|now yours)\s*:/i.test(text)) reasons.push('prompt-echo')
  if (/\?/.test(text)) reasons.push('asks-question')
  if (/[$\\{}^=]/.test(text)) reasons.push('math-notation')
  if (sentencesOf(text).length > maxSentences(spec.grade)) reasons.push('too-many-sentences')
  if (text.length > maxChars(spec.grade)) reasons.push('too-long')

  // 1–4. numbers: exact multiset, same order, units, no leak
  if (NUMBER_WORDS.test(text)) reasons.push('number-in-words')
  const found = findNumbers(text)
  const want = spec.givens.map((g) => g.value)
  const got = found.map((f) => f.value)
  const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b).join(',')
  if (sorted(got) !== sorted(want)) reasons.push(`numbers:${got.join(',') || 'none'}≠${want.join(',')}`)
  else if (got.join(',') !== want.join(',')) reasons.push('order')
  if (found.length === want.length) {
    found.forEach((f, i) => { if (spec.givens[i]?.unit === 'peso' && !f.peso) reasons.push(`unit:${f.value}`) })
  }
  if (got.includes(spec.answer) && !want.includes(spec.answer)) reasons.push('answer-leak')

  // 5. anchors: same person, every item
  // whole words only: "Ana" must not be "found" inside another word
  const hasWord = (w: string) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'iu').test(text)
  if (!hasWord(spec.person)) reasons.push('person-missing')
  for (const it of spec.items) {
    // the item's main word (e.g. "Pancit Canton" → "Pancit") must be there
    const key = (spec.lang === 'taglish' ? it.name : it.en).split(/\s+/).find((w) => w.length >= 3) ?? it.name
    if (!hasWord(key)) reasons.push(`item-missing:${it.name}`)
  }

  // 6. language (same grammar-word rules as the Tutor guard)
  if (!isLanguage(text, spec.lang)) reasons.push(`language:${spec.lang}`)
  for (const s of sentencesOf(text)) {
    const { fil, eng } = languageCounts(s)
    if (spec.lang === 'taglish' ? fil === 0 && eng >= 3 : eng === 0 && fil >= 3) { reasons.push(`sentence-language:${spec.lang}`); break }
  }

  // 8. real words only
  const c = spec.context
  const unknown = unknownWords(text, [spec.person, ...c.people, c.place, c.placeEn, c.name, ...c.vocab, ...spec.items.flatMap((i) => [i.name, i.en])])
  if (unknown.length) reasons.push(`unknown-words:${[...new Set(unknown)].slice(0, 4).join(',')}`)

  return { ok: reasons.length === 0, reasons }
}

/** Word overlap of a story with the facts (numbers ignored): 1 = same words */
export function overlapWithFacts(story: string, spec: WPSpec): number {
  const words = (t: string) => new Set(t.toLowerCase().replace(/[₱]?\d[\d,.]*/g, ' ').match(/[a-zñ][a-zñ'-]*/g) ?? [])
  const a = words(story), b = words(spec.facts)
  const both = [...a].filter((w) => b.has(w)).length
  return both / Math.max(1, new Set([...a, ...b]).size)
}
/** Nearly the facts word for word — the AI added nothing, so it gets no "Kwento ni Pipo" credit */
export const isNearCopy = (story: string, spec: WPSpec) => overlapWithFacts(story, spec) >= 0.75

