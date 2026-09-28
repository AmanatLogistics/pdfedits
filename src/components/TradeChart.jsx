import { useState } from 'react'

const W = 720
const H = 300
const PAD = { top: 20, right: 12, bottom: 34, left: 52 }

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  return Math.ceil(v / p) * p
}

// Grouped bar chart: imports and exports side by side for each year.
export default function TradeChart({ data }) {
  const [hover, setHover] = useState(null)
  const max = niceMax(Math.max(...data.flatMap((d) => [d.imported, d.exported])))
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const band = innerW / data.length
  const barW = Math.min(34, band * 0.28)
  const y = (v) => PAD.top + innerH - (v / max) * innerH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))
  const last = data.length - 1

  const bar = (x, v, cls) => {
    const top = y(v)
    const h = PAD.top + innerH - top
    const r = Math.min(4, h)
    return (
      <path
        className={cls}
        d={`M${x} ${PAD.top + innerH}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + barW - r}Q${x + barW} ${top} ${x + barW} ${top + r}V${PAD.top + innerH}Z`}
      />
    )
  }

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart of tonnes imported and exported each year">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={PAD.left - 10} y={y(t)} className="chart__tick" textAnchor="end" dominantBaseline="middle">
              {t >= 1000 ? `${t / 1000}k` : t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + band * i + band / 2
          const xi = cx - barW - 1
          const xe = cx + 1
          return (
            <g key={d.year} className={hover === i ? 'is-hover' : ''}>
              <rect x={PAD.left + band * i} y={PAD.top} width={band} height={innerH} className="chart__hit"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
                aria-label={`${d.year}: ${d.imported} tonnes imported, ${d.exported} tonnes exported`} />
              {bar(xi, d.imported, 'chart__bar chart__bar--import')}
              {bar(xe, d.exported, 'chart__bar chart__bar--export')}
              <text x={cx} y={H - 10} textAnchor="middle" className="chart__tick">{d.year}</text>
              {i === last && (
                <>
                  <text x={xi + barW / 2} y={y(d.imported) - 7} textAnchor="middle" className="chart__label">{d.imported.toLocaleString('en-IN')}</text>
                  <text x={xe + barW / 2} y={y(d.exported) - 7} textAnchor="middle" className="chart__label">{d.exported.toLocaleString('en-IN')}</text>
                </>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="chart__tip" style={{ left: `${((PAD.left + band * hover + band / 2) / W) * 100}%` }}>
          <strong>{data[hover].year}</strong>
          <span><i className="swatch swatch--import" /> Imported <b>{data[hover].imported.toLocaleString('en-IN')} t</b></span>
          <span><i className="swatch swatch--export" /> Exported <b>{data[hover].exported.toLocaleString('en-IN')} t</b></span>
        </div>
      )}
      <table className="sr-only">
        <caption>Tonnes imported and exported per year</caption>
        <thead><tr><th>Year</th><th>Imported</th><th>Exported</th></tr></thead>
        <tbody>
          {data.map((d) => <tr key={d.year}><td>{d.year}</td><td>{d.imported}</td><td>{d.exported}</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}
