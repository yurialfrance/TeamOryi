// Draws a ReportModel as a printable A4 report card with jsPDF — fully on-device. Font bytes are
// passed in (fetched by the app, read from disk in tests) so the same code runs everywhere.
import { jsPDF } from 'jspdf'
import { LEVEL_LABEL, MASTERY, pct, type MasteryLevel } from '../engine/mastery'
import type { ReportModel } from './model'

export interface ReportFonts { regular: Uint8Array; bold: Uint8Array }

const C = {
  ink: '#3C3346', soft: '#7A6F85', line: '#E8E2EE', cloud: '#FFF6F8', sky: '#2F6BFF', skySoft: '#E6EEFF',
  malakas: '#2A9A51', malakasBg: '#E3F8EA', umuunlad: '#B98500', umuunladBg: '#FFF6DA', mahina: '#D93355', mahinaBg: '#FFE6EC', kulang: '#7A6F85', kulangBg: '#F1EDF6',
}
const LEVEL_COLOR: Record<MasteryLevel, [string, string]> = {
  malakas: [C.malakas, C.malakasBg], umuunlad: [C.umuunlad, C.umuunladBg], mahina: [C.mahina, C.mahinaBg], kulang: [C.kulang, C.kulangBg],
}

const W = 210, H = 297, M = 14 // A4, mm
const toB64 = (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s) }

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const MONTHS = ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis']
  return `${d} ${MONTHS[m - 1]} ${y}`
}
const secs = (s: number) => (s >= 60 ? `${(s / 60).toFixed(1)} min` : `${s.toFixed(1)} s`)

