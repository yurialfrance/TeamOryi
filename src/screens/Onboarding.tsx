import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Pipo } from '../components/Pipo'
import { Button, ProgressBar } from '../components/ui'
import { WORLDS, type World } from '../curriculum/worlds'
import { useGame } from '../store/game'
import { AiSetupCard } from './AiSetup'
import { Icon } from '../components/Icon'

const GOALS = [
  { xp: 10, label: 'Chill', note: '5 min / araw' },
  { xp: 20, label: 'Regular', note: '10 min / araw' },
  { xp: 30, label: 'Seryoso', note: '15 min / araw' },
  { xp: 50, label: 'Halimaw', note: '20+ min / araw' },
]

export function Onboarding() {
  const { set } = useGame()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [level, setLevel] = useState<World['id']>('elem')
  const [goal, setGoal] = useState(20)

  const finish = () => set({ onboarded: true, name: name.trim() || 'Kaibigan', level, dailyGoal: goal, screen: 'path' })
  const bubble = [
    'Kumusta! Ako si Pipo. Tutulungan kitang maging magaling sa math — paunti-unti, araw-araw!',
    'Anong level mo ngayon?',
    'Ilang XP ang goal mo kada araw?',
    'Last na! Gusto mo bang i-download ang aking AI utak? Gumagana ito kahit walang internet!',
  ][step]

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-5 pt-5 flex items-center gap-3">
        {step > 0 && <button className="text-2xl text-ink-soft font-black" onClick={() => setStep(step - 1)}>←</button>}
        <ProgressBar value={(step + 1) / 4} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        <div className="flex items-end gap-3 mb-6">
          <Pipo mood={(['wave', 'think', 'calendar', 'phone'] as const)[step]} size={step === 0 ? 120 : 92} className="bob shrink-0" />
          <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="relative mb-6 rounded-2xl border-2 border-line bg-white px-4 py-3 font-bold text-[17px] leading-snug">
            {bubble}
            <span className="absolute -left-2 bottom-4 w-4 h-4 rotate-45 bg-white border-l-2 border-b-2 border-line" />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <div className="space-y-3">
                <label className="block font-black text-ink-soft text-sm uppercase tracking-wide">Anong pangalan mo?</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hal. Juan"
                  maxLength={20}
                  className="w-full h-14 px-4 rounded-2xl border-2 border-line bg-cloud text-lg font-bold outline-none focus:border-sky"
                />
                <div className="rounded-2xl border-2 border-line p-2 text-[15px] font-bold text-ink divide-y-2 divide-line">
                  {([
                    ['book', <>Sumusunod sa <b>DepEd MATATAG</b> at <b>CHED GE</b></>],
                    ['stairs', <>Stage by stage, parang laro</>],
                    ['shield', <>Ang AI ay nasa phone mo — walang data na lumalabas</>],
                  ] as const).map(([ic, t], i) => (
                    <div key={i} className="flex items-center gap-3 p-2"><Icon name={ic} size={30} /><span>{t}</span></div>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-3">
                {WORLDS.map((w) => (
                  <button key={w.id} onClick={() => setLevel(w.id)}
                    className={`btn3d text-left flex items-center gap-4 p-4 border-2 bg-white ${level === w.id ? 'border-sky bg-sky-soft' : 'border-line'}`}
                    style={{ ['--shadow' as string]: level === w.id ? 'var(--color-sky)' : '#E0D9E8' }}>
                    <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: w.soft }}><Icon name={w.icon} size={34} /></span>
                    <span>
                      <span className="block font-black text-lg">{w.level}</span>
                      <span className="block text-sm text-ink-soft font-semibold">{w.curriculum}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-3">
                {GOALS.map((g) => (
                  <button key={g.xp} onClick={() => setGoal(g.xp)}
                    className={`btn3d flex items-center justify-between p-4 border-2 bg-white ${goal === g.xp ? 'border-sky bg-sky-soft' : 'border-line'}`}
                    style={{ ['--shadow' as string]: goal === g.xp ? 'var(--color-sky)' : '#E0D9E8' }}>
                    <span className="flex items-center gap-2 font-black text-lg"><Icon name={(['steps', 'bolt', 'flame', 'crown'] as const)[GOALS.indexOf(g)]} size={28} />{g.label}</span>
                    <span className="text-ink-soft font-bold">{g.note} · {g.xp} XP</span>
                  </button>
                ))}
              </div>
            )}
            {step === 3 && <AiSetupCard />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 pb-6 pt-3 border-t-2 border-line safe-bottom">
        <Button tone={step === 3 ? 'leaf' : 'sky'} className="w-full" onClick={() => (step < 3 ? setStep(step + 1) : finish())}>
          {step < 3 ? 'Tuloy' : 'Simulan na!'}
        </Button>
      </div>
    </div>
  )
}
