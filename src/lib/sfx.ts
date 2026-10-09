// Tiny synth sound effects — no audio files needed, works offline.
let ctx: AudioContext | null = null
let muted = false
export const setMuted = (m: boolean) => { muted = m }

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime + start
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.02)
  } catch { /* audio not available */ }
}

export const sfx = {
  correct() { tone(660, 0, 0.12, 'triangle'); tone(990, 0.1, 0.22, 'triangle') },
  wrong() { tone(220, 0, 0.18, 'square', 0.08); tone(180, 0.14, 0.25, 'square', 0.08) },
  tap() { tone(520, 0, 0.05, 'sine', 0.06) },
  complete() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle')) },
  streak() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.18, 'sawtooth', 0.07)) },
}

export function haptic(ms = 10) {
  try { navigator.vibrate?.(ms) } catch { /* noop */ }
}
