import { useState } from 'preact/hooks'
import { ArrowDownLeft, ArrowUpRight, CalendarBlank, Globe, Info, Leaf, Package, Scales, TrendUp } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'
import Partners from './Partners.jsx'
import { thumbOf } from '../images.js'
import { useCountUp } from '../hooks.js'
import { fmtDate, fmtNum, unitFor, unitOf, yearsSince } from '../trade.js'
import { freightName, label } from '../labels.js'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function niceTop(max) {
  if (max <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(max)))
  return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((v) => v >= max)
}

function Kpi({ label, value, unit, suffix, icon, tone, i }) {
  const [ref, shown] = useCountUp(value)
  return (
    <div className={`kpi reveal ${tone ? `kpi--${tone}` : ''}`} style={{ '--i': i }} ref={ref}>
      <span className="kpi__icon">{icon}</span>
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value" suppressHydrationWarning>{fmtNum(shown)}{suffix}{unit && <small> {unit}</small>}</strong>
    </div>
  )
}

// Bars of tons per period (years, or months of the newest year), with a
// readout of the period under the pointer.
function VolumeChart({ rows, imports, unit, T, caption }) {
  const [hover, setHover] = useState(null)
  const top = niceTop(Math.max(...rows.map((y) => y.exported + y.imported)))
  const on = hover ?? rows.length - 1
  const shown = rows[on]
  return (
    <div className={`ychart ${rows.length > 8 ? 'ychart--many' : ''}`}>
      <div className="ychart__readout" aria-live="polite">
        <strong>{shown.title}</strong>
        <span><i className="swatch swatch--export" /> {fmtNum(shown.exported)} {unitFor(shown.exported, unit)} {T('exported')}</span>
        {imports && <span><i className="swatch swatch--import" /> {fmtNum(shown.imported)} {unitFor(shown.imported, unit)} {T('imported')}</span>}
      </div>
      <div className="ychart__plot" onMouseLeave={() => setHover(null)}>
        <div className="ychart__grid" aria-hidden="true">
          {[1, 0.5, 0].map((f) => <div key={f}><span>{fmtNum(top * f)}</span></div>)}
        </div>
        <div className="ychart__cols">
          {rows.map((y, i) => {
            const total = y.exported + y.imported
            return (
              <div key={y.key} tabIndex={0} style={{ '--i': i }} className={`ychart__col ${on === i ? 'is-on' : ''} ${y.partial ? 'is-partial' : ''}`}
                onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                aria-label={`${y.title}: ${fmtNum(y.exported)} ${unitFor(y.exported, unit)} ${T('exported')}${imports ? `, ${fmtNum(y.imported)} ${unitFor(y.imported, unit)} ${T('imported')}` : ''}`}>
                <div className="ychart__stack" style={{ height: `${(total / top) * 100}%` }}>
                  {total > 0 && <span className="ychart__total">{fmtNum(total)}</span>}
                  {y.imported > 0 && <span className="ychart__seg ychart__seg--import" style={{ flexGrow: y.imported }} />}
                  {y.exported > 0 && <span className="ychart__seg ychart__seg--export" style={{ flexGrow: y.exported }} />}
                </div>
                <span className="ychart__year">{y.name}</span>
              </div>
            )
          })}
        </div>
      </div>
      {rows.some((y) => y.partial) && <p className="ychart__note">* {rows.find((y) => y.partial).key} {T('soFarNote')}</p>}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th>Period</th><th>Exported</th><th>Imported</th></tr></thead>
        <tbody>{rows.map((y) => <tr key={y.key}><td>{y.title}</td><td>{y.exported}</td><td>{y.imported}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function Breakdown({ rows, unit, thumbs, limit = 6 }) {
  const shown = rows.slice(0, limit)
  const rest = rows.slice(limit)
  const max = shown[0]?.tonnes || 1
  const list = rest.length ? [...shown, { name: `${rest.length} more`, tonnes: rest.reduce((s, r) => s + r.tonnes, 0), share: rest.reduce((s, r) => s + r.share, 0), other: true }] : shown
  return (
    <ul className="bars">
      {list.map((r, i) => (
        <li key={r.name} className={r.other ? 'is-other' : ''} style={{ '--i': i }}>
          {thumbs && (thumbs[r.name]
            ? <Photo image={{ src: thumbs[r.name], alt: '' }} className="bars__thumb" plain width="36" height="36" />
            : <span className="bars__thumb bars__thumb--icon" aria-hidden="true"><Package size={18} weight="duotone" /></span>)}
          <div className="bars__main">
            <div className="bars__row"><span className="bars__name">{r.name}</span><span className="bars__val">{fmtNum(r.tonnes)} {unitFor(r.tonnes, unit)} <small>{r.share < 0.005 ? '<1' : Math.round(r.share * 100)}%</small></span></div>
            <span className="bars__track"><span style={{ width: `${Math.max(2, (r.tonnes / max) * 100)}%` }} /></span>
          </div>
        </li>
      ))}
    </ul>
  )
}


export default function Record({ content, trade, tone, more }) {
  const { record: R, statLabels: L, company, products } = content
  if (!trade.byYear.length) return null
  const unit = unitOf(content)
  const thumbs = Object.fromEntries((products?.items || []).map((p) => [p.title, thumbOf(p.image?.src, 96)]))
  const years = yearsSince(company.since)
  // With a single destination, a country list says nothing; show how the goods travelled instead.
  const many = trade.countries > 1
  const T = (k) => label(content, k)
  // With fewer than two years on record a yearly chart is a single bar, so
  // show the newest year month by month instead.
  const monthly = trade.byYear.length < 2 && trade.byMonth.length > 1
  const rows = monthly
    ? trade.byMonth.map((m) => ({ ...m, key: m.month, title: `${m.name} ${m.year}` }))
    : trade.byYear.map((y) => ({ ...y, key: y.year, name: `${y.year}${y.partial ? '*' : ''}`, title: `${y.year}${y.partial ? ` (${T('soFar')})` : ''}` }))
  const peak = rows.filter((y) => !y.partial).reduce((a, y) => (!a || y.exported + y.imported > a.exported + a.imported ? y : a), null)
  const topProduct = trade.byProduct[0]
  const transport = trade.byTransport.map((t) => ({ ...t, name: freightName(content, t.name) }))
  const average = trade.orders ? trade.shipped / trade.orders : 0
  // Without any imports, "exported" equals "shipped", so show orders and products instead.
  const imports = trade.imported > 0
  return (
    <section className={`section section--${tone}`} id="record">
      <div className="container">
        <SectionHead eyebrow={R.eyebrow} title={R.title} text={R.text} align="split" more={more} />
        {content.sampleData && <p className="sample-note"><Info size={18} weight="duotone" /> {T('sampleNote')}</p>}
        <div className="kpis">
          <Kpi i={0} tone="main" label={L.shipped} value={trade.shipped} unit={unit} icon={<Package size={26} weight="duotone" />} />
          {imports ? (
            <>
              <Kpi i={1} label={L.exported} value={trade.exported} icon={<ArrowUpRight size={22} weight="bold" />} tone="export" />
              <Kpi i={2} label={L.imported} value={trade.imported} icon={<ArrowDownLeft size={22} weight="bold" />} tone="import" />
            </>
          ) : (
            <>
              <Kpi i={1} label={T('productsTraded')} value={trade.byProduct.length} icon={<Leaf size={22} weight="duotone" />} tone="export" />
              <Kpi i={2} label={T('averageOrder')} value={average} unit={unitFor(average, unit)} icon={<Scales size={22} weight="duotone" />} tone="import" />
            </>
          )}
          <Kpi i={3} label={L.orders} value={trade.orders} icon={<TrendUp size={22} weight="duotone" />} />
          {many
            ? <Kpi i={4} label={L.countries} value={trade.countries} icon={<Globe size={22} weight="duotone" />} />
            : <Kpi i={4} label={L.years} value={years} suffix="+" icon={<CalendarBlank size={22} weight="duotone" />} />}
        </div>
        <div className="record__grid">
          <div className="card card--chart reveal">
            <div className="card__head">
              <h3>{monthly ? R.monthChartTitle || `${unit} shipped per month` : R.chartTitle}</h3>
              {imports && <span className="legend"><span><i className="swatch swatch--export" /> {cap(T('exported'))}</span><span><i className="swatch swatch--import" /> {cap(T('imported'))}</span></span>}
            </div>
            <VolumeChart rows={rows} imports={imports} unit={unit} T={T} caption={`${unit} shipped per ${monthly ? 'month' : 'year'}`} />
          </div>
          <div className="card reveal">
            <div className="card__head"><h3>{R.productsTitle}</h3></div>
            <Breakdown rows={trade.byProduct} unit={unit} thumbs={thumbs} />
          </div>
          <div className="card reveal">
            <div className="card__head"><h3>{many ? R.countriesTitle : R.transportTitle || 'By transport'}</h3></div>
            <Breakdown rows={many ? trade.byCountry : transport} unit={unit} />
            {/* Facts the figures above don't already show. */}
            <dl className="facts">
              {imports && <div><dt>{T('averageOrder')}</dt><dd>{fmtNum(average)} {unitFor(average, unit)}</dd></div>}
              {peak && <div><dt>{T(monthly ? 'biggestMonth' : 'biggestYear')}</dt><dd>{peak.title} · {fmtNum(peak.exported + peak.imported)} {unitFor(peak.exported + peak.imported, unit)}</dd></div>}
              {topProduct && <div><dt>{T('topProduct')}</dt><dd>{topProduct.name}</dd></div>}
              {imports && <div><dt>{T('productsTraded')}</dt><dd>{trade.byProduct.length}</dd></div>}
            </dl>
          </div>
        </div>
        <Partners content={content} thumbs={thumbs} />
        {trade.latest && <p className="record__updated">{T('lastUpdated')} {fmtDate(trade.latest)} · <span suppressHydrationWarning>{years}+</span> {L.years?.toLowerCase()}</p>}
      </div>
    </section>
  )
}
