import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { findStage } from '../curriculum/worlds'
import { useGame } from '../store/game'
import { Pipo, type Mood } from '../components/Pipo'
import { VisualView } from '../components/Visuals'
import { Tex } from '../lib/math'
import { Button, ProgressBar } from '../components/ui'
import { Icon } from '../components/Icon'
import { sfx } from '../lib/sfx'

/** Short "ituro muna" walkthrough shown before a stage's very first attempt. Basic, visual, one idea per card. */
export function LearnScreen() {
  const { stageId, go, startLesson, name } = useGame()
  const found = stageId ? findStage(stageId) : null
  const [step, setStep] = useState(0)

  if (!found) return null
  const { world, stage } = found
  const items = stage.guide
  const total = items.length + 1 // + "ready" card
  const onReady = step >= items.length

  const next = () => { sfx.tap(); if (onReady) startLesson(stage.id); else setStep((s) => s + 1) }
  const back = () => { sfx.tap(); if (step === 0) go('path'); else setStep((s) => s - 1) }
  const skip = () => { sfx.tap(); startLesson(stage.id) }

  const mood: Mood = onReady ? 'star' : step === items.length - 1 ? 'eureka' : step === 0 ? 'point' : 'think'

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-5 pt-5 flex items-center gap-3">
        <button onClick={back} className="text-2xl text-ink-soft font-black" aria-label="Back">←</button>
        <ProgressBar value={(step + 1) / total} color={world.color} />
        <button onClick={skip} className="text-[11px] font-black text-ink-soft uppercase tracking-wide whitespace-nowrap">Laktawan →</button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-6 pb-4">
        <div className="flex items-center gap-1.5 mb-1 text-xs font-black uppercase tracking-wider" style={{ color: world.colorDark }}>
          <Icon name={stage.icon} size={18} /> {stage.title}
        </div>
        <div className="flex items-end gap-3 mb-6">
          <Pipo mood={mood} size={110} className="bob shrink-0" />
          <motion.div key={'bubble' + step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="relative mb-2 rounded-2xl border-2 border-[#FFC2D4] bg-[#FFF8FA] px-4 py-3 font-bold text-[16px] leading-snug flex-1 shadow-sm">
            {onReady ? `Ready ka na ba${name ? `, ${name}` : ''}? Alam mo na ang basics — subukan na natin!` : items[step].text}
            <span className="absolute -left-2 bottom-4 w-4 h-4 rotate-45 bg-[#FFF8FA] border-l-2 border-b-2 border-[#FFC2D4]" />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            {!onReady ? (
              <div className="rounded-2xl border-2 border-line p-4 sm:p-5 space-y-3 overflow-hidden shadow-sm" style={{ background: world.soft }}>
                <div className="font-black text-lg text-center" style={{ color: world.colorDark }}>{items[step].title}</div>
                {step === 0 && stage.visual && (
                  <div className="flex justify-center py-1"><VisualView v={stage.visual} /></div>
                )}
                {items[step].tex && (
                  <div className="w-full overflow-x-auto no-scrollbar py-2 px-1 flex justify-center items-center">
                    <div className="text-2xl sm:text-3xl font-bold text-center inline-block max-w-full">
                      <Tex tex={items[step].tex} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-line p-5 text-center" style={{ background: world.soft }}>
                <Icon name={stage.icon} size={56} />
                <div className="font-black text-lg mt-2" style={{ color: world.colorDark }}>{stage.title}</div>
                <div className="font-semibold text-ink-soft text-sm mt-1">{stage.competency}</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {!onReady && (
          <div className="flex justify-center gap-1.5 mt-5">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className="w-2 h-2 rounded-full" style={{ background: i <= step ? world.color : 'var(--color-line)' }} />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pb-6 pt-3 border-t-2 border-line safe-bottom">
        <Button tone={onReady ? 'leaf' : 'sky'} className="w-full" onClick={next}>
          {onReady ? 'Simulan ang Quest! · +60 XP' : 'Susunod'}
        </Button>
      </div>
    </div>
  )
}
