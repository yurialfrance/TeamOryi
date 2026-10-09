import { useEffect, useState } from 'react'
import { MODELS, isModelCached, loadModel, useAi, webgpuSupported } from '../ai/llm'
import { useGame } from '../store/game'
import { Button, ProgressBar } from '../components/ui'
import { Icon } from '../components/Icon'

/** Download / enable the on-device AI model */
export function AiSetupCard({ compact = false }: { compact?: boolean }) {
  const { aiModel, set } = useGame()
  const ai = useAi()
  const [gpu, setGpu] = useState<boolean | null>(null)
  const [cached, setCached] = useState<Record<string, boolean>>({})

  useEffect(() => {
    webgpuSupported().then(setGpu)
    Promise.all(MODELS.map(async (m) => [m.id, await isModelCached(m.id)] as const)).then((r) => setCached(Object.fromEntries(r)))
  }, [ai.status])

  const start = () => {
    set({ aiEnabled: true })
    loadModel(aiModel)
  }

  if (gpu === false || ai.status === 'unsupported') {
    return (
      <div className="rounded-2xl border-2 border-line p-4 bg-cloud">
        <div className="font-black text-lg mb-1 flex items-center gap-2"><Icon name="chip" size={28} style={{ filter: 'grayscale(1)' }} /> Walang WebGPU ang browser na ito</div>
        <p className="text-ink-soft font-semibold text-[15px]">
          Gagana pa rin ang Sipnayan! Si Pipo ay gagamit ng built-in na Taglish hints at step-by-step solutions. Para sa full AI, gamitin ang
          bagong Chrome o Edge sa laptop o Android.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="rounded-2xl bg-leaf-soft p-4 font-semibold text-[15px] flex gap-3">
          <Icon name="chip" size={36} /><span>Ang AI ay tumatakbo <b>sa device mo mismo</b> (WebLLM + WebGPU). Isang beses lang i-download, tapos gagana na kahit offline. Walang
          account, walang data na pinapadala sa internet.</span>
        </div>
      )}
      <div className="grid gap-2">
        {MODELS.map((m) => (
          <button key={m.id} disabled={ai.status === 'loading'} onClick={() => set({ aiModel: m.id })}
            className={`btn3d flex items-center justify-between p-3 border-2 bg-white text-left ${aiModel === m.id ? 'border-leaf bg-leaf-soft' : 'border-line'}`}
            style={{ ['--shadow' as string]: aiModel === m.id ? 'var(--color-leaf)' : '#E0D9E8' }}>
            <span>
              <span className="block font-black">{m.label}</span>
              <span className="block text-sm text-ink-soft font-semibold">{m.note}</span>
            </span>
            <span className="text-sm font-black text-ink-soft">{cached[m.id] ? 'Naka-save' : m.size}</span>
          </button>
        ))}
      </div>
      {ai.status === 'loading' || ai.status === 'checking' ? (
        <div className="space-y-2">
          <ProgressBar value={ai.progress} color="var(--color-leaf)" />
          <div className="text-xs font-bold text-ink-soft line-clamp-2">{Math.round(ai.progress * 100)}% · {ai.progressText}</div>
        </div>
      ) : ai.status === 'ready' && ai.modelId === aiModel ? (
        <div className="rounded-2xl bg-leaf-soft text-leaf-dark font-black p-3 flex items-center justify-center gap-2"><Icon name="shield" size={24} /> Handa na si Pipo AI — 100% offline!</div>
      ) : (
        <Button tone="leaf" className="w-full" onClick={start}>
          {cached[aiModel] ? 'I-load ang AI' : 'I-download ang AI'}
        </Button>
      )}
      {ai.status === 'error' && <div className="text-heart font-bold text-sm">May error: {ai.error}</div>}
    </div>
  )
}
