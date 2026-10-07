import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDownUp, ClipboardPaste, Download, Plus, Search, Trash2, X } from 'lucide-react'
import { COUNTRY_NAMES } from '../site/countries.js'
import { TRANSPORT } from '../site/icons.jsx'
import { fmtNum, tradeSummary } from '../site/trade.js'
import { DATE_RE, parseRows, toCsv } from './records.js'

const PAGE = 30
const thisMonth = () => new Date().toISOString().slice(0, 7)

function PastePanel({ onAdd, onClose }) {
  const [text, setText] = useState('')
  const rows = useMemo(() => parseRows(text), [text])
  const problems = rows.filter((r) => !DATE_RE.test(r.date) || !r.product || !COUNTRY_NAMES.includes(r.country) || r.tonnes <= 0).length
  return (
    <div className="paste">
      <div className="paste__head">
        <h3><ClipboardPaste size={18} /> Paste rows from Excel or Google Sheets</h3>
        <button type="button" className="icon-b" onClick={onClose} aria-label="Close"><X size={16} /></button>
      </div>
      <p>Columns in this order: <b>Date</b> (2026-09 or 2025), <b>Product</b>, <b>Country</b>, <b>Export or Import</b>, <b>Tons</b>, <b>Orders</b>, <b>Transport</b> (air, road or sea). A heading row is skipped automatically.</p>
      <textarea className="input input--area paste__box" rows={7} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={'2026-09\tPomegranates\tIndia\tExport\t42\t1\tAir\n2025\tRaisins\tIndia\tExport\t820\t37\tRoad'} />
      <div className="paste__foot">
        <span>{rows.length ? `${rows.length} rows found${problems ? `, ${problems} need checking after adding` : ''}` : 'Nothing pasted yet'}</span>
        <button type="button" className="b b--soft" disabled={!rows.length} onClick={() => onAdd(rows, 'replace')}>Replace all records</button>
        <button type="button" className="b b--primary" disabled={!rows.length} onClick={() => onAdd(rows, 'add')}><Plus size={16} /> Add {rows.length || ''} rows</button>
      </div>
    </div>
  )
}

