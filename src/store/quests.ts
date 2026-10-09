import type { IconName } from '../components/Icon'
import { WORLDS } from '../curriculum/worlds'
import { today, useGame } from './game'

type S = ReturnType<typeof useGame.getState>

export interface Quest {
  id: string
  title: string
  icon: IconName
  target: number
  progress: (s: S) => number
  gems: number
}

export const dailyQuests = (s: S): Quest[] => [
  { id: 'xp', title: `Kumita ng ${s.dailyGoal} XP`, icon: 'sun', target: s.dailyGoal, progress: (x) => x.todayXp, gems: 10 },
  { id: 'combo', title: 'Makakuha ng 5 sunod-sunod na tama', icon: 'bolt', target: 5, progress: (x) => x.todayBestCombo, gems: 10 },
  { id: 'lessons', title: 'Tapusin ang 2 stages', icon: 'target', target: 2, progress: (x) => x.todayLessons, gems: 15 },
  { id: 'perfect', title: 'Mag-perfect ng 1 lesson', icon: 'crown', target: 1, progress: (x) => x.todayPerfect, gems: 20 },
]

export const isClaimed = (s: S, id: string) => s.claimed[id] === today()

export interface Achievement {
  id: string
  title: string
  desc: string
  icon: IconName
  color: string
  done: (s: S) => boolean
}

const worldDone = (s: S, id: string) => WORLDS.find((w) => w.id === id)!.stages.every((st) => s.completed[st.id])

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'Unang Hakbang', desc: 'Tapusin ang unang stage', icon: 'steps', color: '#FF8FB1', done: (s) => s.lessonsDone >= 1 },
  { id: 'fire', title: 'Nag-aapoy', desc: '3-day streak', icon: 'flame', color: '#FF8A1F', done: (s) => s.streak >= 3 },
  { id: 'perfect', title: 'Perpekto', desc: 'Isang perfect lesson', icon: 'crown', color: '#FFC83D', done: (s) => s.perfectCount >= 1 },
  { id: 'chest', title: 'Kolektor', desc: 'Magbukas ng 3 chest', icon: 'chest', color: '#D9893D', done: (s) => s.openedChests.length >= 3 },
  { id: 'elem', title: 'Pizza Master', desc: 'Tapusin ang World 1', icon: 'pizza', color: '#FF8A1F', done: (s) => worldDone(s, 'elem') },
  { id: 'jhs', title: 'Timbangan Pro', desc: 'Tapusin ang World 2', icon: 'scale', color: '#2F6BFF', done: (s) => worldDone(s, 'jhs') },
  { id: 'shs', title: 'Ipon Hari', desc: 'Tapusin ang World 3', icon: 'coins', color: '#3DBE6B', done: (s) => worldDone(s, 'shs') },
  { id: 'college', title: 'Kalikasan', desc: 'Tapusin ang World 4', icon: 'sunflower', color: '#9B5DE5', done: (s) => worldDone(s, 'college') },
  { id: 'scholar', title: 'Iskolar', desc: 'Kumita ng 500 XP', icon: 'book', color: '#1F4FD1', done: (s) => s.xp >= 500 },
]
