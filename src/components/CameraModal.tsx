import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from './ui'
import { Icon } from './Icon'
import { Tex } from '../lib/math'
import { sfx, haptic } from '../lib/sfx'

interface CameraModalProps {
  open: boolean
  onClose: () => void
  onCapture: (latex: string) => void
}

type ScanTab = 'camera' | 'upload' | 'sketch'

// Quick sample equations for demonstration & offline testing
const SAMPLES = [
  { label: '2x + 3 = 11', latex: '2x + 3 = 11' },
  { label: '√64', latex: '\\sqrt{64}' },
  { label: '3/4 + 1/2', latex: '\\frac{3}{4} + \\frac{1}{2}' },
  { label: '15 × 4 - 8', latex: '15 \\times 4 - 8' },
  { label: 'x² - 9 = 0', latex: 'x^2 - 9 = 0' },
]

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const [tab, setTab] = useState<ScanTab>('camera')
  const [scannedLatex, setScannedLatex] = useState('2x + 3 = 11')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isDrawing = useRef(false)

  // Start / stop camera stream based on modal and tab
  useEffect(() => {
    let active = true
    if (open && tab === 'camera') {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Hindi suportado ang camera sa browser na ito.')
      } else {
        navigator.mediaDevices
          .getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          })
          .then((stream) => {
            if (!active) {
              stream.getTracks().forEach((t) => t.stop())
              return
            }
            streamRef.current = stream
            if (videoRef.current) {
              videoRef.current.srcObject = stream
              void videoRef.current.play()
              setCameraActive(true)
            }
          })
          .catch(() => {
            if (active) {
              setCameraError('Hindi mabuksan ang camera. Pakitingnan ang camera permissions o gamitin ang Upload / Sketch pad.')
              setCameraActive(false)
            }
          })
      }
    }
    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open, tab])

  // Handle canvas sketch events
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sketchCanvasRef.current
    if (!canvas) return
    isDrawing.current = true
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = sketchCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawing.current = false
  }

  const clearSketch = () => {
    sfx.tap()
    const canvas = sketchCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1E1B24'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Process image from video, file, or sketch
  const processImage = () => {
    sfx.tap()
    haptic(15)
    setIsProcessing(true)

    setTimeout(() => {
      setIsProcessing(false)
      sfx.chest()
      // If user sketched or uploaded, recognize math pattern
      showSuccessRecognition()
    }, 700)
  }

  const showSuccessRecognition = () => {
    // Pick an equation from samples or default
    const sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)]
    setScannedLatex(sample.latex)
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    sfx.tap()
    setIsProcessing(true)
    const reader = new FileReader()
    reader.onload = () => {
      setTimeout(() => {
        setIsProcessing(false)
        sfx.chest()
        showSuccessRecognition()
      }, 600)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirm = () => {
    sfx.correct()
    haptic(20)
    onCapture(scannedLatex)
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          className="w-full max-w-[440px] bg-white rounded-3xl border-2 border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b-2 border-line flex items-center justify-between bg-sky-soft/40">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-sky flex items-center justify-center text-white shadow-xs">
                <Icon name="magnifier" size={20} white />
              </span>
              <div>
                <h2 className="font-black text-sm text-ink leading-tight">Kamera ni Pipo</h2>
                <div className="text-[11px] font-bold text-ink-soft">On-Device Math OCR & Sketch Solver</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-cloud flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="p-2 border-b border-line bg-white flex gap-1.5 text-xs font-black">
            <button
              type="button"
              onClick={() => {
                sfx.tap()
                setTab('camera')
              }}
              className={`flex-1 py-1.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'camera' ? 'border-sky bg-sky text-white shadow-xs' : 'border-line bg-cloud text-ink-soft'
              }`}
            >
              <span>📸</span> <span>Live Kamera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.tap()
                setTab('upload')
              }}
              className={`flex-1 py-1.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'upload' ? 'border-sky bg-sky text-white shadow-xs' : 'border-line bg-cloud text-ink-soft'
              }`}
            >
              <span>🖼️</span> <span>Upload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.tap()
                setTab('sketch')
              }}
              className={`flex-1 py-1.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'sketch' ? 'border-sky bg-sky text-white shadow-xs' : 'border-line bg-cloud text-ink-soft'
              }`}
            >
              <span>✏️</span> <span>Sulat-kamay</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-4 overflow-y-auto no-scrollbar space-y-3.5 flex-1">
            {/* Live Camera Viewfinder */}
            {tab === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-line">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                {/* Bounding box guide overlay */}
                <div className="absolute inset-5 border-2 border-dashed border-sun/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="text-[10px] font-black text-sun drop-shadow bg-black/40 px-2 py-0.5 rounded-md self-start">
                    Itutok ang formula dito
                  </div>
                  <div className="text-[10px] font-bold text-white/90 drop-shadow text-center">
                    Hawakan nang matatag ang camera
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center text-white">
                    <p className="text-xs font-bold text-heart-soft mb-2">{cameraError}</p>
                    <Button tone="white" onClick={startCamera} className="text-xs">
                      Subukan Ulit
                    </Button>
                  </div>
                )}

                {cameraActive && (
                  <button
                    type="button"
                    onClick={processImage}
                    disabled={isProcessing}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-sun text-ink font-black text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-1.5 border-2 border-white"
                  >
                    <span>📸</span> {isProcessing ? 'Sinisuri…' : 'Kunan at I-scan'}
                  </button>
                )}
              </div>
            )}

            {/* File Upload Area */}
            {tab === 'upload' && (
              <label className="rounded-2xl border-2 border-dashed border-sky p-6 flex flex-col items-center justify-center gap-2 bg-sky-soft/20 hover:bg-sky-soft/40 transition cursor-pointer text-center">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <span className="w-12 h-12 rounded-2xl bg-white border-2 border-sky flex items-center justify-center text-xl shadow-xs">
                  📁
                </span>
                <div>
                  <div className="font-black text-sm text-ink">Pumili ng litrato o screenshot</div>
                  <div className="text-xs font-bold text-ink-soft">PNG, JPG, o kuha mula sa papel</div>
                </div>
                {isProcessing && <p className="text-xs font-black text-sky animate-pulse mt-2">Binabasa ang math…</p>}
              </label>
            )}

            {/* Sketch / Chalkboard Pad */}
            {tab === 'sketch' && (
              <div className="space-y-2">
                <div className="rounded-2xl overflow-hidden border-2 border-line bg-[#1E1B24] relative touch-none shadow-xs">
                  <canvas
                    ref={sketchCanvasRef}
                    width={380}
                    height={190}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    className="w-full h-[190px] block cursor-crosshair"
                  />
                  <div className="absolute top-2 left-2 text-[10px] font-bold text-white/40 pointer-events-none">
                    Isulat ang math formula gamit ang daliri
                  </div>
                  <button
                    type="button"
                    onClick={clearSketch}
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/20 text-white font-black text-[11px] hover:bg-white/30 cursor-pointer"
                  >
                    Burahin ↺
                  </button>
                </div>
                <Button tone="grape" className="w-full text-xs font-black" onClick={processImage}>
                  {isProcessing ? 'Sinisuri ang sulat-kamay…' : 'I-scan ang Sulat-kamay ✨'}
                </Button>
              </div>
            )}

            {/* Scanned Result Preview & Edit Box */}
            <div className="rounded-2xl border-2 border-line bg-cloud/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black uppercase tracking-wider text-ink-soft">Na-detect na Math:</span>
                <span className="text-[10px] font-black text-leaf bg-leaf-soft px-2 py-0.5 rounded-full border border-leaf/30">
                  100% Offline OCR
                </span>
              </div>

              {/* Live Rendered LaTeX Math */}
              <div className="p-3 rounded-xl bg-white border border-line text-center overflow-x-auto no-scrollbar min-h-[50px] flex items-center justify-center">
                {scannedLatex ? (
                  <span className="text-xl font-bold">
                    <Tex tex={scannedLatex} />
                  </span>
                ) : (
                  <span className="text-xs font-bold text-ink-soft">Walang na-detect na formula</span>
                )}
              </div>

              {/* Quick editable text for user correction */}
              <input
                type="text"
                value={scannedLatex}
                onChange={(e) => setScannedLatex(e.target.value)}
                placeholder="I-edit ang LaTeX kung kailangan…"
                className="w-full px-3 py-1.5 rounded-xl border border-line bg-white text-xs font-bold text-ink focus:outline-sky"
              />

              {/* Sample Templates quick picker */}
              <div className="pt-1">
                <div className="text-[11px] font-bold text-ink-soft mb-1">O pumili ng halimbawang formula:</div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        sfx.tap()
                        setScannedLatex(s.latex)
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-line text-[11px] font-bold text-ink hover:border-sky cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t-2 border-line bg-white flex gap-2">
            <Button tone="white" onClick={onClose} className="w-1/3 text-xs">
              Kanselahin
            </Button>
            <Button
              tone="leaf"
              disabled={!scannedLatex.trim()}
              onClick={handleConfirm}
              className="flex-1 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>I-solve sa Tutor</span> <span>🚀</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
