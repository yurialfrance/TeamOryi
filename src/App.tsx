import { useEffect } from 'react'
import { useGame } from './store/game'
import { Onboarding } from './screens/Onboarding'
import { PathScreen } from './screens/Path'
import { LearnScreen } from './screens/Learn'
import { LessonScreen } from './screens/Lesson'
import { CompleteScreen } from './screens/Complete'
import { TutorScreen } from './screens/Tutor'
import { ProfileScreen } from './screens/Profile'
import { QuestsScreen } from './screens/Quests'
import { GamesScreen } from './screens/Games'
import { DuelScreen } from './screens/Duel'
import { CashierSimulatorScreen } from './screens/CashierSimulator'
import { bestModelFor, isModelCached, loadModel } from './ai/llm'
import { setMuted } from './lib/sfx'
import { IconGallery } from './components/IconGallery'

export default function App() {
  const { screen, stageId, aiEnabled, aiModel, muted } = useGame()

  // Auto-load the on-device model if the learner already downloaded it
  useEffect(() => { setMuted(muted) }, [muted])

  useEffect(() => {
    if (aiEnabled) bestModelFor(aiModel).then(async (id) => { if (await isModelCached(id)) loadModel(id) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (import.meta.env.DEV && location.search.includes('icons')) return <IconGallery />

  return (
    <div className="h-full w-full flex justify-center bg-[#EDE8F3]">
      <div className="relative h-full w-full max-w-[480px] bg-white shadow-[0_0_40px_rgba(60,51,70,.12)] overflow-hidden">
        {screen === 'onboarding' && <Onboarding />}
        {screen === 'path' && <PathScreen />}
        {screen === 'learn' && stageId && <LearnScreen key={stageId} />}
        {screen === 'lesson' && stageId && <LessonScreen key={stageId} />}
        {screen === 'complete' && <CompleteScreen />}
        {screen === 'tutor' && <TutorScreen />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'quests' && <QuestsScreen />}
        {screen === 'games' && <GamesScreen />}
        {screen === 'duel' && <DuelScreen />}
        {screen === 'cashier' && <CashierSimulatorScreen />}
      </div>
    </div>
  )
}
