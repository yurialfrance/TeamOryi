import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { motion, AnimatePresence } from 'motion/react'
import { sfx } from '../lib/sfx'

interface ScratchpadProps {
  open: boolean
  onClose: () => void
  onClearNotify?: () => void
}

type Tool = 'pen' | 'eraser'
type Color = '#2B2533' | '#2F6BFF' | '#2FA85A' | '#E53E3E' | '#FF8A1F'

interface StrokePoint {
  x: number
  y: number
}

interface Stroke {
  tool: Tool
  color: string
  size: number
  points: StrokePoint[]
}

export function Scratchpad({ open, onClose }: ScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const currentStroke = useRef<StrokePoint[]>([])
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState<Color>('#2B2533')
  const [size, setSize] = useState<number>(3)
  const [isMinimized, setIsMinimized] = useState(false)

  // Re-draw all strokes whenever strokes or canvas size changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const s of strokes) {
      if (s.points.length < 2) continue
      ctx.save()
      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = s.size * 3.5
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.size
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y)
      }
      ctx.stroke()
      ctx.restore()
    }
  }, [strokes])

  // Adjust canvas size to client display size with DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !open || isMinimized) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
      redraw()
    }
  }, [open, isMinimized, redraw])

  useEffect(() => {
    redraw()
  }, [redraw])

  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)

    isDrawing.current = true
    const pt = getCanvasPos(e)
    currentStroke.current = [pt]

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = size * 3.5
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = size
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, (tool === 'eraser' ? size * 3.5 : size) / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    e.preventDefault()
    e.stopPropagation()
    const pt = getCanvasPos(e)
    currentStroke.current.push(pt)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pts = currentStroke.current
    if (pts.length < 2) return
    const p1 = pts[pts.length - 2]
    const p2 = pts[pts.length - 1]

    ctx.save()
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = size * 3.5
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = size
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
    ctx.restore()
  }

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    isDrawing.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    if (currentStroke.current.length > 0) {
      const newStroke: Stroke = {
        tool,
        color,
        size,
        points: [...currentStroke.current],
      }
      setStrokes((prev) => [...prev, newStroke])
      currentStroke.current = []
    }
  }

  const undo = () => {
    sfx.tap()
    setStrokes((prev) => prev.slice(0, prev.length - 1))
  }

  const clearAll = () => {
    sfx.tap()
    setStrokes([])
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.18 }}
        className={`my-3 rounded-2xl border-2 border-grape/30 bg-[#FDFAFF] shadow-lg flex flex-col overflow-hidden transition-all ${
          isMinimized ? 'h-12' : 'h-64'
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-line">
          <div className="flex items-center gap-1.5">
            <Icon name="pencil" size={16} />
            <span className="font-black text-xs text-ink uppercase tracking-wider">Kwaderno (Scratchpad)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-grape-soft text-grape-dark">
              {strokes.length} guhit
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized((m) => !m)}
              className="p-1 rounded-lg text-ink-soft hover:bg-cloud active:scale-95 text-xs font-bold px-2"
              title={isMinimized ? 'Palakihin' : 'I-minimize'}
            >
              {isMinimized ? '⤢ Palakihin' : '— Itago'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-ink-soft hover:bg-heart-soft hover:text-heart flex items-center justify-center font-black active:scale-95"
              aria-label="Isara ang kwaderno"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Toolbar: Pen, Eraser, Sizes, Colors, Undo, Clear */}
            <div className="flex items-center justify-between gap-1 px-3 py-1.5 bg-cloud/50 border-b border-line flex-wrap">
              {/* Tool selector */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { sfx.tap(); setTool('pen') }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                    tool === 'pen' ? 'bg-grape text-white shadow-xs' : 'bg-white text-ink border border-line'
                  }`}
                >
                  <Icon name="pencil" size={16} /> Lapis
                </button>
                <button
                  type="button"
                  onClick={() => { sfx.tap(); setTool('eraser') }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                    tool === 'eraser' ? 'bg-sky text-white shadow-xs' : 'bg-white text-ink border border-line'
                  }`}
                >
                  <Icon name="eraser" size={16} /> Pambura
                </button>
              </div>

              {/* Stroke size selector */}
              <div className="flex items-center gap-1">
                {[2, 4, 7].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { sfx.tap(); setSize(s) }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      size === s ? 'bg-white shadow-xs font-black border border-line ring-1 ring-grape/40' : 'text-ink-soft hover:bg-white/60'
                    }`}
                    title={`Laki: ${s}px`}
                  >
                    <span
                      className="rounded-full bg-ink"
                      style={{ width: `${s + 2}px`, height: `${s + 2}px` }}
                    />
                  </button>
                ))}
              </div>

              {/* Color picker (only when pen) */}
              {tool === 'pen' && (
                <div className="flex items-center gap-1.5">
                  {(['#2B2533', '#2F6BFF', '#2FA85A', '#E53E3E', '#FF8A1F'] as Color[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { sfx.tap(); setColor(c) }}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-1 ring-grape' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              )}

              {/* Action buttons: Undo & Clear */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={undo}
                  disabled={strokes.length === 0}
                  className="px-2 py-0.5 rounded-lg bg-white border border-line text-xs font-bold text-ink-soft disabled:opacity-40 active:scale-95"
                  title="Ibalik ang huling guhit"
                >
                  ⤶ Undo
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={strokes.length === 0}
                  className="px-2 py-0.5 rounded-lg bg-white border border-line text-xs font-bold text-heart disabled:opacity-40 active:scale-95"
                  title="Burahin lahat"
                >
                  <Icon name="trash" size={16} /> Burahin
                </button>
              </div>
            </div>

            {/* Drawing Canvas Area with Subtle Math Grid */}
            <div className="flex-1 relative touch-none bg-white select-none overflow-hidden cursor-crosshair">
              {/* Subtle Math Grid Background for vertical alignment */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #7B68EE 1px, transparent 1px), linear-gradient(to right, #E2DCED 1px, transparent 1px), linear-gradient(to bottom, #E2DCED 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              <canvas
                ref={canvasRef}
                className="w-full h-full relative z-10 touch-none"
                style={{ touchAction: 'none' }}
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
              />

              {strokes.length === 0 && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-ink-soft/40 select-none">
                  <Icon name="pencil" size={30} className="mb-1" />
                  <span className="text-xs font-bold">Sumulat o mag-solve dito gamit ang daliri o stylus</span>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
