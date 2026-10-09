import { useGame } from '../store/game'

let activeUtterance: SpeechSynthesisUtterance | null = null

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function isSpeechEnabled(): boolean {
  if (!isSpeechSupported()) return false
  try {
    return useGame.getState().voiceEnabled !== false
  } catch {
    return true
  }
}

/**
 * Transforms LaTeX math formulas and markdown into natural Taglish/English speech.
 * e.g., \frac{1}{2} -> "1 over 2"
 * \sqrt{9} -> "square root ng 9"
 * 2^3 -> "2 cubed"
 */
export function mathToSpeechText(text: string): string {
  let s = text
  // Fractions: \frac{a}{b} -> "a over b"
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
  // Square roots: \sqrt{x} -> "square root ng $1"
  s = s.replace(/\\sqrt\{([^}]+)\}/g, 'square root ng $1')
  // Common exponents
  s = s.replace(/\^\{?2\}?/g, ' squared')
  s = s.replace(/\^\{?3\}?/g, ' cubed')
  s = s.replace(/\^\{?([a-zA-Z0-9]+)\}?/g, ' to the power of $1')
  // Math operators
  s = s.replace(/\\times|\\cdot/g, ' times ')
  s = s.replace(/\\div/g, ' divided by ')
  s = s.replace(/\\pm/g, ' plus or minus ')
  s = s.replace(/\\le/g, ' less than or equal to ')
  s = s.replace(/\\ge/g, ' greater than or equal to ')
  s = s.replace(/\\neq/g, ' not equal to ')
  s = s.replace(/\\approx/g, ' approximately ')
  s = s.replace(/=/g, ' equals ')
  s = s.replace(/\+/g, ' plus ')
  s = s.replace(/-(?=\d|\s)/g, ' minus ')
  // Currencies
  s = s.replace(/₱|\\text\{₱\}|\\mathrm\{₱\}/g, ' pesos ')
  // Clean remaining LaTeX commands and symbols
  s = s.replace(/\\[a-zA-Z]+/g, ' ')
  s = s.replace(/[$_{}\\^]/g, ' ')
  // Clean markdown bold, bullets, hashes
  s = s.replace(/\*+/g, '')
  s = s.replace(/#{1,6}\s+/g, '')
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export function stopSpeaking() {
  if (!isSpeechSupported()) return
  try {
    window.speechSynthesis.cancel()
    activeUtterance = null
  } catch {
    // ignore
  }
}

export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false
  return !!activeUtterance || window.speechSynthesis.speaking
}

export function speakText(
  text: string,
  callbacks?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  }
) {
  if (!isSpeechSupported() || !isSpeechEnabled()) return
  stopSpeaking()

  const clean = mathToSpeechText(text)
  if (!clean) return

  try {
    const utterance = new SpeechSynthesisUtterance(clean)
    activeUtterance = utterance

    // Prefer Tagalog/Filipino or PH-English voices if available
    const voices = window.speechSynthesis.getVoices()
    const voice =
      voices.find((v) => v.lang.startsWith('fil') || v.lang.startsWith('tl')) ||
      voices.find((v) => v.lang.startsWith('en-PH')) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices[0]

    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = 'en-US'
    }

    // Friendly tutor pitch and pacing for Pipo
    utterance.rate = 0.96
    utterance.pitch = 1.15

    utterance.onstart = () => {
      callbacks?.onStart?.()
    }

    utterance.onend = () => {
      activeUtterance = null
      callbacks?.onEnd?.()
    }

    utterance.onerror = () => {
      activeUtterance = null
      callbacks?.onError?.()
    }

    window.speechSynthesis.speak(utterance)
  } catch {
    activeUtterance = null
    callbacks?.onError?.()
  }
}
