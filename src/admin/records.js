// Reading trade records pasted from Excel or Google Sheets, and writing them
// back out as CSV.
import { COUNTRY_NAMES } from '../site/countries.js'

export const DATE_RE = /^\d{4}(-(0[1-9]|1[0-2]))?$/

const ALIASES = { uae: 'United Arab Emirates', emirates: 'United Arab Emirates', dubai: 'United Arab Emirates', uk: 'United Kingdom', 'great britain': 'United Kingdom', britain: 'United Kingdom', usa: 'United States', us: 'United States', america: 'United States', ksa: 'Saudi Arabia', saudi: 'Saudi Arabia', turkiye: 'Turkey', 'türkiye': 'Turkey' }
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function matchCountry(text) {
  const t = String(text || '').trim()
  const lower = t.toLowerCase()
  return COUNTRY_NAMES.find((c) => c.toLowerCase() === lower) || ALIASES[lower] || t
}

function parseDate(text) {
  const t = String(text || '').trim()
  let m
  if ((m = t.match(/^(\d{4})[-/.](\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, '0')}`
  if ((m = t.match(/^(\d{1,2})[-/.](\d{4})$/))) return `${m[2]}-${m[1].padStart(2, '0')}`
  if ((m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) return `${m[3]}-${m[2].padStart(2, '0')}`
  if ((m = t.match(/^([a-z]{3})[a-z]*[\s-]+(\d{4})$/i)) && MONTHS.includes(m[1].toLowerCase())) return `${m[2]}-${String(MONTHS.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}`
  if ((m = t.match(/^(\d{4})$/))) return m[1]
  return t
}

function parseTransport(text) {
  const t = String(text || '').toLowerCase()
  if (/air|plane|flight|cargo/.test(t)) return 'air'
  if (/sea|ship|port|vessel|container/.test(t)) return 'sea'
  if (/rail|train/.test(t)) return 'rail'
  return 'road'
}

const num = (v) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0

// Rows copied from Excel or Google Sheets arrive tab-separated; CSV files use commas.
export function parseRows(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const sep = lines.some((l) => l.includes('\t')) ? '\t' : lines.some((l) => l.includes(';')) ? ';' : ','
  const rows = []
  for (const line of lines) {
    const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''))
    if (rows.length === 0 && !/\d/.test(cells[0] || '')) continue // header row
    if (cells.length < 5) continue
    const [date, product, country, direction, tonnes, orders, transport] = cells
    rows.push({
      date: parseDate(date),
      product: product || '',
      country: matchCountry(country),
      direction: /imp/i.test(direction) ? 'import' : 'export',
      tonnes: num(tonnes),
      orders: Math.max(0, Math.round(num(orders))) || 1,
      transport: parseTransport(transport),
    })
  }
  return rows
}

export function toCsv(records) {
  const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  return ['Date,Product,Country,Direction,Tons,Orders,Transport', ...records.map((r) => [r.date, r.product, r.country, r.direction, r.tonnes, r.orders, r.transport].map(q).join(','))].join('\n')
}

