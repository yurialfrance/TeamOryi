import { useGame } from '../store/game'
import { WORLDS } from '../curriculum/worlds'
import { ACHIEVEMENTS } from '../store/quests'
import { Pipo } from '../components/Pipo'
import { BottomNav, Button, ProgressBar, TopStats } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'
import { AiSetupCard } from './AiSetup'
import { setMuted } from '../lib/sfx'

function Calendar({ activity }: { activity: Record<string, number> }) {
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (27 - i))
    const key = d.toLocaleDateString('en-CA')
    return { key, xp: activity[key] ?? 0, label: d.getDate() }
  })
  const lead = (new Date(days[0].key + 'T00:00').getDay() + 6) % 7
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {['L', 'M', 'M', 'H', 'B', 'S', 'L'].map((d, i) => <div key={i} className="text-center text-[11px] font-black text-ink-soft">{d}</div>)}
      {Array.from({ length: lead }, (_, i) => <div key={'p' + i} />)}
      {days.map((d) => (
        <div key={d.key} title={`${d.key}: ${d.xp} XP`}
          className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black ${d.xp ? 'bg-[#FFF0E0]' : 'bg-cloud text-ink-soft'}`}>
          {d.xp ? <Icon name="flame" size={22} /> : d.label}
        </div>
      ))}
    </div>
  )
}

/** Hexagon achievement badge */
function Badge({ icon, color, done }: { icon: IconName; color: string; done: boolean }) {
  return (
    <div className="relative w-[68px] h-[76px] flex items-center justify-center">
      <svg viewBox="0 0 68 76" className="absolute inset-0">
        <path d="M34 4 62 20v36L34 72 6 56V20Z" fill={done ? color : '#E5E0EA'} />
        <path d="M34 4 62 20v36L34 72Z" fill="#000" opacity={done ? 0.12 : 0.05} />
        <path d="M34 12 55 24v28L34 64 13 52V24Z" fill="#fff" opacity={done ? 0.92 : 0.7} />
      </svg>
      <Icon name={icon} size={32} className="relative" style={done ? undefined : { filter: 'grayscale(1)', opacity: 0.35 }} />
    </div>
  )
}

export function ProfileScreen() {
  const s = useGame()
  const stagesDone = Object.keys(s.completed).length
  const stars = Object.values(s.completed).reduce((a, c) => a + c.stars, 0)
  const totalStages = WORLDS.reduce((a, w) => a + w.stages.length, 0)
  const unlocked = ACHIEVEMENTS.filter((a) => a.done(s)).length

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-3 py-2 border-b-2 border-line bg-white"><TopStats /></header>
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="bg-sky-soft px-5 pt-5 pb-5 flex items-center gap-4 border-b-2 border-line">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-sky flex items-center justify-center overflow-hidden">
            <Pipo mood="thumbsup" size={84} />
          </div>
          <div>
            <div className="text-2xl font-black">{s.name || 'Kaibigan'}</div>
            <div className="text-ink-soft font-bold text-sm">{WORLDS.find((w) => w.id === s.level)?.level} · Goal {s.dailyGoal} XP/araw</div>
            <div className="mt-1.5 inline-flex items-center gap-1 text-xs font-black text-sky bg-white rounded-full px-2 py-0.5 border-2 border-sky/30">
              <Icon name="medal" size={16} /> {unlocked}/{ACHIEVEMENTS.length} badges
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-7">
          <section>
            <h2 className="font-black text-xl mb-3">Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['flame', s.streak, 'Day streak'],
                ['sun', s.xp, 'Total XP'],
                ['target', `${stagesDone}/${totalStages}`, 'Stages'],
                ['star', stars, 'Stars'],
              ] as [IconName, number | string, string][]).map(([icon, v, l]) => (
                <div key={l} className="rounded-2xl border-2 border-line p-3 flex items-center gap-3">
                  <Icon name={icon} size={30} />
                  <div><div className="text-xl font-black leading-none">{v}</div><div className="text-xs font-bold text-ink-soft mt-0.5">{l}</div></div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-black text-xl mb-3">Achievements</h2>
            <div className="grid grid-cols-3 gap-y-4">
              {ACHIEVEMENTS.map((a) => {
                const done = a.done(s)
                return (
                  <div key={a.id} className="flex flex-col items-center text-center">
                    <Badge icon={a.icon} color={a.color} done={done} />
                    <div className={`text-[13px] font-black leading-tight mt-1 ${done ? '' : 'text-ink-soft'}`}>{a.title}</div>
                    <div className="text-[11px] font-semibold text-ink-soft leading-tight">{a.desc}</div>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="font-black text-xl mb-3">Streak calendar</h2>
            <Calendar activity={s.activity} />
          </section>

          <section>
            <h2 className="font-black text-xl mb-1">Curriculum progress</h2>
            <p className="text-sm text-ink-soft font-semibold mb-3">Bawat stage ay naka-map sa isang learning competency.</p>
            <div className="space-y-3">
              {WORLDS.map((w) => {
                const done = w.stages.filter((st) => s.completed[st.id]).length
                return (
                  <details key={w.id} className="rounded-2xl border-2 border-line p-3">
                    <summary className="list-none cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: w.soft }}><Icon name={w.icon} size={28} /></span>
                        <div className="flex-1 min-w-0">
                          <div className="font-black leading-tight">{w.name}</div>
                          <div className="text-xs font-bold text-ink-soft truncate">{w.curriculum}</div>
                        </div>
                        <span className="text-sm font-black" style={{ color: w.color }}>{done}/{w.stages.length}</span>
                      </div>
                      <ProgressBar value={done / w.stages.length} color={w.color} height={10} />
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {w.stages.map((st) => (
                        <li key={st.id} className="flex items-center gap-2 text-sm font-semibold">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${s.completed[st.id] ? 'bg-leaf' : 'bg-line'}`}>
                            {s.completed[st.id] && <Icon name="check" size={14} />}
                          </span>
                          <span className={s.completed[st.id] ? '' : 'text-ink-soft'}>{st.competency}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="font-black text-xl mb-3 flex items-center gap-2"><Icon name="chip" size={28} /> Offline AI</h2>
            <AiSetupCard compact />
          </section>

          <section className="space-y-3">
            <h2 className="font-black text-xl">Settings</h2>
            <label className="flex items-center justify-between rounded-2xl border-2 border-line p-3 font-bold">
              <span className="flex items-center gap-2"><Icon name={s.muted ? 'speakerOff' : 'speaker'} size={26} /> Sound effects</span>
              <input type="checkbox" className="w-6 h-6 accent-sky" checked={!s.muted} onChange={(e) => { s.set({ muted: !e.target.checked }); setMuted(!e.target.checked) }} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WORLDS.map((w) => (
                <button key={w.id} onClick={() => s.set({ level: w.id })}
                  className={`rounded-xl border-2 p-2 font-bold text-sm flex items-center gap-2 ${s.level === w.id ? 'border-sky bg-sky-soft' : 'border-line'}`}>
                  <Icon name={w.icon} size={22} /> {w.level}
                </button>
              ))}
            </div>
            <Button tone="white" className="w-full !text-heart" onClick={() => { if (confirm('I-reset lahat ng progress?')) s.reset() }}>Reset progress</Button>
          </section>
          <p className="text-center text-xs text-ink-soft font-bold pb-2">Sipnayan · Gawa ng TeamOryi para sa AppBuildersPH Hackathon 2026</p>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
