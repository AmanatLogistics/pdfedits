import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { fmt } from '../hooks.js'

function niceTop(max) {
  if (max <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(max)))
  return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((v) => v >= max)
}

export default function Performance({ content, tone }) {
  const { performance: perf } = content
  const years = perf.years.filter((y) => y.year !== '' && y.year !== null)
  const [hover, setHover] = useState(null)
  if (!years.length) return null
  const top = niceTop(Math.max(...years.flatMap((y) => [Number(y.imported) || 0, Number(y.exported) || 0])))
  const first = years[0]
  const last = years[years.length - 1]
  const total = (y) => (Number(y.imported) || 0) + (Number(y.exported) || 0)
  const growth = total(first) > 0 ? Math.round((total(last) / total(first) - 1) * 100) : null
  const sum = (k) => years.reduce((s, y) => s + (Number(y[k]) || 0), 0)
  const unit = perf.unit || ''
  const shown = hover ?? years.length - 1

  return (
    <section className={`section section--${tone}`} id="performance">
      <div className="container perf">
        <div className="perf__text reveal">
          {perf.eyebrow && <p className="eyebrow">{perf.eyebrow}</p>}
          <h2>{perf.title}</h2>
          {perf.text && <p>{perf.text}</p>}
          <dl className="perf__kpis">
            <div><dt>Total {perf.importLabel?.toLowerCase()}</dt><dd>{fmt(sum('imported'))} <small>{unit}</small></dd></div>
            <div><dt>Total {perf.exportLabel?.toLowerCase()}</dt><dd>{fmt(sum('exported'))} <small>{unit}</small></dd></div>
            {growth !== null && years.length > 1 && (
              <div className="perf__growth"><dt>Growth {first.year}–{last.year}</dt><dd><TrendingUp size={22} /> {growth > 0 ? '+' : ''}{growth}%</dd></div>
            )}
          </dl>
        </div>
        <figure className="chart-card reveal">
          <figcaption className="chart-card__head">
            <span className="chart-card__title">{perf.chartTitle}{unit && <small> ({unit})</small>}</span>
            <span className="legend">
              <span><i className="swatch swatch--import" /> {perf.importLabel}</span>
              <span><i className="swatch swatch--export" /> {perf.exportLabel}</span>
            </span>
          </figcaption>
          <div className="chart-card__readout" aria-live="polite">
            <strong>{years[shown].year}</strong>
            <span><i className="swatch swatch--import" /> {fmt(years[shown].imported)}</span>
            <span><i className="swatch swatch--export" /> {fmt(years[shown].exported)}</span>
          </div>
          <div className="chart" onMouseLeave={() => setHover(null)}>
            <div className="chart__grid" aria-hidden="true">
              {[1, 0.75, 0.5, 0.25, 0].map((f) => <div key={f}><span>{fmt(Math.round(top * f))}</span></div>)}
            </div>
            <div className="chart__cols">
              {years.map((y, i) => (
                <div key={`${y.year}-${i}`} tabIndex={0} className={`chart__col ${shown === i ? 'is-on' : ''}`}
                  onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                  aria-label={`${y.year}: ${fmt(y.imported)} ${unit} ${perf.importLabel}, ${fmt(y.exported)} ${unit} ${perf.exportLabel}`}>
                  <div className="chart__bars">
                    <span className="chart__bar chart__bar--import" style={{ height: `${((Number(y.imported) || 0) / top) * 100}%` }} />
                    <span className="chart__bar chart__bar--export" style={{ height: `${((Number(y.exported) || 0) / top) * 100}%` }} />
                  </div>
                  <span className="chart__year">{y.year}</span>
                </div>
              ))}
            </div>
          </div>
          <table className="sr-only">
            <caption>{perf.chartTitle} ({unit})</caption>
            <thead><tr><th>Year</th><th>{perf.importLabel}</th><th>{perf.exportLabel}</th></tr></thead>
            <tbody>{years.map((y, i) => <tr key={i}><td>{y.year}</td><td>{y.imported}</td><td>{y.exported}</td></tr>)}</tbody>
          </table>
        </figure>
      </div>
    </section>
  )
}