export function renderReportPdf(model: ReportModel, fonts: ReportFonts): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.addFileToVFS('Nunito-Regular.ttf', toB64(fonts.regular))
  doc.addFont('Nunito-Regular.ttf', 'Nunito', 'normal')
  doc.addFileToVFS('Nunito-Bold.ttf', toB64(fonts.bold))
  doc.addFont('Nunito-Bold.ttf', 'Nunito', 'bold')
  doc.setFont('Nunito', 'normal')
  doc.setProperties({ title: `${model.title} — ${model.learnerName}`, subject: 'Sipnayan Assessment Report', creator: 'Sipnayan (offline)' })

  let y = 0
  const font = (size: number, bold = false, color = C.ink) => { doc.setFont('Nunito', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(color) }
  const ensure = (h: number) => { if (y + h > H - 16) { doc.addPage(); y = 16 } }
  const para = (text: string, x: number, width: number, size = 10, bold = false, color = C.ink, lh = 1.35) => {
    font(size, bold, color)
    const lines = doc.splitTextToSize(text, width) as string[]
    const h = (lines.length * size * lh * 25.4) / 72
    ensure(h)
    doc.text(lines, x, y + (size * 0.36), { lineHeightFactor: lh })
    y += h
    return h
  }
  /** `keep` = room the content right after needs, so a heading is never stranded at a page end */
  const heading = (t: string, keep = 22) => { y += 4; ensure(12 + keep); font(13, true, C.sky); doc.text(t, M, y + 4); y += 7; doc.setDrawColor(C.line); doc.setLineWidth(0.4); doc.line(M, y, W - M, y); y += 3 }
  const chip = (level: MasteryLevel, x: number, cy: number, w = 30) => {
    const [fg, bg] = LEVEL_COLOR[level]
    doc.setFillColor(bg); doc.roundedRect(x, cy - 3.6, w, 5.4, 2.4, 2.4, 'F')
    font(7.5, true, fg); doc.text(LEVEL_LABEL[level], x + w / 2, cy + 0.2, { align: 'center' })
  }

  // ---- header band
  doc.setFillColor(C.sky); doc.rect(0, 0, W, 30, 'F')
  font(9, true, '#BFD3FF'); doc.text('SIPNAYAN · MATH NA MASAYA', M, 10)
  font(17, true, '#FFFFFF'); doc.text(model.title, M, 19)
  font(9.5, false, '#E6EEFF'); doc.text(model.subtitle, M, 25.5)
  y = 36

  // ---- learner box
  doc.setFillColor(C.cloud); doc.setDrawColor(C.line); doc.roundedRect(M, y, W - 2 * M, 16, 3, 3, 'FD')
  const col = (label: string, value: string, x: number) => { font(7.5, true, C.soft); doc.text(label.toUpperCase(), x, y + 5.5); font(11, true); doc.text(value, x, y + 11.5) }
  col('Pangalan ng mag-aaral', model.learnerName, M + 4)
  col('Saklaw ng petsa', model.range.from === model.range.to ? fmtDate(model.range.from) : `${fmtDate(model.range.from)} – ${fmtDate(model.range.to)}`, M + 70)
  col('Ginawa noong', fmtDate(model.generatedOn), M + 140)
  y += 22

  if (model.empty) {
    heading('Wala pang datos')
    para('Wala pang nasagot ang mag-aaral sa saklaw na petsang ito. Hikayatin ang bata na maglaro o mag-aral ng ilang araw, tapos gumawa ulit ng report.', M, W - 2 * M)
  } else {
    // ---- summary tiles
    const s = model.summary
    const tiles: [string, string][] = [
      ['Kabuuang sagot', String(s.attempts)],
      ['Tamang sagot', `${pct(s.accuracy)}  (${s.correct}/${s.attempts})`],
      ['Karaniwang bilis', `${secs(s.avgSeconds)} / tanong`],
      ['Pangkalahatang antas', LEVEL_LABEL[s.level]],
    ]
    const tw = (W - 2 * M - 3 * 4) / 4
    tiles.forEach(([label, value], i) => {
      const x = M + i * (tw + 4)
      doc.setFillColor(i === 3 ? LEVEL_COLOR[s.level][1] : C.skySoft); doc.roundedRect(x, y, tw, 17, 3, 3, 'F')
      font(7.5, true, C.soft); doc.text(label.toUpperCase(), x + 3, y + 5.5)
      font(12, true, i === 3 ? LEVEL_COLOR[s.level][0] : C.ink); doc.text(value, x + 3, y + 12.5)
    })
    y += 22
    for (const f of model.facts) para(`${f.label}: ${f.value}`, M, W - 2 * M, 9, false, C.soft)

    // ---- Landas: grade mastery
    if (model.grades?.length) {
      heading('Antas ng mastery bawat grade level')
      table(['Grade level', 'Stages na tapos', 'Sagot', 'Tama', 'Antas'], [62, 36, 22, 22, 40],
        model.grades.map((g) => [g.grade, `${g.stagesDone} / ${g.stagesTotal}`, String(g.attempts), g.attempts ? pct(g.accuracy) : '—', g.level]))
    }

    // ---- strands
    heading('Buod ayon sa strand')
    table(['Strand', 'Paksa', 'Sagot', 'Tama', 'Antas'], [72, 22, 24, 24, 40], model.strands.map((st) => [st.label, String(st.topics), String(st.attempts), pct(st.accuracy), st.level]))

    // ---- strong / weak
    heading('Malakas at mahina')
    const lists: [string, MasteryLevel, string[]][] = [
      ['Malakas sa', 'malakas', model.lists.malakas.map((t) => `${t.label} (${pct(t.accuracy)})`)],
      ['Umuunlad sa', 'umuunlad', model.lists.umuunlad.map((t) => `${t.label} (${pct(t.accuracy)})`)],
      ['Mahina sa', 'mahina', model.lists.mahina.map((t) => `${t.label} (${pct(t.accuracy)})`)],
    ]
    const cw = (W - 2 * M - 8) / 3
    const startY = y
    let maxY = y
    lists.forEach(([title, level, items], i) => {
      y = startY
      const x = M + i * (cw + 4)
      const [fg, bg] = LEVEL_COLOR[level]
      doc.setFillColor(bg); doc.roundedRect(x, y, cw, 7, 2, 2, 'F')
      font(9.5, true, fg); doc.text(title, x + 3, y + 4.8)
      y += 9
      if (!items.length) para('—', x + 2, cw - 4, 9, false, C.soft)
      for (const it of items.slice(0, 8)) para(`• ${it}`, x + 2, cw - 4, 8.8)
      maxY = Math.max(maxY, y)
    })
    y = maxY + 2

    // ---- recommendations
    heading('Rekomendasyon')
    model.recommendations.forEach((r, i) => { para(`${i + 1}. ${r}`, M + 1, W - 2 * M - 2, 10); y += 1.2 })

    // ---- Landas: progress over time
    if (model.trend && model.trend.length >= 2) {
      heading('Pag-unlad sa paglipas ng panahon (bawat linggo)', 34)
      const bx = M, bw = W - 2 * M, bh = 26
      doc.setDrawColor(C.line); doc.setFillColor('#FFFFFF'); doc.roundedRect(bx, y, bw, bh, 2, 2, 'FD')
      for (const g of [0.5, MASTERY.strong]) { const gy = y + bh - 3 - g * (bh - 6); doc.setDrawColor(g === MASTERY.strong ? '#9FDDB5' : '#D9D1E3'); doc.line(bx + 2, gy, bx + bw - 2, gy); font(6.5, true, g === MASTERY.strong ? C.malakas : C.soft); doc.text(pct(g), bx + bw - 1, gy - 0.6, { align: 'right' }) }
      const pts = model.trend.map((w, i) => [bx + 6 + (i * (bw - 18)) / (model.trend!.length - 1), y + bh - 3 - w.accuracy * (bh - 6)] as const)
      doc.setDrawColor(C.sky); doc.setLineWidth(0.9)
      for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])
      doc.setFillColor(C.sky); for (const [px, py] of pts) doc.circle(px, py, 0.9, 'F')
      doc.setLineWidth(0.2)
      y += bh + 4
      table(['Linggo ng', 'Sagot', 'Tama'], [70, 40, 40], model.trend.slice(-8).map((w) => [fmtDate(w.weekOf), String(w.attempts), pct(w.accuracy)]))
    }

    // ---- per-topic detail
    heading('Detalye bawat paksa')
    table(['Paksa', 'Sagot', 'Tama', 'Bilis', 'Antas'], [86, 18, 18, 20, 40], model.topics.map((t) => [t.label, String(t.attempts), pct(t.accuracy), secs(t.avgSeconds), t.level]))
  }

  // ---- how to read
  heading('Paano basahin ang report na ito')
  para(`Malakas: ${pct(MASTERY.strong)} pataas ang tama. Umuunlad: ${pct(MASTERY.weak)}–${Math.round(MASTERY.strong * 100) - 1}%. Mahina: mas mababa sa ${pct(MASTERY.weak)}. Kulang pa ang datos: wala pang ${MASTERY.minAttempts} sagot sa paksang iyon, kaya hindi pa ito hinuhusgahan. Ang "bilis" ay ang karaniwang segundo bago sumagot.`, M, W - 2 * M, 9, false, C.soft)
  para('Ginawa ang report na ito sa device mismo — walang ipinadalang datos sa internet.', M, W - 2 * M, 9, false, C.soft)

  // ---- footer on every page
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    font(7.5, false, C.soft)
    doc.text(`Sipnayan · ${model.learnerName} · ${model.title}`, M, H - 8)
    doc.text(`Pahina ${i} ng ${pages}`, W - M, H - 8, { align: 'right' })
  }
  return new Uint8Array(doc.output('arraybuffer'))

  /** Simple table: header row, zebra rows, last column may be a mastery level chip */
  function table(head: string[], widths: number[], rows: string[][]) {
    const rowH = 7
    const drawHead = () => {
      doc.setFillColor(C.skySoft); doc.rect(M, y, widths.reduce((a, b) => a + b, 0), rowH, 'F')
      font(8, true, C.soft)
      let x = M
      head.forEach((h, i) => { doc.text(h.toUpperCase(), x + 2, y + 4.7); x += widths[i] })
      y += rowH
    }
    ensure(rowH * 2); drawHead()
    rows.forEach((r, ri) => {
      font(9)
      const first = doc.splitTextToSize(r[0], widths[0] - 4) as string[]
      const h = Math.max(rowH, first.length * 4.2 + 2.8)
      if (y + h > H - 16) { doc.addPage(); y = 16; drawHead() }
      if (ri % 2) { doc.setFillColor('#FCFAFE'); doc.rect(M, y, widths.reduce((a, b) => a + b, 0), h, 'F') }
      let x = M
      r.forEach((cell, ci) => {
        if (ci === r.length - 1 && cell in LEVEL_LABEL) chip(cell as MasteryLevel, x + 2, y + h / 2 + 0.6, widths[ci] - 6)
        else { font(9, ci === 0); doc.text(ci === 0 ? first : cell, x + 2, y + 4.6, { lineHeightFactor: 1.25 }) }
        x += widths[ci]
      })
      doc.setDrawColor(C.line); doc.line(M, y + h, M + widths.reduce((a, b) => a + b, 0), y + h)
      y += h
    })
    y += 2
  }
}
