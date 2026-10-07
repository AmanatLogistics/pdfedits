import { useCallback } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import SectionHead from '../SectionHead.jsx'
import { COUNTRIES } from '../countries.js'
import { LAND_DOTS, MAP_H, MAP_W, project } from '../worldDots.js'

function arcPath([x1, y1], [x2, y2]) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dist = Math.hypot(x2 - x1, y2 - y1)
  // Bow every route upwards so they read as flight/shipping arcs.
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${(my - dist * 0.35).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

function WorldMap({ hub, imports, exports }) {
  const hubPos = COUNTRIES[hub] ? project(...COUNTRIES[hub]) : null
  const points = (list, dir) => list
    .map((r) => ({ ...r, dir, pos: COUNTRIES[r.country] ? project(...COUNTRIES[r.country]) : null }))
    .filter((r) => r.pos)
  const routes = [...points(imports, 'import'), ...points(exports, 'export')]
  return (
    <svg className="worldmap" viewBox={`0 20 ${MAP_W} ${MAP_H - 20}`} role="img"
      aria-label={`Map of trade routes between ${hub} and partner countries`}>
      <defs>
        <marker id="wm-arrow-import" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0L10 5 0 10z" className="worldmap__head--import" />
        </marker>
        <marker id="wm-arrow-export" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0L10 5 0 10z" className="worldmap__head--export" />
        </marker>
      </defs>
      <path d={LAND_DOTS} className="worldmap__land" />
      {hubPos && routes.map((r, i) => (
        <path key={`${r.dir}-${r.country}-${i}`}
          d={r.dir === 'import' ? arcPath(r.pos, hubPos) : arcPath(hubPos, r.pos)}
          className={`worldmap__route worldmap__route--${r.dir}`}
          markerEnd={`url(#wm-arrow-${r.dir})`}
          style={{ animationDelay: `${(i % 6) * -0.6}s` }} />
      ))}
      {routes.map((r, i) => (
        <g key={`p-${r.dir}-${r.country}-${i}`} className={`worldmap__pt worldmap__pt--${r.dir}`}>
          <circle cx={r.pos[0]} cy={r.pos[1]} r="4.5" />
          <title>{`${r.country}: ${r.goods}`}</title>
        </g>
      ))}
      {hubPos && (
        <g className="worldmap__hub">
          <circle cx={hubPos[0]} cy={hubPos[1]} r="16" className="worldmap__pulse" />
          <circle cx={hubPos[0]} cy={hubPos[1]} r="7" />
          <text x={hubPos[0]} y={hubPos[1] + 26} textAnchor="middle">{hub}</text>
        </g>
      )}
    </svg>
  )
}

function RouteList({ title, icon, rows, dir }) {
  return (
    <div className={`routes routes--${dir}`}>
      <h3>{icon} {title}</h3>
      <ul>
        {rows.map((r, i) => (
          <li key={i}><strong>{r.country}</strong><span>{r.goods}</span></li>
        ))}
      </ul>
    </div>
  )
}

export default function Reach({ content }) {
  const { reach } = content
  // On narrow screens the map scrolls sideways; start with the home country centred.
  const centre = useCallback((el) => {
    if (!el || el.scrollWidth <= el.clientWidth || !COUNTRIES[reach.hub]) return
    const [x] = project(...COUNTRIES[reach.hub])
    el.scrollLeft = (x / MAP_W) * el.scrollWidth - el.clientWidth / 2
  }, [reach.hub])
  return (
    <section className="section section--dark" id="reach">
      <div className="container">
        <SectionHead eyebrow={reach.eyebrow} title={reach.title} text={reach.text} light />
        <div className="reach__map reveal">
          <div className="reach__scroll" ref={centre}>
            <WorldMap hub={reach.hub} imports={reach.imports} exports={reach.exports} />
          </div>
          <div className="reach__legend">
            <span><i className="line line--import" /> {reach.importsTitle}</span>
            <span><i className="line line--export" /> {reach.exportsTitle}</span>
          </div>
        </div>
        <div className="reach__lists">
          <RouteList title={reach.importsTitle} icon={<ArrowDownLeft size={20} />} rows={reach.imports} dir="import" />
          <RouteList title={reach.exportsTitle} icon={<ArrowUpRight size={20} />} rows={reach.exports} dir="export" />
        </div>
      </div>
    </section>
  )
}
