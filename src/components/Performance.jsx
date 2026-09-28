import { useState } from 'react'
import { stats, tradeByYear } from '../data/site.js'

const fmt = (n) => n.toLocaleString('en-IN')

export default function Performance() {
  const [hover, setHover] = useState(null)
  const top = Math.ceil(Math.max(...tradeByYear.flatMap((y) => [y.imported, y.exported])) / 1000) * 1000
  const last = tradeByYear.length - 1
  const first = tradeByYear[0]
  const growth = Math.round(((tradeByYear[last].imported + tradeByYear[last].exported) / (first.imported + first.exported) - 1) * 100)
  const orders = stats.find((s) => s.key === 'orders')

  return (
    <section className="section" id="performance">
      <div className="container performance">
        <div className="performance__text">
          <p className="eyebrow">Trade Performance</p>
          <h2>Steady Growth in Imports and Exports</h2>
          <p>
            Our volumes have grown every year as more buyers trust us with their supply. Here is how much we have
            imported and exported each year, in tonnes.
          </p>
          <dl className="performance__facts">
            <div><dt>Growth since {first.year}</dt><dd>+{growth}%</dd></div>
            <div><dt>Orders completed</dt><dd>{fmt(orders.value)}{orders.suffix}</dd></div>
          </dl>
        </div>
        <div className="chart-panel">
          <div className="chart-panel__head">
            <h3>Annual trade volume (tonnes)</h3>
            <div className="legend">
              <span><i className="swatch swatch--import" /> Imported</span>
              <span><i className="swatch swatch--export" /> Exported</span>
            </div>
          </div>
          <div className="chart" onMouseLeave={() => setHover(null)}>
            <div className="chart__grid" aria-hidden="true">
              {[1, 0.75, 0.5, 0.25, 0].map((f) => <div key={f}><span>{fmt(top * f)}</span></div>)}
            </div>
            <div className="chart__cols">
              {tradeByYear.map((y, i) => (
                <div key={y.year} tabIndex={0} className={`chart__col ${hover === i ? 'is-hover' : ''}`}
                  onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                  aria-label={`${y.year}: ${fmt(y.imported)} tonnes imported, ${fmt(y.exported)} tonnes exported`}>
                  <div className="chart__bars">
                    <span className="chart__bar chart__bar--import" style={{ height: `${(y.imported / top) * 100}%` }}>
                      {(i === last || hover === i) && <em>{fmt(y.imported)}</em>}
                    </span>
                    <span className="chart__bar chart__bar--export" style={{ height: `${(y.exported / top) * 100}%` }}>
                      {(i === last || hover === i) && <em>{fmt(y.exported)}</em>}
                    </span>
                  </div>
                  <span className="chart__year">{y.year}</span>
                </div>
              ))}
            </div>
            <table className="sr-only">
              <caption>Tonnes imported and exported each year</caption>
              <thead><tr><th>Year</th><th>Imported</th><th>Exported</th></tr></thead>
              <tbody>{tradeByYear.map((y) => <tr key={y.year}><td>{y.year}</td><td>{y.imported}</td><td>{y.exported}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
