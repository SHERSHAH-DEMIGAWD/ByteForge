'use client'

import { FileDown } from 'lucide-react'

export interface ReportTable {
  title: string
  headers: string[]
  rows: (string | number)[][]
}

export interface ReportData {
  title: string
  subtitle?: string
  metrics?: { label: string; value: string | number }[]
  tables?: ReportTable[]
  notes?: string[]
}

function esc(v: string | number): string {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Opens a print-ready report window — the user saves it as PDF via the browser print dialog. */
export function exportReport(data: ReportData) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Pop-up blocked — please allow pop-ups to export the report.')
    return
  }

  const metricsHtml = (data.metrics || [])
    .map(
      (m) => `<div class="metric"><div class="metric-value">${esc(m.value)}</div><div class="metric-label">${esc(m.label)}</div></div>`
    )
    .join('')

  const tablesHtml = (data.tables || [])
    .map(
      (t) => `
      <h2>${esc(t.title)}</h2>
      <table>
        <thead><tr>${t.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`
    )
    .join('')

  const notesHtml = data.notes?.length
    ? `<h2>Observations</h2><ul>${data.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
    : ''

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(data.title)}</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a2236; margin: 40px; }
  .brand { color: #0066ff; font-weight: 800; letter-spacing: 0.5px; font-size: 13px; text-transform: uppercase; }
  h1 { margin: 4px 0 2px; font-size: 26px; }
  .subtitle { color: #5a6478; margin-bottom: 6px; }
  .stamp { color: #8a93a6; font-size: 12px; margin-bottom: 24px; }
  .metrics { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
  .metric { border: 1px solid #d8dee9; border-radius: 8px; padding: 12px 18px; min-width: 130px; }
  .metric-value { font-size: 20px; font-weight: 700; color: #0066ff; }
  .metric-label { font-size: 11px; color: #5a6478; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  h2 { font-size: 15px; margin-top: 28px; border-bottom: 2px solid #0066ff22; padding-bottom: 6px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
  th { background: #f0f4fa; text-align: left; }
  th, td { border: 1px solid #d8dee9; padding: 6px 10px; }
  tr:nth-child(even) td { background: #fafbfd; }
  ul { font-size: 13px; line-height: 1.7; }
  .footer { margin-top: 36px; font-size: 11px; color: #8a93a6; border-top: 1px solid #d8dee9; padding-top: 10px; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
  <div class="brand">ByteForge &mdash; DAA Laboratory Report</div>
  <h1>${esc(data.title)}</h1>
  ${data.subtitle ? `<div class="subtitle">${esc(data.subtitle)}</div>` : ''}
  <div class="stamp">Generated ${new Date().toLocaleString()}</div>
  ${metricsHtml ? `<div class="metrics">${metricsHtml}</div>` : ''}
  ${tablesHtml}
  ${notesHtml}
  <div class="footer">ByteForge &mdash; Design &amp; Analysis of Algorithms Laboratory &middot; ${esc(window.location.origin)}</div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`)
  win.document.close()
}

export function ExportReportButton({ getReport, disabled }: { getReport: () => ReportData; disabled?: boolean }) {
  return (
    <button
      onClick={() => exportReport(getReport())}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border border-border/40 bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-40"
      title="Export a printable PDF report of these results"
    >
      <FileDown className="w-3.5 h-3.5" />
      Export PDF
    </button>
  )
}
