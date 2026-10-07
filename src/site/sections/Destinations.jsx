import { useCallback } from 'preact/hooks'
import SectionHead from '../SectionHead.jsx'
import { COUNTRIES } from '../countries.js'
import { MAP_H, MAP_W, project } from '../map.js'
import { TRANSPORT } from '../icons.jsx'
import { fmtNum, unitOf } from '../trade.js'

// Crop the world map to the area the routes cover, keeping a wide shape.
function frame(points) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  let w = Math.max(x1 - x0, 160)
  let h = Math.max(y1 - y0, 60)
  w *= 1.5
  h *= 1.7
  if (w / h < 2) w = h * 2
  else h = w / 2
  w = Math.min(w, MAP_W)
  h = Math.min(h, MAP_H)
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const x = Math.min(Math.max(cx - w / 2, 0), MAP_W - w)
  const y = Math.min(Math.max(cy - h / 2, 0), MAP_H - h)
  return { x, y, w, h }
}

function arc([x1, y1], [x2, y2], bow) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const d = Math.hypot(dx, dy) || 1
  const k = d * 0.28 * bow
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${(mx + (dy / d) * k).toFixed(1)} ${(my - (dx / d) * k).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

function RouteMap({ hubName, countries, unit }) {
  const hubLL = COUNTRIES[hubName]
  if (!hubLL) return null
  const hub = project(...hubLL)
  const pts = countries.filter((c) => COUNTRIES[c.name] && c.name !== hubName).map((c) => ({ ...c, pos: project(...COUNTRIES[c.name]) }))
  const vb = frame([hub, ...pts.map((p) => p.pos)])
  const k = vb.w / 1000 // keeps lines and text the same visual size however far the map is zoomed
  const max = Math.max(...pts.map((p) => p.tonnes), 1)
  // Put each label on the side facing away from the hub, and skip any that
  // would overlap the hub or a bigger destination's label.
  const box = (cx, cy, w, h, anchor) => {
    const x0 = anchor === 'start' ? cx : anchor === 'end' ? cx - w : cx - w / 2
    return [x0, cy - h / 2, x0 + w, cy + h / 2]
  }
  const hit = (a, b) => !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3])
  const taken = [box(hub[0], hub[1] + 30 * k, hubName.length * 13 * k + 24 * k, 38 * k, 'middle')]
  const labels = []
  for (const p of pts) {
    const dx = p.pos[0] - hub[0]
    const dy = p.pos[1] - hub[1]
    const side = Math.abs(dx) >= Math.abs(dy) * 0.8
    const anchor = side ? (dx > 0 ? 'start' : 'end') : 'middle'
    const x = side ? p.pos[0] + (dx > 0 ? 14 : -14) * k : p.pos[0]
    const y = side ? p.pos[1] : p.pos[1] + (dy < 0 ? -28 : 30) * k
    const w = Math.max(p.name.length * 10.5, 80) * k
    const b = box(x, y, w, 42 * k, anchor)
    if (taken.some((t) => hit(b, t))) continue
    taken.push(b)
    labels.push({ ...p, anchor, x, y })
    if (labels.length === 8) break
  }
  return (
    <svg className="rmap" viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`} role="img"
      aria-label={`Map of trade routes from ${hubName}`}>
      <image href="/world-dots.svg" x="0" y="0" width={MAP_W} height={MAP_H} />
      {pts.flatMap((p) => {
        const both = p.exported > 0 && p.imported > 0
        const w = (1.2 + 4.5 * Math.sqrt(p.tonnes / max)) * k
        const out = arc(hub, p.pos, 1)
        return [
          p.exported > 0 && <path key={`e-${p.name}`} d={out} pathLength="1" className="rmap__route rmap__route--export" style={{ strokeWidth: w }} />,
          // A small "shipment" travelling along each export route.
          p.exported > 0 && (
            <circle key={`m-${p.name}`} r={Math.max(2.4 * k, w * 0.75)} className="rmap__mover">
              <animateMotion dur="2.8s" repeatCount="indefinite" path={out} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".45 0 .55 1" />
            </circle>
          ),
          p.imported > 0 && <path key={`i-${p.name}`} d={arc(p.pos, hub, both ? 1 : -1)} className="rmap__route rmap__route--import" style={{ strokeWidth: Math.max(1.2 * k, w * 0.7) }} />,
        ]
      })}
      {pts.map((p) => (
        <circle key={`c-${p.name}`} cx={p.pos[0]} cy={p.pos[1]} r={(3 + 4 * Math.sqrt(p.tonnes / max)) * k} className="rmap__pt">
          <title>{`${p.name}: ${fmtNum(p.tonnes)} ${unit}`}</title>
        </circle>
      ))}
      {labels.map((p) => (
        <g key={`l-${p.name}`} className="rmap__label" textAnchor={p.anchor} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
          <text fontSize={18 * k} y={-3 * k}>{p.name}</text>
          <text fontSize={16 * k} y={16 * k} className="rmap__tonnes">{fmtNum(p.tonnes)} {unit}</text>
        </g>
      ))}
      <g className="rmap__hub">
        <circle cx={hub[0]} cy={hub[1]} r={18 * k} className="rmap__pulse" />
        <circle cx={hub[0]} cy={hub[1]} r={8 * k} />
        <text x={hub[0]} y={hub[1] + 34 * k} fontSize={18 * k}>{hubName}</text>
      </g>
    </svg>
  )
}

export default function Destinations({ content, trade, more }) {
  const { destinations: D } = content
  const unit = unitOf(content)
  const hubLL = COUNTRIES[D.hub]
  // On phones the map is wider than the screen: start it scrolled to the hub.
  const centre = useCallback((el) => {
    if (!el || el.scrollWidth <= el.clientWidth) return
    const dot = el.querySelector('.rmap__hub circle')?.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    el.scrollLeft = dot ? dot.left + dot.width / 2 - box.left - box.width / 2 : (el.scrollWidth - el.clientWidth) / 2
  }, [])
  // Several destinations: rank them. One destination: show how the goods travelled.
  const many = trade.countries > 1
  const rows = many
    ? trade.byCountry.slice(0, 6).map((c) => ({ key: c.name, name: c.name, tonnes: c.tonnes }))
    : trade.byTransport.map((t) => ({ key: t.name, name: `${TRANSPORT[t.name]?.label || t.name} freight`, tonnes: t.tonnes, Icon: TRANSPORT[t.name]?.C }))
  const max = rows[0]?.tonnes || 1
  const showMap = hubLL && trade.byCountry.length > 0
  return (
    <section className="section section--dark" id="destinations">
      <div className="container">
        <SectionHead eyebrow={D.eyebrow} title={D.title} text={D.text} align="split" light more={more} />
        {showMap && (
          <div className="dest">
            <div className="dest__map reveal">
              <div className="dest__scroll" ref={centre}>
                <RouteMap hubName={D.hub} countries={trade.byCountry} unit={unit} />
              </div>
              <div className="dest__legend">
                <span><i className="line line--export" /> Exports from {D.hub}</span>
                {trade.imported > 0 && <span><i className="line line--import" /> Imports to {D.hub}</span>}
              </div>
            </div>
            <div className="dest__side reveal">
              <h3>{many ? 'Top destinations' : 'How it travelled'}</h3>
              <ol className="dest__top">
                {rows.map((r, i) => (
                  <li key={r.key} style={{ '--i': i }}>
                    <span className="dest__rank">{r.Icon ? <r.Icon size={18} weight="duotone" /> : i + 1}</span>
                    <div>
                      <div className="dest__row"><strong>{r.name}</strong><span>{fmtNum(r.tonnes)} {unit}</span></div>
                      <span className="dest__track"><span style={{ width: `${(r.tonnes / max) * 100}%` }} /></span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
        {D.routes?.length > 0 && (
          <div className="modes">
            {D.routes.map((r, i) => {
              const T = TRANSPORT[r.icon] ?? TRANSPORT.road
              return (
                <div className="mode reveal" style={{ '--i': i }} key={i}>
                  <span className="mode__icon"><T.C size={26} weight="duotone" /></span>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
