import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useGame } from '../store/game'
import { WORLDS } from '../curriculum/worlds'
import { ACHIEVEMENTS } from '../store/quests'
import { BADGE_ART, Pipo } from '../components/Pipo'
import { BottomNav, Button, ProgressBar, TopStats } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'
import { AiSetupCard } from './AiSetup'
import { setMuted } from '../lib/sfx'

type ProfileSubpage = 'main' | 'settings' | 'achievements' | 'curriculum' | 'ai'

function getCalendarData(activity: Record<string, number>) {
  const now = Date.now()
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (27 - i))
    const key = d.toLocaleDateString('en-CA')
    return { key, xp: activity[key] ?? 0, label: d.getDate() }
  })
  const lead = (new Date(days[0].key + 'T00:00').getDay() + 6) % 7
  return { days, lead }
}

function Calendar({ activity }: { activity: Record<string, number> }) {
  const { days, lead } = useMemo(() => getCalendarData(activity), [activity])

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {['L', 'M', 'M', 'H', 'B', 'S', 'L'].map((d, i) => (
        <div key={i} className="text-center text-[11px] font-black text-ink-soft">{d}</div>
      ))}
      {Array.from({ length: lead }, (_, i) => <div key={'p' + i} />)}
      {days.map((d) => (
        <div
          key={d.key}
          title={`${d.key}: ${d.xp} XP`}
          className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-transform hover:scale-105 ${
            d.xp ? 'bg-[#FFF0E0] shadow-xs' : 'bg-cloud text-ink-soft'
          }`}
        >
          {d.xp ? <Icon name="flame" size={22} /> : d.label}
        </div>
      ))}
    </div>
  )
}

/** Hexagon achievement badge — fills with color as progress rises toward 1 */
function Badge({ id, icon, color, progress }: { id: string; icon: IconName; color: string; progress: number }) {
  const p = Math.min(1, Math.max(0, progress))
  const clipId = `badge-clip-${id}`
  return (
    <div className="relative w-[68px] h-[76px] flex items-center justify-center">
      <svg viewBox="0 0 68 76" className="absolute inset-0">
        <defs>
          <clipPath id={clipId}><rect x="0" y={76 * (1 - p)} width="68" height={76 * p} /></clipPath>
        </defs>
        <path d="M34 4 62 20v36L34 72 6 56V20Z" fill="#E5E0EA" />
        <path d="M34 4 62 20v36L34 72Z" fill="#000" opacity={0.05} />
        <path d="M34 12 55 24v28L34 64 13 52V24Z" fill="#fff" opacity={0.7} />
        <g clipPath={`url(#${clipId})`} style={{ transition: 'clip-path .4s ease' }}>
          <path d="M34 4 62 20v36L34 72 6 56V20Z" fill={color} />
          <path d="M34 4 62 20v36L34 72Z" fill="#000" opacity={0.12} />
          <path d="M34 12 55 24v28L34 64 13 52V24Z" fill="#fff" opacity={0.92} />
        </g>
      </svg>
      <Icon name={icon} size={32} className="relative" style={p >= 1 ? undefined : { filter: `grayscale(${1 - p})`, opacity: 0.35 + 0.65 * p }} />
    </div>
  )
}

/** Reusable Header for profile subpages */
function SubpageHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-20 bg-white border-b-2 border-line px-4 py-3 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="w-10 h-10 rounded-xl bg-cloud border-2 border-line flex items-center justify-center text-ink hover:bg-sky-soft hover:border-sky active:scale-95 transition-all cursor-pointer"
        aria-label="Bumalik sa Profile"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-black text-ink leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs font-bold text-ink-soft truncate">{subtitle}</p>}
      </div>
    </div>
  )
}

/** Navigable Menu Card button on the main Profile screen */
function MenuCard({
  icon,
  iconBg,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: React.ReactNode
  iconBg?: string
  title: string
  subtitle: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-line bg-white p-3.5 flex items-center gap-3.5 text-left transition-all active:scale-[0.98] hover:border-sky/50 hover:bg-sky-soft/20 shadow-[0_3px_0_var(--color-line)] cursor-pointer"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
        style={{ background: iconBg ?? 'var(--color-cloud)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-black text-[15px] text-ink leading-tight truncate">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-sun-soft text-ink-soft border border-sun/30 shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs font-bold text-ink-soft truncate mt-0.5">{subtitle}</div>
      </div>
      <span className="w-7 h-7 rounded-full bg-cloud flex items-center justify-center shrink-0 text-ink-soft">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}

export function ProfileScreen() {
  const s = useGame()
  const [page, setPage] = useState<ProfileSubpage>('main')

  const stagesDone = Object.keys(s.completed).length
  const stars = Object.values(s.completed).reduce((a, c) => a + c.stars, 0)
  const totalStages = WORLDS.reduce((a, w) => a + w.stages.length, 0)
  const unlocked = ACHIEVEMENTS.filter((a) => a.done(s)).length

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-3 py-2 border-b-2 border-line bg-white"><TopStats /></header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {page === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Profile Hero Banner */}
              <div className="bg-sky-soft px-5 pt-5 pb-5 flex items-center gap-4 border-b-2 border-line">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-sky flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <Pipo mood="medal" size={84} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-black truncate">{s.name || 'Kaibigan'}</div>
                  <div className="text-ink-soft font-bold text-sm truncate">
                    {WORLDS.find((w) => w.id === s.level)?.level} · Goal {s.dailyGoal} XP/araw
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage('achievements')}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-black text-sky bg-white rounded-full px-2.5 py-1 border-2 border-sky/30 hover:bg-sky-soft active:scale-95 transition cursor-pointer"
                  >
                    <Icon name="medal" size={16} /> {unlocked}/{ACHIEVEMENTS.length} badges
                    <span className="text-[10px] opacity-60">→</span>
                  </button>
                </div>
              </div>

              <div className="px-5 py-5 space-y-6">
                {/* Statistics Grid */}
                <section>
                  <h2 className="font-black text-xl mb-3">Statistics</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['flame', s.streak, 'Day streak'],
                      ['sun', s.xp, 'Total XP'],
                      ['target', `${stagesDone}/${totalStages}`, 'Stages'],
                      ['star', stars, 'Stars'],
                      ['versus', s.duelWins, 'Duel wins'],
                    ] as [IconName, number | string, string][]).map(([icon, v, l]) => (
                      <div key={l} className="rounded-2xl border-2 border-line p-3 flex items-center gap-3 bg-white shadow-2xs">
                        <Icon name={icon} size={30} />
                        <div>
                          <div className="text-xl font-black leading-none">{v}</div>
                          <div className="text-xs font-bold text-ink-soft mt-0.5">{l}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Streak Calendar - Preserved on main screen */}
                <section className="rounded-2xl border-2 border-line p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black text-lg flex items-center gap-2">
                      <Icon name="calendar" size={24} /> Streak Calendar
                    </h2>
                    <span className="text-xs font-black text-sun-dark bg-sun-soft px-2.5 py-0.5 rounded-full border border-sun/30">
                      {s.streak} araw na tuloy-tuloy!
                    </span>
                  </div>
                  <Calendar activity={s.activity} />
                  <p className="text-[11px] font-bold text-ink-soft mt-3 text-center">
                    Magsanay araw-araw upang panatilihing buhay ang iyong apoy ng karunungan!
                  </p>
                </section>

                {/* Navigation Menu Cards */}
                <section className="space-y-2.5">
                  <h2 className="font-black text-xl mb-1">Menu at Impormasyon</h2>
                  <p className="text-xs font-bold text-ink-soft mb-3">Pumili ng seksyon upang buksan ang buong detalye:</p>

                  <MenuCard
                    icon={<Icon name="speaker" size={26} />}
                    iconBg="var(--color-sky-soft)"
                    title="Mga Setting"
                    subtitle={`Tunog: ${s.muted ? 'Naka-mute' : 'Bukas'} · ${WORLDS.find((w) => w.id === s.level)?.level}`}
                    onClick={() => setPage('settings')}
                  />

                  <MenuCard
                    icon={<Icon name="medal" size={26} />}
                    iconBg="var(--color-sun-soft)"
                    title="Mga Tagumpay (Badges)"
                    subtitle="Tingnan ang lahat ng natapos at bubuksang medalya"
                    badge={`${unlocked}/${ACHIEVEMENTS.length}`}
                    onClick={() => setPage('achievements')}
                  />

                  <MenuCard
                    icon={<Icon name="book" size={26} />}
                    iconBg="#EBF9F1"
                    title="Progreso sa Kurikulum"
                    subtitle="DepEd MATATAG competencies sa bawat world"
                    badge={`${stagesDone}/${totalStages}`}
                    onClick={() => setPage('curriculum')}
                  />

                  <MenuCard
                    icon={<Icon name="chip" size={26} />}
                    iconBg="#F3EDFF"
                    title="Offline AI ni Pipo"
                    subtitle="WebGPU on-device tutor at offline intelligence"
                    badge="WebGPU"
                    onClick={() => setPage('ai')}
                  />
                </section>

                <p className="text-center text-xs text-ink-soft font-bold pb-2 pt-2">
                  Sipnayan · Gawa ng TeamOryi para sa AppBuildersPH Hackathon 2026
                </p>
              </div>
            </motion.div>
          )}

          {/* Subpage: Settings */}
          {page === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              <SubpageHeader
                title="Mga Setting"
                subtitle="Tunog, Antas ng Baitang, at Account"
                onBack={() => setPage('main')}
              />
              <div className="p-5 space-y-6">
                {/* Audio Setting */}
                <section className="space-y-2">
                  <h2 className="text-sm font-black text-ink-soft uppercase tracking-wider">Audio at Effects</h2>
                  <label className="flex items-center justify-between rounded-2xl border-2 border-line p-4 font-bold bg-white cursor-pointer hover:border-sky/50 transition">
                    <span className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-sky-soft flex items-center justify-center shrink-0">
                        <Icon name={s.muted ? 'speakerOff' : 'speaker'} size={24} />
                      </span>
                      <div>
                        <div className="font-black text-ink">Sound Effects</div>
                        <div className="text-xs font-bold text-ink-soft">
                          {s.muted ? 'Walang tunog ang pagsagot' : 'May tunog sa tama, mali, at combo'}
                        </div>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      className="w-6 h-6 accent-sky cursor-pointer"
                      checked={!s.muted}
                      onChange={(e) => {
                        s.set({ muted: !e.target.checked })
                        setMuted(!e.target.checked)
                      }}
                    />
                  </label>
                </section>

                {/* Level / World Selector */}
                <section className="space-y-2">
                  <h2 className="text-sm font-black text-ink-soft uppercase tracking-wider">Pangunahing Baitang (Level)</h2>
                  <p className="text-xs font-semibold text-ink-soft">Piliin ang antas ng matematika na iyong sinasanay ngayon:</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {WORLDS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => s.set({ level: w.id })}
                        className={`rounded-xl border-2 p-3 font-bold text-sm flex items-center gap-2.5 transition active:scale-95 cursor-pointer ${
                          s.level === w.id
                            ? 'border-sky bg-sky-soft text-sky-dark shadow-xs'
                            : 'border-line bg-white hover:border-ink/20'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: w.soft }}>
                          <Icon name={w.icon} size={20} />
                        </span>
                        <div className="text-left min-w-0">
                          <div className="font-black text-xs truncate leading-tight">{w.level}</div>
                          <div className="text-[11px] text-ink-soft truncate font-semibold">{w.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Daily Goal Selector */}
                <section className="space-y-2">
                  <h2 className="text-sm font-black text-ink-soft uppercase tracking-wider">Pang-araw-araw na Goal</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {[30, 50, 100].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => s.set({ dailyGoal: goal })}
                        className={`p-3 rounded-xl border-2 font-black text-sm flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer ${
                          s.dailyGoal === goal
                            ? 'border-sun bg-sun-soft text-ink'
                            : 'border-line bg-white hover:border-ink/20'
                        }`}
                      >
                        <span className="text-lg">{goal}</span>
                        <span className="text-[11px] text-ink-soft font-bold">XP/araw</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Danger Zone */}
                <section className="pt-2 space-y-2">
                  <h2 className="text-sm font-black text-heart uppercase tracking-wider">Panganib / Data</h2>
                  <div className="p-4 rounded-2xl border-2 border-heart/30 bg-heart-soft/20 space-y-3">
                    <p className="text-xs font-bold text-ink-soft">
                      Kung nais mong magsimula mula sa simula, maaari mong i-reset ang lahat ng XP, stars, at natapos na aralin.
                    </p>
                    <Button
                      tone="white"
                      className="w-full !text-heart !border-heart/40 hover:!bg-heart-soft"
                      onClick={() => {
                        if (confirm('I-reset lahat ng progress? Hindi na ito maibabalik.')) {
                          s.reset()
                          setPage('main')
                        }
                      }}
                    >
                      I-reset ang lahat ng progress
                    </Button>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {/* Subpage: Achievements */}
          {page === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              <SubpageHeader
                title="Mga Tagumpay"
                subtitle={`${unlocked} sa ${ACHIEVEMENTS.length} badges ang nakamit`}
                onBack={() => setPage('main')}
              />
              <div className="p-5 space-y-6">
                {/* Summary Progress Box */}
                <div className="rounded-2xl border-2 border-line p-4 bg-sky-soft/40 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-sky flex items-center justify-center shrink-0 shadow-xs">
                    <Icon name="trophy" size={32} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-sm text-ink">Kabuuang Badges</span>
                      <span className="font-black text-xs text-sky">{unlocked} / {ACHIEVEMENTS.length}</span>
                    </div>
                    <ProgressBar value={unlocked / ACHIEVEMENTS.length} color="var(--color-sky)" height={10} />
                  </div>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                  {ACHIEVEMENTS.map((a) => {
                    const done = a.done(s)
                    const progress = Math.min(1, Math.max(0, a.progress(s)))
                    return (
                      <div key={a.id} className="flex flex-col items-center text-center">
                        {BADGE_ART.has(a.id) ? (
                          <div className="relative w-[76px] h-[76px]">
                            <img
                              src={`${import.meta.env.BASE_URL}mascot/badge-${a.id}.webp`}
                              alt={a.title}
                              width={76}
                              height={76}
                              className="absolute inset-0 w-full h-full object-contain"
                              style={{ filter: 'grayscale(1)', opacity: 0.35 }}
                            />
                            <img
                              src={`${import.meta.env.BASE_URL}mascot/badge-${a.id}.webp`}
                              alt=""
                              aria-hidden
                              width={76}
                              height={76}
                              className="absolute inset-0 w-full h-full object-contain"
                              style={{
                                clipPath: `inset(${(1 - progress) * 100}% 0 0 0)`,
                                transition: 'clip-path .4s ease',
                              }}
                            />
                          </div>
                        ) : (
                          <Badge id={a.id} icon={a.icon} color={a.color} progress={progress} />
                        )}
                        <div className={`text-[13px] font-black leading-tight mt-1.5 ${done ? 'text-ink' : 'text-ink-soft'}`}>
                          {a.title}
                        </div>
                        <div className="text-[11px] font-semibold text-ink-soft leading-tight mt-0.5">
                          {a.desc}
                        </div>
                        {!done && progress > 0 && (
                          <div className="w-[52px] h-1.5 rounded-full bg-line overflow-hidden mt-1.5">
                            <div className="h-full rounded-full bg-sun" style={{ width: `${progress * 100}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Subpage: Curriculum Progress */}
          {page === 'curriculum' && (
            <motion.div
              key="curriculum"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              <SubpageHeader
                title="Progreso sa Kurikulum"
                subtitle="DepEd MATATAG Competencies"
                onBack={() => setPage('main')}
              />
              <div className="p-5 space-y-4">
                <div className="rounded-2xl bg-cloud p-3.5 text-xs font-bold text-ink-soft leading-relaxed border-2 border-line">
                  Bawat aralin sa Sipnayan ay naka-map sa opisyal na DepEd MATATAG curriculum guidelines. Mag-tap sa bawat world para makita ang mga competencies.
                </div>

                <div className="space-y-3">
                  {WORLDS.map((w) => {
                    const done = w.stages.filter((st) => s.completed[st.id]).length
                    return (
                      <details key={w.id} className="rounded-2xl border-2 border-line p-3.5 bg-white shadow-2xs group">
                        <summary className="list-none cursor-pointer">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: w.soft }}>
                              <Icon name={w.icon} size={26} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-black leading-tight text-ink">{w.name}</div>
                              <div className="text-xs font-bold text-ink-soft truncate">{w.curriculum}</div>
                            </div>
                            <span className="text-sm font-black shrink-0" style={{ color: w.color }}>
                              {done}/{w.stages.length}
                            </span>
                          </div>
                          <ProgressBar value={done / w.stages.length} color={w.color} height={8} />
                        </summary>
                        <ul className="mt-3.5 pt-3 border-t border-line space-y-2.5">
                          {w.stages.map((st) => (
                            <li key={st.id} className="flex items-center gap-2.5 text-sm font-semibold">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                  s.completed[st.id] ? 'bg-leaf text-white' : 'bg-line text-ink-soft'
                                }`}
                              >
                                {s.completed[st.id] && <Icon name="check" size={14} />}
                              </span>
                              <span className={s.completed[st.id] ? 'text-ink font-bold' : 'text-ink-soft'}>
                                {st.competency}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Subpage: Offline AI */}
          {page === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              <SubpageHeader
                title="Offline AI ni Pipo"
                subtitle="On-device WebGPU Math Model"
                onBack={() => setPage('main')}
              />
              <div className="p-5 space-y-5">
                <AiSetupCard compact={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}

