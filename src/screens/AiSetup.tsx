import { useEffect, useState } from 'react'
import { MODELS, isModelCached, loadModel, modelInfo, useAi, webgpuSupported } from '../ai/llm'
import { useGame } from '../store/game'
import { Button, ProgressBar } from '../components/ui'
import { Icon } from '../components/Icon'

/** Download / enable the on-device AI model */
export function AiSetupCard({ compact = false }: { compact?: boolean }) {
  const { aiModel, set, aiLang } = useGame()
  const en = aiLang === 'english'
  const ai = useAi()
  const [gpu, setGpu] = useState<boolean | null>(null)
  const [cached, setCached] = useState<Record<string, boolean>>({})

  useEffect(() => {
    webgpuSupported().then(setGpu)
    Promise.all(MODELS.map(async (m) => [m.id, await isModelCached(m.id)] as const)).then((r) => setCached(Object.fromEntries(r)))
  }, [ai.status])

  // No WebGPU → automatically switch to the CPU model so AI can still be turned on here
  useEffect(() => {
    if (gpu === false && modelInfo(aiModel).backend === 'gpu') set({ aiModel: 'cpu-qwen2.5-0.5b' })
  }, [gpu, aiModel, set])

  const start = () => {
    set({ aiEnabled: true })
    loadModel(aiModel)
  }
  const choices = gpu === false ? MODELS.filter((m) => m.backend === 'cpu') : MODELS

  return (
    <div className="space-y-3">
      {gpu === false && (
        <div className="rounded-2xl bg-sun-soft border-2 border-sun p-3 text-[14px] font-semibold flex gap-2">
          <Icon name="chip" size={26} />
          <span>{en ? <>This browser has no WebGPU, so Pipo will use <b>CPU mode</b>. Still works offline, just slower.</> : <>Walang WebGPU ang browser na ito, kaya gagamitin ang <b>CPU mode</b>. Gagana pa rin offline, pero mas mabagal sumagot.</>}</span>
        </div>
      )}
      {!compact && (
        <div className="rounded-2xl bg-leaf-soft p-4 font-semibold text-[15px] flex gap-3">
          <Icon name="chip" size={36} /><span>{en ? <>The AI runs <b>on your device</b>. Download once, then it works offline. No account, no data sent to the internet.</> : <>Ang AI ay tumatakbo <b>sa device mo mismo</b>. Isang beses lang i-download, tapos gagana na kahit offline. Walang account, walang data na pinapadala sa internet.</>}</span>
        </div>
      )}
      <div className="grid gap-2">
        {choices.map((m) => (
          <button key={m.id} disabled={ai.status === 'loading'} onClick={() => set({ aiModel: m.id })}
            className={`btn3d flex items-center justify-between p-3 border-2 bg-white text-left ${aiModel === m.id ? 'border-leaf bg-leaf-soft' : 'border-line'}`}
            style={{ ['--shadow' as string]: aiModel === m.id ? 'var(--color-leaf)' : '#E0D9E8' }}>
            <span>
              <span className="block font-black">{m.label}</span>
              <span className="block text-sm text-ink-soft font-semibold">{en ? m.noteEn : m.note}</span>
            </span>
            <span className="text-sm font-black text-ink-soft">{cached[m.id] ? (en ? 'Saved' : 'Naka-save') : m.size}</span>
          </button>
        ))}
      </div>
      {ai.status === 'loading' || ai.status === 'checking' ? (
        <div className="space-y-2">
          <ProgressBar value={ai.progress} color="var(--color-leaf)" />
          <div className="text-xs font-bold text-ink-soft line-clamp-2">{Math.round(ai.progress * 100)}% · {ai.progressText}</div>
        </div>
      ) : ai.status === 'ready' && ai.modelId === aiModel ? (
        <div className="rounded-2xl bg-leaf-soft text-leaf-dark font-black p-3 flex items-center justify-center gap-2"><Icon name="shield" size={24} /> {en ? 'Pipo AI is ready' : 'Handa na si Pipo AI'}{modelInfo(aiModel).backend === 'cpu' ? ' (CPU)' : ''} — 100% offline!</div>
      ) : (
        <Button tone="leaf" className="w-full" onClick={start}>
          {cached[aiModel] ? (en ? 'Load the AI' : 'I-load ang AI') : (en ? 'Download the AI' : 'I-download ang AI')}
        </Button>
      )}
      {ai.status === 'error' && (
        <div className="text-heart font-bold text-sm">
          {/fetch|network|Load failed/i.test(ai.error ?? '') ? (en ? 'Could not download the model — check your internet connection and try again.' : 'Hindi ma-download ang model — i-check ang internet connection at subukan ulit.') : `May error: ${ai.error}`}
        </div>
      )}
    </div>
  )
}
