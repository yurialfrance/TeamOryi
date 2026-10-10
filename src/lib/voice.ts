// Pipo's recorded voice-overs: 23 Taglish clips in public/voice-overs/ (precached by the service
// worker, so they play offline). They share the sfx AudioContext and mute switch (src/lib/sfx.ts):
// the short synthesized chime still plays instantly as the right/wrong signal, Pipo's line follows
// just after it, and the sfx are ducked while Pipo talks.
import { duckSfx, isMuted, onMuteChange, voiceOutput } from './sfx'

export interface VoiceLine { file: string; text: string; tone: string }

/** The 23 recorded lines. `file` is the clip in public/voice-overs/ (named after its words). */
export const LINES = {
  tumpak: { file: 'tumpakanggalingmo.mp3', text: 'Tumpak! Ang galing mo!', tone: 'cheerfully, energized' },
  sakto: { file: 'saktotuloytuloylang.mp3', text: 'Sakto! Tuloy-tuloy lang!', tone: 'excited, upbeat' },
  petmalu: { file: 'petmalulodisamath.mp3', text: 'Petmalu! Lodi sa math!', tone: 'hyped, enthusiastic' },
  tatlongSunod: { file: 'tatlongsunodsunodnatama.mp3', text: 'Tatlong sunod-sunod na tama! Nag-aapoy ka!', tone: 'proud, fired up' },
  kuhaPattern: { file: 'boomkuhamoagadyungpattern.mp3', text: 'Boom! Kuha mo agad ang pattern!', tone: 'delighted, impressed' },
  walangKahirap: { file: 'galingnamnwalangkahiraphirap.mp3', text: 'Galing naman! Walang kahirap-hirap!', tone: 'warmly, encouraging' },
  limangStreak: { file: 'grabelimangstreak.mp3', text: "Limang streak! Grabe, math genius na 'yan ah!", tone: 'hyped, amazed' },
  okayLang: { file: 'okeylangyansubukannatinulit.mp3', text: "Okay lang 'yan, subukan natin ulit.", tone: 'gentle, reassuring' },
  tingnanSteps: { file: 'kayamoyantignannatinangsteps.mp3', text: "Kaya mo 'yan, tingnan natin ang steps.", tone: 'supportive, steady' },
  muntikNa: { file: 'muntiknabalikanlangnatinyungformula.mp3', text: "Muntik na! Balikan lang natin 'yung formula sandali.", tone: 'sympathetic, calm' },
  hinga: { file: 'hingangamalalimdahandahnnatincompute.mp3', text: 'Hinga nang malalim. Dahan-dahan nating i-compute.', tone: 'patient, thoughtful' },
  walangSumusuko: { file: 'walangsumosukoditoisapakayanatin.mp3', text: "Walang sumusuko dito! Isa pa, kaya mo 'to.", tone: 'encouraging, cheerful' },
  sikretongHint: { file: 'maysikretonghintsipiposayo.mp3', text: "Psst! May sikretong hint si Pipo para sa 'yo...", tone: 'whispering, friendly' },
  parenthesis: { file: 'tignanmomunaangoperation_.mp3', text: 'Tingnan mo muna ang operation sa loob ng parenthesis.', tone: 'thoughtful, guiding' },
  transpose: { file: 'anokayamangyayari.mp3', text: "Ano kaya ang mangyayari kung i-transpose natin 'to sa kabila?", tone: 'curious, helpful' },
  pizza: { file: 'isipinmotoparalangtaongnaghahatingpizza.mp3', text: "Isipin mo 'to na parang naghahati lang tayo ng pizza!", tone: 'upbeat, instructive' },
  stageComplete: { file: 'stagecomplet.mp3', text: 'Stage complete! Ang galing mo, tapos na ang aralin!', tone: 'triumphant, celebratory' },
  perpekto: { file: 'perpektongaralin.mp3', text: 'Perpektong aralin! Walang mintis!', tone: 'amazed, celebratory' },
  apoy: { file: 'ayannaangapotuloyangstreak.mp3', text: 'Ayan na ang apoy! Tuloy ang streak!', tone: 'excited, thrilled' },
  levelUp: { file: 'levelupmaybagokananamnmathbpower.mp3', text: 'Level up! May bago ka na namang math power-up!', tone: 'proud, warm' },
  worldDone: { file: 'natapusmunaangworldnatohandakanabasasusunodnahamon.mp3', text: "Natapos mo ang world na 'to! Handa ka na ba sa susunod na hamon?", tone: 'bright, motivated' },
  welcomeBack: { file: 'uinanditokanaulitsolvetayongmathpuzzle.mp3', text: 'Uy, nandito ka na ulit! Tara, solve tayo ng math puzzles.', tone: 'friendly, welcoming' },
  hanapinX: { file: 'nakatungagnapasixditoohtulonganatinsiyamahanap_.mp3', text: 'Nakatunganga pa si x dito oh, tulungan na natin siyang mahanap!', tone: 'playful, nudging' },
} as const satisfies Record<string, VoiceLine>

