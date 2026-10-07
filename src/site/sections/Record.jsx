import { useState } from 'preact/hooks'
import { ArrowDownLeft, ArrowUpRight, Globe, Package, TrendUp, Info } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'
import { useCountUp } from '../hooks.js'
import { fmtDate, fmtNum } from '../trade.js'

function niceTop(max) {
  if (max <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(max)))
  return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((v) => v >= max)
}

function Kpi({ label, value, unit, icon, tone }) {
  const [ref, shown] = useCountUp(value)
  return (
    <div className={`kpi ${tone ? `kpi--${tone}` : ''}`} ref={ref}>
      <span className="kpi__icon">{icon}</span>
      <span className="kpi__label">{label}</span>
      <strong className="kpi__value">{fmtNum(shown)}{unit && <small> {unit}</small>}</strong>
    </div>
  )
}

function YearChart({ trade, unit }) {
  const years = trade.byYear
  const [hover, setHover] = useState(null)
  const top = niceTop(Math.max(...years.map((y) => y.exported + y.imported)))
  const shown = years[hover ?? years.length - 1]
  return (
    <div className="ychart">
      <div className="ychart__readout" aria-live="polite">
        <strong>{shown.year}{shown.partial ? ' (so far)' : ''}</strong>
        <span><i className="swatch swatch--export" /> {fmtNum(shown.exported)} {unit} exported</span>
        <span><i className="swatch swatch--import" /> {fmtNum(shown.imported)} {unit} imported</span>
      </div>
      <div className="ychart__plot" onMouseLeave={() => setHover(null)}>
        <div className="ychart__grid" aria-hidden="true">
          {[1, 0.5, 0].map((f) => <div key={f}><span>{fmtNum(top * f)}</span></div>)}
        </div>
        <div className="ychart__cols">
          {years.map((y, i) => {
            const total = y.exported + y.imported
            return (
              <div key={y.year} tabIndex={0} className={`ychart__col ${(hover ?? years.length - 1) === i ? 'is-on' : ''} ${y.partial ? 'is-partial' : ''}`}
                onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                aria-label={`${y.year}${y.partial ? ' so far' : ''}: ${fmtNum(y.exported)} ${unit} exported, ${fmtNum(y.imported)} ${unit} imported`}>
                <div className="ychart__stack" style={{ height: `${(total / top) * 100}%` }}>
                  <span className="ychart__total">{fmtNum(total)}</span>
                  {y.imported > 0 && <span className="ychart__seg ychart__seg--import" style={{ flexGrow: y.imported }} />}
                  {y.exported > 0 && <span className="ychart__seg ychart__seg--export" style={{ flexGrow: y.exported }} />}
                </div>
                <span className="ychart__year">{y.year}{y.partial ? '*' : ''}</span>
              </div>
            )
          })}
        </div>
      </div>
      {years.some((y) => y.partial) && <p className="ychart__note">* {years.find((y) => y.partial).year} figures so far this year</p>}
      <table className="sr-only">
        <caption>Tonnes shipped per year</caption>
        <thead><tr><th>Year</th><th>Exported</th><th>Imported</th></tr></thead>
        <tbody>{years.map((y) => <tr key={y.year}><td>{y.year}</td><td>{y.exported}</td><td>{y.imported}</td></tr>)}</tbody>
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
      {list.map((r) => (
        <li key={r.name} className={r.other ? 'is-other' : ''}>
          {thumbs && <Photo image={{ src: thumbs[r.name], alt: '' }} className="bars__thumb" plain width="36" height="36" />}
          <div className="bars__main">
            <div className="bars__row"><span className="bars__name">{r.name}</span><span className="bars__val">{fmtNum(r.tonnes)} {unit} <small>{r.share < 0.005 ? '<1' : Math.round(r.share * 100)}%</small></span></div>
            <span className="bars__track"><span style={{ width: `${Math.max(2, (r.tonnes / max) * 100)}%` }} /></span>
          </div>
        </li>
      ))}
    </ul>
  )
}

const thumbOf = (src) => (src && /^https:\/\/images\.pexels\.com\//.test(src) ? src.replace(/([?&])w=\d+/, '$1w=96') : src)

export default function Record({ content, trade, tone }) {
  const { record: R, statLabels: L, company, products } = content
  if (!trade.byYear.length) return null
  const unit = R.unit || 't'
  const thumbs = Object.fromEntries((products?.items || []).map((p) => [p.title, thumbOf(p.image?.src)]))
  const years = Math.max(1, new Date().getFullYear() - Number(company.since || 0))
  return (
    <section className={`section section--${tone}`} id="record">
      <div className="container">
        <SectionHead eyebrow={R.eyebrow} title={R.title} text={R.text} align="split" />
        {content.sampleData && <p className="sample-note"><Info size={18} weight="duotone" /> These are example figures. Replace them with your own trade records in the admin panel.</p>}
        <div className="kpis reveal">
          <Kpi tone="main" label={L.shipped} value={trade.shipped} unit="tonnes" icon={<Package size={26} weight="duotone" />} />
          <Kpi label={L.exported} value={trade.exported} icon={<ArrowUpRight size={22} weight="bold" />} tone="export" />
          <Kpi label={L.imported} value={trade.imported} icon={<ArrowDownLeft size={22} weight="bold" />} tone="import" />
          <Kpi label={L.orders} value={trade.orders} icon={<TrendUp size={22} weight="duotone" />} />
          <Kpi label={L.countries} value={trade.countries} icon={<Globe size={22} weight="duotone" />} />
        </div>
        <div className="record__grid">
          <div className="card card--chart reveal">
            <div className="card__head">
              <h3>{R.chartTitle}</h3>
              <span className="legend"><span><i className="swatch swatch--export" /> Exported</span><span><i className="swatch swatch--import" /> Imported</span></span>
            </div>
            <YearChart trade={trade} unit={unit} />
          </div>
          <div className="card reveal">
            <div className="card__head"><h3>{R.productsTitle}</h3></div>
            <Breakdown rows={trade.byProduct} unit={unit} thumbs={thumbs} />
          </div>
          <div className="card reveal">
            <div className="card__head"><h3>{R.countriesTitle}</h3></div>
            <Breakdown rows={trade.byCountry} unit={unit} />
          </div>
        </div>
        {trade.latest && <p className="record__updated">Last updated with shipments from {fmtDate(trade.latest)} · <span suppressHydrationWarning>{years}+</span> {L.years?.toLowerCase()}</p>}
      </div>
    </section>
  )
}
