// "I-download ang Assessment Report": build the model from the store, draw the PDF, deliver it.
// Everything happens on the device; jsPDF and the fonts are bundled and precached for offline use.
import regularUrl from '@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf?url'
import boldUrl from '@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf?url'
import { WORLDS } from '../curriculum/worlds'
import { today, useGame } from '../store/game'
import { buildReport, presetRange, type IslandInfo, type ReportKind, type ReportModel } from './model'
import { deliverPdf, type Delivery } from './deliver'

export type RangePreset = '7' | '30' | 'all'

export const islandsInfo = (): IslandInfo[] => WORLDS.map((w) => ({ id: w.id, grade: w.level, stageIds: w.stages.map((s) => s.id) }))

/** The report model for the current learner (also used for the in-app preview) */
export function currentReport(kind: ReportKind, preset: RangePreset): ReportModel {
  const s = useGame.getState()
  return buildReport(kind, s, presetRange(preset, today(), s.progress ?? {}), today(), islandsInfo())
}

let fontsP: Promise<{ regular: Uint8Array; bold: Uint8Array }> | null = null
const loadFonts = () => {
  fontsP ??= Promise.all([regularUrl, boldUrl].map(async (u) => new Uint8Array(await (await fetch(u)).arrayBuffer())))
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((e) => { fontsP = null; throw e })
  return fontsP
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()

export async function downloadReport(kind: ReportKind, preset: RangePreset): Promise<Delivery> {
  const model = currentReport(kind, preset)
  const [{ renderReportPdf }, fonts] = await Promise.all([import('./pdf'), loadFonts()])
  const bytes = renderReportPdf(model, fonts)
  const filename = `sipnayan-${kind}-report-${slug(model.learnerName) || 'mag-aaral'}-${model.generatedOn}.pdf`
  return deliverPdf(bytes, filename, `${model.title} — ${model.learnerName}`)
}
