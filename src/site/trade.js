// Turns the list of trade records into every figure the website shows:
// totals, tonnes per year, per product and per country, and recent shipments.
// Used by the website and by the admin panel's dashboard.

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const yearOf = (r) => Number(String(r.date || '').slice(0, 4)) || 0
const hasMonth = (r) => /^\d{4}-\d{2}/.test(String(r.date || ''))

export function tradeSummary(content) {
  const records = (content.records || []).filter((r) => num(r.tonnes) > 0 && r.product && r.country)
  const history = content.history || {}
  const sum = (list, key = 'tonnes') => list.reduce((s, r) => s + num(r[key]), 0)
  const exports = records.filter((r) => r.direction !== 'import')
  const imports = records.filter((r) => r.direction === 'import')

  const exported = sum(exports) + num(history.exported)
  const imported = sum(imports) + num(history.imported)
  const orders = sum(records, 'orders') + num(history.orders)
  const countries = new Set(records.map((r) => r.country)).size

  const years = new Map()
  for (const r of records) {
    const y = yearOf(r)
    if (!y) continue
    const row = years.get(y) || { year: y, exported: 0, imported: 0, partial: false }
    row[r.direction === 'import' ? 'imported' : 'exported'] += num(r.tonnes)
    years.set(y, row)
  }
  const byYear = [...years.values()].sort((a, b) => a.year - b.year)
  // The newest year counts as "so far" when it only has month-dated records
  // and the latest one is before December.
  const last = byYear[byYear.length - 1]
  if (last) {
    const inLast = records.filter((r) => yearOf(r) === last.year)
    const latest = inLast.map((r) => String(r.date)).sort().pop()
    last.partial = inLast.every(hasMonth) && latest.slice(5, 7) < '12'
  }

  const group = (key) => {
    const m = new Map()
    for (const r of records) {
      const name = r[key] || (key === 'transport' ? 'road' : '')
      const g = m.get(name) || { name, tonnes: 0, exported: 0, imported: 0, orders: 0 }
      g.tonnes += num(r.tonnes)
      g[r.direction === 'import' ? 'imported' : 'exported'] += num(r.tonnes)
      g.orders += num(r.orders)
      m.set(name, g)
    }
    const total = sum(records) || 1
    return [...m.values()].sort((a, b) => b.tonnes - a.tonnes).map((g) => ({ ...g, share: g.tonnes / total }))
  }

  const full = byYear.filter((y) => !y.partial)
  const a = full[full.length - 2]
  const b = full[full.length - 1]
  const growth = a && b && a.exported + a.imported > 0
    ? { from: a.year, to: b.year, pct: Math.round(((b.exported + b.imported) / (a.exported + a.imported) - 1) * 100) }
    : null

  const recent = records.filter(hasMonth).sort((x, y) => String(y.date).localeCompare(String(x.date)))

  return {
    exported, imported, shipped: exported + imported, orders, countries,
    byYear, byProduct: group('product'), byCountry: group('country'), byTransport: group('transport'),
    growth, recent, latest: recent[0]?.date || (last ? String(last.year) : ''),
  }
}

// The unit every figure is shown in, e.g. "Tons".
export const unitOf = (content) => content.record?.unit || 'Tons'

// "1 Ton" rather than "1 Tons".
export const unitFor = (n, unit) => (Math.round(num(n)) === 1 && /[a-z]s$/i.test(unit || '') ? unit.slice(0, -1) : unit)

export const yearsSince = (since) => Math.max(1, new Date().getFullYear() - Number(since || 0))

export const fmtNum = (n) => Math.round(num(n)).toLocaleString('en-US')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function fmtDate(date) {
  const [y, m] = String(date || '').split('-')
  return m ? `${MONTHS[Number(m) - 1] || ''} ${y}`.trim() : y || ''
}
