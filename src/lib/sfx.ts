// Synthesized sound effects (Web Audio) — no audio files, works offline.
// Browsers start audio "suspended" until the user interacts, so we unlock on the first tap.

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

export const setMuted = (m: boolean) => { muted = m }

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
      const comp = ctx.createDynamicsCompressor()
      master = ctx.createGain()
      master.gain.value = 0.9
      master.connect(comp).connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

// Unlock audio on the first user gesture (required on iOS / Chrome autoplay policy)
if (typeof window !== 'undefined') {
  const unlock = () => {
    const c = getCtx()
    if (c) {
      // play a silent blip so iOS fully unlocks
      const b = c.createBuffer(1, 1, 22050)
      const s = c.createBufferSource()
      s.buffer = b
      s.connect(c.destination)
      s.start(0)
    }
    if (c?.state === 'running') {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

interface NoteOpts {
  type?: OscillatorType
  gain?: number
  attack?: number
  slideTo?: number
  detune?: number
}

function note(freq: number, start: number, dur: number, o: NoteOpts = {}) {
  const c = getCtx()
  if (!c || !master || muted) return
  const t0 = c.currentTime + start + 0.01
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur)
  if (o.detune) osc.detune.value = o.detune
  const peak = o.gain ?? 0.2
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack ?? 0.008))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

/** Bell-like tone: fundamental + soft octave + slight detune shimmer */
function bell(freq: number, start: number, dur = 0.45, gain = 0.16) {
  note(freq, start, dur, { type: 'triangle', gain })
  note(freq * 2, start, dur * 0.6, { type: 'sine', gain: gain * 0.35 })
  note(freq, start, dur * 0.8, { type: 'sine', gain: gain * 0.4, detune: 7 })
}

export const sfx = {
  /** Bright two-note chime */
  correct() { bell(1046.5, 0, 0.32); bell(1568, 0.09, 0.5) },
  /** Soft low "bwomp" */
  wrong() {
    note(330, 0, 0.32, { type: 'sine', gain: 0.22, slideTo: 196 })
    note(165, 0.02, 0.3, { type: 'triangle', gain: 0.12, slideTo: 110 })
  },
  /** Gentle UI tap */
  tap() { note(740, 0, 0.06, { type: 'sine', gain: 0.07 }) },
  /** Very soft keyboard tick */
  key() { note(1320, 0, 0.03, { type: 'sine', gain: 0.035 }) },
  /** Lesson complete fanfare */
  complete() {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.1, 0.4, 0.13))
    ;[523.25, 659.25, 783.99].forEach((f) => note(f, 0.45, 0.9, { type: 'triangle', gain: 0.06 }))
  },
  /** Rising sweep for streak */
  streak() {
    note(392, 0, 0.45, { type: 'sine', gain: 0.12, slideTo: 1175 })
    ;[1175, 1568, 2093].forEach((f, i) => bell(f, 0.35 + i * 0.07, 0.3, 0.08))
  },
  /** Coin sparkle for chests / quest rewards */
  chest() { [1568, 2093, 2637, 3136].forEach((f, i) => bell(f, i * 0.06, 0.25, 0.08)) },
  /** Heart lost */
  heart() { note(587, 0, 0.14, { type: 'triangle', gain: 0.1 }); note(440, 0.12, 0.22, { type: 'triangle', gain: 0.1 }) },
}

export function haptic(ms = 10) {
  try { navigator.vibrate?.(ms) } catch { /* noop */ }
}
