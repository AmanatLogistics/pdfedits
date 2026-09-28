import { useEffect, useState } from 'react'
import { PackageCheck, PlaneLanding, PlaneTakeoff, Globe2 } from 'lucide-react'
import { stats, tradeByYear } from '../data/site.js'
import useInView from './useInView.js'
import TradeChart from './TradeChart.jsx'

const ICONS = { imported: PlaneLanding, exported: PlaneTakeoff, orders: PackageCheck, countries: Globe2 }

function Counter({ value, suffix, run }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf
    const start = performance.now()
    const dur = reduced ? 1 : 1800
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, value])
  return <>{n.toLocaleString('en-IN')}{suffix}</>
}

export default function Stats() {
  const [ref, inView] = useInView()
  const totalImported = tradeByYear.reduce((s, d) => s + d.imported, 0)
  const totalExported = tradeByYear.reduce((s, d) => s + d.exported, 0)
  return (
    <section className="section stats" id="stats" ref={ref}>
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Our trade in numbers</p>
          <h2>Volumes that speak for our reliability</h2>
          <p className="section__lead">
            Every tonne we import and export is sourced, graded and delivered to the standard our buyers expect.
          </p>
        </div>
        <div className="stats__grid">
          {stats.map((s) => {
            const Icon = ICONS[s.key] ?? Globe2
            return (
              <div className="stat" key={s.key}>
                <span className={`stat__icon stat__icon--${s.key}`}><Icon size={22} /></span>
                <strong className="stat__value"><Counter value={s.value} suffix={s.suffix} run={inView} /></strong>
                <span className="stat__label">{s.label}</span>
                <span className="stat__note">{s.note}</span>
              </div>
            )
          })}
        </div>
        <div className="chart-card">
          <div className="chart-card__head">
            <div>
              <h3>Imports vs exports by year</h3>
              <p>Tonnes of dry fruits and fresh fruits, {tradeByYear[0].year}–{tradeByYear[tradeByYear.length - 1].year}</p>
            </div>
            <div className="chart-card__totals">
              <span><i className="swatch swatch--import" /> Imported <b>{totalImported.toLocaleString('en-IN')} t</b></span>
              <span><i className="swatch swatch--export" /> Exported <b>{totalExported.toLocaleString('en-IN')} t</b></span>
            </div>
          </div>
          <TradeChart data={tradeByYear} />
        </div>
      </div>
    </section>
  )
}