export type LineId = keyof typeof LINES

/** Moments in the app where Pipo speaks → the lines that fit (one is picked at random) */
export const EVENTS = {
  correct: ['tumpak', 'sakto', 'petmalu'],
  /** right on the first try, quickly */
  correctFast: ['kuhaPattern', 'walangKahirap'],
  combo3: ['tatlongSunod'],
  combo5: ['limangStreak'],
  wrong: ['okayLang', 'tingnanSteps'],
  /** applied a rule/formula wrong (PEMDAS, adding denominators, inverted fraction…) */
  wrongRule: ['muntikNa'],
  /** careless slip: off by one, swapped digits, decimal point, sign */
  wrongSlip: ['hinga'],
  /** last heart left, or missing again and again */
  wrongPersist: ['walangSumusuko'],
  hint: ['sikretongHint'],
  hintParens: ['parenthesis'],
  hintEquation: ['transpose'],
  hintFraction: ['pizza'],
  stageComplete: ['stageComplete'],
  perfectLesson: ['perpekto'],
  lessonFailed: ['okayLang'],
  streakUp: ['apoy'],
  levelUp: ['levelUp'],
  worldComplete: ['worldDone'],
  welcomeBack: ['welcomeBack'],
  findX: ['hanapinX'],
} as const satisfies Record<string, readonly LineId[]>

export type VoiceEvent = keyof typeof EVENTS

// ---------------------------------------------------------------- choosing (pure — tested in scripts/voice-test.ts)

const lastPicked: Partial<Record<VoiceEvent, LineId>> = {}

/** Random line for an event, never the same one twice in a row when there's a choice */
export function pickLine(event: VoiceEvent, rand: () => number = Math.random): LineId {
  const pool: readonly LineId[] = EVENTS[event]
  const options = pool.length > 1 ? pool.filter((l) => l !== lastPicked[event]) : pool
  const id = options[Math.floor(rand() * options.length) % options.length]
  lastPicked[event] = id
  return id
}

/** Seconds on a question below which a first-try answer counts as "got it right away" */
export const FAST_SECONDS = 6

export function correctEvent(o: { combo: number; firstTry: boolean; seconds: number }): VoiceEvent {
  if (o.combo === 5) return 'combo5'
  if (o.combo === 3) return 'combo3'
  if (o.firstTry && o.seconds <= FAST_SECONDS) return 'correctFast'
  return 'correct'
}

const SLIPS = new Set(['off_by_one', 'digit_transposition', 'decimal_place_error', 'sign_reversal'])
const RULES = new Set(['pemdas_inverted', 'fraction_denominator_add', 'inverted_fraction', 'exponent_as_multiply', 'pizza_chef_complement', 'not_simplified'])

/** null = stay quiet (hearts ran out: the "try again" screen speaks instead) */
export function wrongEvent(o: { heartsLeft: number; practice: boolean; wrongRun: number; misconception?: string }): VoiceEvent | null {
  if (!o.practice && o.heartsLeft <= 0) return null
  if ((!o.practice && o.heartsLeft === 1) || o.wrongRun >= 2) return 'wrongPersist'
  if (o.misconception && SLIPS.has(o.misconception)) return 'wrongSlip'
  if (o.misconception && RULES.has(o.misconception)) return 'wrongRule'
  return 'wrong'
}

