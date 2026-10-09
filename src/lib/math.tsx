import { MathfieldElement, convertLatexToMarkup } from 'mathlive'
import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react'
import type { KeyDef } from '../keyboard/layouts'

// Fonts come from mathlive/fonts.css (bundled by Vite); sounds off.
MathfieldElement.fontsDirectory = null
MathfieldElement.soundsDirectory = null

const cache = new Map<string, string>()
export function texToHtml(tex: string, display = false): string {
  const key = (display ? 'D' : 'I') + tex
  let html = cache.get(key)
  if (!html) {
    html = convertLatexToMarkup(tex, { defaultMode: display ? 'math' : 'inline-math' } as never)
    cache.set(key, html)
  }
  return html
}

export const Tex = memo(function Tex({ tex, className = '' }: { tex: string; className?: string }) {
  return <span className={`latex-inline ${className}`} dangerouslySetInnerHTML={{ __html: texToHtml(tex) }} />
})

export interface MathFieldHandle {
  press: (key: KeyDef) => void
  insert: (latex: string) => void
  set: (latex: string) => void
  clear: () => void
  value: () => string
  focus: () => void
}

interface Props {
  onChange?: (latex: string) => void
  onEnter?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const MathField = forwardRef<MathFieldHandle, Props>(function MathField(
  { onChange, onEnter, placeholder, disabled, className = '' },
  ref,
) {
  const host = useRef<HTMLDivElement>(null)
  const mfRef = useRef<MathfieldElement | null>(null)
  const cb = useRef({ onChange, onEnter })
  cb.current = { onChange, onEnter }

  useEffect(() => {
    const mf = new MathfieldElement()
    mf.mathVirtualKeyboardPolicy = 'manual'
    mf.smartFence = true
    mf.popoverPolicy = 'off'
    if (placeholder) mf.setAttribute('placeholder', placeholder)
    mf.addEventListener('input', () => cb.current.onChange?.(mf.value))
    mf.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        e.preventDefault()
        cb.current.onEnter?.()
      }
    })
    // Stop the phone's own keyboard from popping up — we have ours.
    mf.addEventListener('focusin', () => {
      mf.shadowRoot?.querySelectorAll('textarea,[contenteditable]').forEach((el) => el.setAttribute('inputmode', 'none'))
      window.mathVirtualKeyboard?.hide()
    })
    host.current!.appendChild(mf)
    try { mf.menuItems = [] } catch { /* older builds */ }
    mfRef.current = mf
    requestAnimationFrame(() => {
      if (!mf.isConnected) return
      mf.shadowRoot?.querySelectorAll('textarea,[contenteditable]').forEach((el) => el.setAttribute('inputmode', 'none'))
      mf.focus()
    })
    return () => {
      mf.remove()
      mfRef.current = null
    }
  }, [placeholder])

  useEffect(() => {
    if (mfRef.current) mfRef.current.readOnly = !!disabled
  }, [disabled])

  useImperativeHandle(ref, () => ({
    press(key) {
      const mf = mfRef.current
      if (!mf || !mf.isConnected || disabled) return
      mf.focus()
      if (key.action === 'left') mf.executeCommand('moveToPreviousChar')
      else if (key.action === 'right') mf.executeCommand('moveToNextChar')
      else if (key.action === 'back') mf.executeCommand('deleteBackward')
      else if (key.action === 'clear') mf.value = ''
      else if (key.ins) mf.executeCommand(['insert', key.ins, { selectionMode: 'placeholder', focus: true, format: 'latex' }])
      cb.current.onChange?.(mf.value)
    },
    insert(latex) {
      const mf = mfRef.current
      if (!mf) return
      mf.executeCommand(['insert', latex, { selectionMode: 'placeholder', focus: true, format: 'latex' }])
      cb.current.onChange?.(mf.value)
    },
    set(latex) {
      const mf = mfRef.current
      if (!mf) return
      mf.value = latex
      cb.current.onChange?.(latex)
    },
    clear() {
      if (mfRef.current) mfRef.current.value = ''
      cb.current.onChange?.('')
    },
    value: () => mfRef.current?.value ?? '',
    focus: () => { if (mfRef.current?.isConnected) mfRef.current.focus() },
  }))

  return <div ref={host} className={className} />
})