export default function RecordsEditor({ content, setContent, pasting, setPasting }) {
  const records = content.records || []
  const productNames = (content.products?.items || []).map((p) => p.title)
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const summary = useMemo(() => tradeSummary(content), [content])

  const setRecords = (fn, extra = {}) => setContent((c) => ({ ...c, ...extra, records: fn(c.records || []) }))
  const update = (i, patch) => setRecords((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const remove = (i) => setRecords((list) => list.filter((_, j) => j !== i))
  const add = () => {
    const last = records[0] || {}
    setRecords((list) => [{ date: thisMonth(), product: last.product || productNames[0] || '', country: last.country || 'India', direction: last.direction || 'export', tonnes: 0, orders: 1, transport: last.transport || 'road' }, ...list])
    setQuery('')
    setYear('')
  }
  const sort = () => setRecords((list) => [...list].sort((a, b) => String(b.date).localeCompare(String(a.date))))
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([toCsv(records)], { type: 'text/csv' }))
    a.download = `trade-records-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const pasted = (rows, mode) => {
    if (mode === 'replace' && !window.confirm(`Replace all ${records.length} records with the ${rows.length} pasted rows?`)) return
    setRecords((list) => (mode === 'replace' ? rows : [...rows, ...list]), { sampleData: false })
    setPasting(false)
  }

  const years = [...new Set(records.map((r) => String(r.date).slice(0, 4)).filter(Boolean))].sort().reverse()
  const q = query.trim().toLowerCase()
  const visible = records
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => (!year || String(r.date).startsWith(year)) && (!q || `${r.product} ${r.country} ${r.date}`.toLowerCase().includes(q)))
  const issues = (r) => [
    !DATE_RE.test(String(r.date)) && 'Date must look like 2026-09 or 2025',
    !r.product && 'Add a product',
    r.country && !COUNTRY_NAMES.includes(r.country) && 'This country is not on the map list',
    !(Number(r.tonnes) > 0) && 'Tons must be more than 0 to count',
  ].filter(Boolean)

  return (
    <div className="records">
      {content.sampleData && (
        <div className="callout callout--warn">
          <AlertTriangle size={20} />
          <div>
            <strong>These are example records.</strong> The website shows an “example figures” note until you replace them with your own.
            <div className="callout__actions">
              <button type="button" className="b b--soft" onClick={() => { if (window.confirm('Delete all example records? You can then add your own.')) setRecords(() => [], { sampleData: false }) }}>Delete example records</button>
              <button type="button" className="b b--ghost" onClick={() => setContent((c) => ({ ...c, sampleData: false }))}>These are my real figures</button>
            </div>
          </div>
        </div>
      )}

      <div className="totals">
        <div><span>Total shipped</span><strong>{fmtNum(summary.shipped)} Tons</strong></div>
        <div><span>Exported</span><strong>{fmtNum(summary.exported)} Tons</strong></div>
        <div><span>Imported</span><strong>{fmtNum(summary.imported)} Tons</strong></div>
        <div><span>Orders</span><strong>{fmtNum(summary.orders)}</strong></div>
        <div><span>Countries</span><strong>{summary.countries}</strong></div>
      </div>

      <div className="records__bar">
        <button type="button" className="b b--primary" onClick={add}><Plus size={16} /> Add record</button>
        <button type="button" className="b b--soft" onClick={() => setPasting((p) => !p)}><ClipboardPaste size={16} /> Paste from Excel</button>
        <div className="records__search">
          <Search size={15} />
          <input className="input input--sm" placeholder="Search product or country" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE) }} aria-label="Search records" />
        </div>
        <select className="input input--sm records__year" value={year} onChange={(e) => { setYear(e.target.value); setLimit(PAGE) }} aria-label="Filter by year">
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="button" className="icon-b" onClick={sort} title="Sort newest first" aria-label="Sort newest first"><ArrowDownUp size={15} /></button>
        <button type="button" className="icon-b" onClick={download} title="Download as CSV (opens in Excel)" aria-label="Download as CSV"><Download size={15} /></button>
      </div>

      {pasting && <PastePanel onAdd={pasted} onClose={() => setPasting(false)} />}

      <p className="f__help">One row can be a single shipment (date like <b>2026-09</b>, shown in Recent shipments) or a whole year’s total for a product and country (date like <b>2025</b>).</p>

      <datalist id="product-names">{productNames.map((p) => <option key={p} value={p} />)}</datalist>
      <div className="rtable" role="table" aria-label="Trade records">
        <div className="rtable__row rtable__row--head" role="row">
          <span role="columnheader">Date</span><span role="columnheader">Product</span><span role="columnheader">Country</span>
          <span role="columnheader">Type</span><span role="columnheader">Tons</span><span role="columnheader">Orders</span>
          <span role="columnheader">Transport</span><span />
        </div>
        {visible.slice(0, limit).map(({ r, i }) => {
          const problems = issues(r)
          return (
            <div className={`rtable__row ${problems.length ? 'has-issue' : ''}`} role="row" key={i}>
              <label className="rc rc--date"><span>Date</span>
                <input className={`input input--sm ${DATE_RE.test(String(r.date)) ? '' : 'is-invalid'}`} value={r.date} placeholder="2026-09" onChange={(e) => update(i, { date: e.target.value.trim() })} />
              </label>
              <label className="rc rc--product"><span>Product</span>
                <input className="input input--sm" list="product-names" value={r.product} onChange={(e) => update(i, { product: e.target.value })} />
              </label>
              <label className="rc rc--country"><span>Country</span>
                <select className="input input--sm" value={r.country} onChange={(e) => update(i, { country: e.target.value })}>
                  {!COUNTRY_NAMES.includes(r.country) && <option value={r.country}>{r.country || 'Choose…'}</option>}
                  {COUNTRY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="rc rc--dir"><span>Type</span>
                <select className={`input input--sm dir-${r.direction}`} value={r.direction} onChange={(e) => update(i, { direction: e.target.value })}>
                  <option value="export">Export</option>
                  <option value="import">Import</option>
                </select>
              </label>
              <label className="rc rc--tonnes"><span>Tons</span>
                <input className="input input--sm" type="number" min="0" step="any" value={r.tonnes} onChange={(e) => update(i, { tonnes: e.target.value === '' ? '' : Number(e.target.value) })} />
              </label>
              <label className="rc rc--orders"><span>Orders</span>
                <input className="input input--sm" type="number" min="0" step="1" value={r.orders} onChange={(e) => update(i, { orders: e.target.value === '' ? '' : Number(e.target.value) })} />
              </label>
              <label className="rc rc--transport"><span>Transport</span>
                <select className="input input--sm" value={r.transport} onChange={(e) => update(i, { transport: e.target.value })}>
                  {Object.entries(TRANSPORT).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
                </select>
              </label>
              <button type="button" className="icon-b icon-b--danger rc--del" aria-label="Delete record" onClick={() => remove(i)}><Trash2 size={15} /></button>
              {problems.length > 0 && <p className="rtable__issue"><AlertTriangle size={13} /> {problems.join(' · ')}</p>}
            </div>
          )
        })}
        {!visible.length && <p className="rtable__empty">{records.length ? 'No records match.' : 'No records yet. Press “Add record” or paste rows from Excel.'}</p>}
      </div>
      {visible.length > limit && (
        <button type="button" className="b b--add" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, visible.length - limit)} more of {visible.length - limit}</button>
      )}

      <div className="history">
        <h3>Totals from before these records</h3>
        <p className="f__help">If you have shipped goods that are not in the table, add the totals here and they are included in all the figures.</p>
        <div className="history__fields">
          {[['exported', 'Tons exported'], ['imported', 'Tons imported'], ['orders', 'Orders completed']].map(([k, label]) => (
            <label key={k}>{label}
              <input className="input" type="number" min="0" value={content.history?.[k] ?? 0}
                onChange={(e) => setContent((c) => ({ ...c, history: { ...(c.history || {}), [k]: e.target.value === '' ? 0 : Number(e.target.value) } }))} />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
