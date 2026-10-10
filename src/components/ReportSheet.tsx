import { useMemo, useState } from 'react'
import { Sheet, Button } from './ui'
import { Icon, type IconName } from './Icon'
import { pct } from '../engine/mastery'
import { REPORT_TITLE, type ReportKind } from '../report/model'
import { currentReport, downloadReport, type RangePreset } from '../report/generate'
import { sfx } from '../lib/sfx'

const KINDS: { id: ReportKind; label: string; icon: IconName }[] = [
  { id: 'landas', label: 'Landas', icon: 'stairs' },
  { id: 'duel', label: 'Tagisan ng Talino', icon: 'versus' },
  { id: 'cashier', label: 'Sari-Sari Cashier', icon: 'store' },
  { id: 'nerdle', label: 'Sipnayan Nerdle', icon: 'blocks' },
]
const RANGES: { id: RangePreset; label: string }[] = [
  { id: '7', label: 'Huling 7 araw' },
  { id: '30', label: 'Huling 30 araw' },
  { id: 'all', label: 'Lahat' },
]

/**
 * "I-download ang Assessment Report" — for a parent or teacher. Opened from Profile (pick any
 * report) or from a game's results (that game's report preselected). Built fully on the device.
 */
export function ReportSheet({ open, onClose, kind: fixedKind }: { open: boolean; onClose: () => void; kind?: ReportKind }) {
  const [kind, setKind] = useState<ReportKind>(fixedKind ?? 'landas')
  const [range, setRange] = useState<RangePreset>('30')
  const [status, setStatus] = useState<'idle' | 'working' | 'shared' | 'downloaded' | 'error'>('idle')
  const active = fixedKind ?? kind
  const preview = useMemo(() => (open ? currentReport(active, range) : null), [open, active, range])

  const go = async () => {
    sfx.tap()
    setStatus('working')
    try {
      const r = await downloadReport(active, range)
      setStatus(r === 'cancelled' ? 'idle' : r)
    } catch {
      setStatus('error')
    }
  }

  return (
    <Sheet open={open} onClose={() => { setStatus('idle'); onClose() }}>
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-11 h-11 rounded-2xl bg-sky-soft flex items-center justify-center shrink-0"><Icon name="chartUp" size={28} /></span>
        <div>
          <div className="font-black text-lg leading-tight">Assessment Report (PDF)</div>
          <div className="text-xs font-bold text-ink-soft">Para sa magulang o guro — malinaw kahit hindi pa nila nagagamit ang app</div>
        </div>
      </div>

      {!fixedKind && (
        <div className="mt-4">
          <div className="font-black text-xs uppercase tracking-wide text-ink-soft mb-2">Anong report?</div>
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <button key={k.id} type="button" onClick={() => { sfx.tap(); setKind(k.id); setStatus('idle') }}
                className={`btn3d p-2.5 border-2 bg-white flex items-center gap-2 text-left text-[13px] font-black ${kind === k.id ? 'border-sky bg-sky-soft' : 'border-line'}`}
                style={{ ['--shadow' as string]: kind === k.id ? 'var(--color-sky)' : '#E0D9E8' }}>
                <Icon name={k.icon} size={24} /> {k.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="font-black text-xs uppercase tracking-wide text-ink-soft mb-2">Saklaw ng petsa</div>
        <div className="grid grid-cols-3 gap-2">
          {RANGES.map((r) => (
            <button key={r.id} type="button" onClick={() => { sfx.tap(); setRange(r.id); setStatus('idle') }}
              className={`py-2 rounded-xl border-2 text-[12px] font-black ${range === r.id ? 'border-sun bg-sun-soft text-ink' : 'border-line text-ink-soft bg-white'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {preview && (
        <div className="mt-4 rounded-2xl bg-cloud border-2 border-line p-3 text-[13px] font-bold">
          <div className="text-[11px] font-black uppercase tracking-wide text-ink-soft mb-1">{REPORT_TITLE[active]}</div>
          {preview.empty ? (
            <span className="text-ink-soft">Wala pang nasagot sa saklaw na ito — magiging maikli ang report. Maglaro o mag-aral muna nang ilang araw.</span>
          ) : (
            <span>
              {preview.summary.attempts} sagot · {pct(preview.summary.accuracy)} tama · {preview.topics.length} paksa
              {preview.lists.mahina.length > 0 && <span className="block text-heart-dark mt-0.5">Mahina sa: {preview.lists.mahina.slice(0, 2).map((t) => t.label).join(', ')}</span>}
              {preview.lists.malakas.length > 0 && <span className="block text-leaf-dark mt-0.5">Malakas sa: {preview.lists.malakas.slice(0, 2).map((t) => t.label).join(', ')}</span>}
            </span>
          )}
        </div>
      )}

      <Button tone="sky" className="w-full mt-4" disabled={status === 'working'} onClick={go}>
        <Icon name="download" size={22} white /> {status === 'working' ? 'Ginagawa ang PDF…' : 'I-download ang Assessment Report'}
      </Button>
      <p className="mt-2 text-center text-[12px] font-bold text-ink-soft">
        {status === 'shared' ? 'Naibahagi na ang report!' : status === 'downloaded' ? 'Na-download na ang PDF.' : status === 'error' ? 'Hindi nagawa ang report — subukan ulit.' : 'Ginagawa sa device mismo — hindi kailangan ng internet.'}
      </p>
    </Sheet>
  )
}
