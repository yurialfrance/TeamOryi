import { useGame } from '../store/game'
import { WORLDS } from '../curriculum/worlds'
import { BottomNav, TopStats } from '../components/ui'
import { Icon } from '../components/Icon'
import { Pipo } from '../components/Pipo'

/** Games hub — more mini-games will land here, matched to the learner's level. */
export function GamesScreen() {
  const { go, level, duelWins, duelsPlayed } = useGame()
  const world = WORLDS.find((w) => w.id === level)!

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="px-3 py-2 border-b-2 border-line bg-white"><TopStats /></header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="versus" size={30} />
          <h1 className="text-2xl font-black">Games</h1>
        </div>
        <p className="text-ink-soft font-semibold text-[15px] mb-5">Mini-laro para mas masaya ang pag-aaral ng math.</p>

        <button onClick={() => go('duel')}
          className="w-full rounded-2xl p-4 flex items-center gap-3 text-left shadow-[0_4px_0_rgba(40,30,120,.25)] active:translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#2F6BFF,#9B5DE5)' }}>
          <span className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Icon name="versus" size={34} white /></span>
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-lg leading-tight">Tagisan ng Talino</div>
            <div className="text-white/80 text-xs font-bold mt-0.5">2-player duel · isang phone lang, walang internet</div>
            {duelsPlayed > 0 && <div className="text-white/70 text-[11px] font-bold mt-1">{duelWins}/{duelsPlayed} panalo</div>}
          </div>
          <Icon name="bolt" size={24} white />
        </button>

        <div className="rounded-2xl border-2 border-dashed border-line p-4 mt-4 flex items-center gap-3 opacity-70">
          <span className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: world.soft }}>
            <Icon name="lock" size={28} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-black text-ink-soft">Marami pang laro</div>
            <div className="text-xs font-bold text-ink-soft">Darating pa — babagay sa level mo, {world.level}.</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 pt-10">
          <Pipo mood="clap" size={100} />
          <span className="text-ink-soft font-black text-sm text-center px-8">May idea ka ba ng laro? Sabihin mo kay Pipo!</span>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