/** Pick the hint line that matches what the question is about */
export function hintEvent(q: { latex?: string; prompt: string; kind: string; visual?: { type: string } }): VoiceEvent {
  const tex = q.latex ?? ''
  if (q.kind === 'pizzaChef' || q.visual?.type === 'pizza') return 'hintFraction'
  if (isFindX(q)) return 'hintEquation' // x/3 = 5 is an equation first, a fraction second
  if (/\\frac|\//.test(tex)) return 'hintFraction'
  if (/[()]/.test(tex.replace(/\\left|\\right/g, ''))) return 'hintParens'
  return 'hint'
}

/** An equation with an unknown to solve for — "si x" is waiting to be found */
export function isFindX(q: { latex?: string; prompt: string }): boolean {
  const tex = (q.latex ?? '').replace(/\\[a-zA-Z]+/g, '')
  return tex.includes('=') && /[a-z]/i.test(tex)
}

/** What Pipo says on the results screen, in order (at most two lines) */
export function completeEvents(r: { failed: boolean; practice?: boolean; correct: number; total: number; streakUp: boolean; newBadges?: string[] }): VoiceEvent[] {
  if (r.failed) return ['lessonFailed']
  const first: VoiceEvent = !r.practice && r.correct === r.total ? 'perfectLesson' : 'stageComplete'
  if (r.newBadges?.length) return [first, 'levelUp']
  if (r.streakUp) return [first, 'streakUp']
  return [first]
}

// ---------------------------------------------------------------- playback (browser)

const base = () => (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
export const lineUrl = (id: LineId) => `${base()}voice-overs/${LINES[id].file}`

const decoded = new Map<LineId, Promise<AudioBuffer | null>>()
let current: AudioBufferSourceNode | null = null
let token = 0 // bumps on stop(), so delayed/queued lines from a previous screen never fire

function load(id: LineId): Promise<AudioBuffer | null> {
  let p = decoded.get(id)
  if (!p) {
    p = (async () => {
      const out = voiceOutput()
      if (!out) return null
      try {
        const res = await fetch(lineUrl(id)) // served from the service-worker precache when offline
        if (!res.ok) return null
        return await out.ctx.decodeAudioData(await res.arrayBuffer())
      } catch {
        return null
      }
    })()
    decoded.set(id, p)
    void p.then((b) => { if (!b) decoded.delete(id) }) // let a failed load retry later
  }
  return p
}

/** Decode lines ahead of time (e.g. a lesson's feedback lines) so they start without a gap */
export function preloadVoice(events: VoiceEvent[]) {
  for (const e of events) for (const id of EVENTS[e]) void load(id)
}

const ttsSpeaking = () => { try { return !!window.speechSynthesis?.speaking } catch { return false } }

/** Stop whatever Pipo is saying and cancel anything still waiting to be said */
export function stopVoice() {
  token++
  try { current?.stop() } catch { /* already ended */ }
  current = null
  duckSfx(false)
}
onMuteChange((m) => { if (m) stopVoice() })

async function playLine(id: LineId, my: number): Promise<void> {
  const buf = await load(id)
  const out = voiceOutput()
  if (!buf || !out || my !== token || isMuted() || ttsSpeaking() || document.hidden) return
  try { current?.stop() } catch { /* ended */ }
  const src = out.ctx.createBufferSource()
  src.buffer = buf
  src.connect(out.bus)
  current = src
  duckSfx(true)
  await new Promise<void>((resolve) => {
    src.onended = () => {
      if (current === src) { current = null; duckSfx(false) }
      resolve()
    }
    src.start()
  })
}

/**
 * Pipo says a line for this moment. Picks the line now (so the caller can show the same words on
 * screen) and returns it; the audio follows `after` ms later. A new line interrupts the old one.
 */
export function say(event: VoiceEvent, opts: { after?: number } = {}): LineId {
  const id = pickLine(event)
  sayLines([id], opts)
  return id
}

/** Say several lines one after another (e.g. "Stage complete!" then "Ayan na ang apoy!") */
export function sayLines(ids: LineId[], { after = 0 }: { after?: number } = {}) {
  if (isMuted() || !ids.length) return
  stopVoice()
  const my = token
  for (const id of ids) void load(id)
  setTimeout(async () => {
    for (const id of ids) {
      if (my !== token) return
      await playLine(id, my)
    }
  }, after)
}
