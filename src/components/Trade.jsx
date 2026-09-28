import { countries } from '../data/site.js'

// Hub-and-spoke picture with India in the middle and trade partners around it.
function RouteMap({ partners }) {
  const cx = 260
  const cy = 210
  const R = 165
  return (
    <svg viewBox="0 0 520 420" className="routes" role="img" aria-label="Trade routes between India and our partner countries">
      <defs>
        <marker id="arr-imp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5 0 10Z" fill="#2b6f9e" />
        </marker>
        <marker id="arr-exp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5 0 10Z" fill="#b8741a" />
        </marker>
      </defs>
      <circle cx={cx} cy={cy} r={R} className="routes__ring" />
      <circle cx={cx} cy={cy} r={R * 0.55} className="routes__ring" />
      {partners.map((c, i) => {
        const a = (i / partners.length) * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(a) * R
        const y = cy + Math.sin(a) * R
        const nx = -Math.sin(a) * 6
        const ny = Math.cos(a) * 6
        const hub = 44
        const hx = cx + Math.cos(a) * hub
        const hy = cy + Math.sin(a) * hub
        const ox = x - Math.cos(a) * 12
        const oy = y - Math.sin(a) * 12
        const imp = c.flows.includes('Import')
        const exp = c.flows.includes('Export')
        const labelRight = Math.cos(a) > 0.2
        const labelLeft = Math.cos(a) < -0.2
        return (
          <g key={c.name}>
            {imp && <line x1={ox + nx} y1={oy + ny} x2={hx + nx} y2={hy + ny} className="routes__line routes__line--imp" markerEnd="url(#arr-imp)" />}
            {exp && <line x1={hx - nx} y1={hy - ny} x2={ox - nx} y2={oy - ny} className="routes__line routes__line--exp" markerEnd="url(#arr-exp)" />}
            <circle cx={x} cy={y} r="7" className="routes__dot" />
            <text
              x={x + (labelRight ? 14 : labelLeft ? -14 : 0)}
              y={y + (labelRight || labelLeft ? 0 : Math.sin(a) > 0 ? 24 : -16)}
              textAnchor={labelRight ? 'start' : labelLeft ? 'end' : 'middle'}
              dominantBaseline="middle"
              className="routes__label"
            >
              {c.name}
            </text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r="40" className="routes__hub" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" className="routes__hub-label">INDIA</text>
    </svg>
  )
}

export default function Trade() {
  const primary = countries.find((c) => c.primary)
  const partners = countries.filter((c) => !c.primary)
  const onMap = partners.slice(0, 10)
  return (
    <section className="section trade" id="trade">
      <div className="container trade__grid">
        <div>
          <p className="eyebrow eyebrow--light">Where we trade</p>
          <h2>India at the heart of our trade</h2>
          <p className="section__lead">
            Most of our business flows to and from {primary?.name ?? 'India'}. We import premium nuts and dried fruits from
            Afghanistan, Iran, the Gulf, Turkey and the Americas, and export Indian fresh fruits and cashews to the Gulf,
            South Asia, South-East Asia and Europe.
          </p>
          <div className="legend">
            <span><i className="swatch swatch--import" /> Import into India</span>
            <span><i className="swatch swatch--export" /> Export from India</span>
          </div>
        </div>
        <RouteMap partners={onMap} />
      </div>
      <div className="container">
        <ul className="countries">
          {partners.map((c) => (
            <li key={c.name}>
              <span>{c.name}</span>
              <span className="countries__flows">
                {c.flows.map((f) => <em key={f} className={`flow flow--${f.toLowerCase()}`}>{f}</em>)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
