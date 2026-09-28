import { useEffect, useState } from 'react'
import { stats, tradeByYear } from '../data/site.js'
import useInView from './useInView.js'

const fmt = (n) => n.toLocaleString('en-IN')

function CountUp({ value, run }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const dur = reduced ? 1 : 1600
    const start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, value])
  return fmt(n)
}

function YearChart() {
  const [hover, setHover] = useState(null)
  const max = Math.max(...tradeByYear.flatMap((y) => [y.imported, y.exported]))
  const top = Math.ceil(max / 1000) * 1000
  const last = tradeByYear.length - 1
  return (
    <div className="chart" onMouseLeave={() => setHover(null)}>
      <div className="chart__grid" aria-hidden="true">
        {[1, 0.75, 0.5, 0.25, 0].map((f) => (
          <div key={f}><span>{fmt(top * f)}</span></div>
        ))}
      </div>
      <div className="chart__cols">
        {tradeByYear.map((y, i) => (
          <div className={`chart__col ${hover === i ? 'is-hover' : ''}`} key={y.year}
            onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
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
  )
}

export default function Numbers() {
  const [ref, inView] = useInView()
  return (
    <section className="section numbers" id="numbers" ref={ref}>
      <div className="container">
        <div className="heading">
          <span className="tag tag--gold">📊 Our numbers</span>
          <h2>Trusted by buyers, proven by numbers</h2>
          <p>Every tonne we move is sourced, graded and delivered the way our customers expect.</p>
        </div>
        <div className="stat-cards">
          {stats.map((s) => (
            <div className={`stat-card stat-card--${s.tone}`} key={s.key}>
              <span className="stat-card__emoji" aria-hidden="true">{s.emoji}</span>
              <strong><CountUp value={s.value} run={inView} />{s.suffix}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="chart-card">
          <div className="chart-card__head">
            <h3>Imports vs exports, year by year</h3>
            <div className="legend">
              <span><i className="dot dot--import" /> Imported</span>
              <span><i className="dot dot--export" /> Exported</span>
              <span className="legend__unit">in tonnes</span>
            </div>
          </div>
          <YearChart />
        </div>
      </div>
    </section>
  )
}
