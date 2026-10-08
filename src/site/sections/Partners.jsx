import { ArrowUpRight, Handshake, Info } from '../ph.jsx'
import { useCountUp } from '../hooks.js'
import Photo from '../Photo.jsx'
import { fmtNum, unitFor } from '../trade.js'
import { label } from '../labels.js'

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// Partners with a name, in the order set in the admin panel.
export const livePartners = (content) => (content.partners?.items || []).filter((p) => p.name)

// Whether the partnership is shown in a place ("hero", "home", "shipping", "about", "footer").
export const showPartnerIn = (content, place) => livePartners(content).length > 0 && content.partners?.show?.[place] !== false

// A partner's figures, plus their total when every figure uses the same unit.
export function partnerFigures(p) {
  const stats = (p.stats || []).filter((s) => s.label && num(s.value) > 0)
  const units = new Set(stats.map((s) => String(s.unit || '').trim().toLowerCase()))
  const total = stats.length > 1 && units.size === 1 ? stats.reduce((sum, s) => sum + num(s.value), 0) : 0
  return { stats, total, unit: stats[0]?.unit || '' }
}

// The partner's logo, or a handshake when there is none.
export function PartnerLogo({ p, className = 'partner__logo', iconClass = 'partner__icon', size = 30 }) {
  return p.logo?.src
    ? <img className={className} src={p.logo.src} alt={p.logo.alt || p.name} loading="lazy" />
    : <span className={iconClass}><Handshake size={size} weight="duotone" /></span>
}

function Stat({ value, unit, name, thumb, main, wide, i }) {
  const [ref, shown] = useCountUp(value)
  return (
    <li className={`pstat reveal ${main ? 'pstat--main' : ''} ${wide ? 'pstat--wide' : ''}`} style={{ '--i': i }} ref={ref}>
      {thumb && <Photo image={{ src: thumb, alt: '' }} className="pstat__thumb" plain width="52" height="52" />}
      <span className="pstat__body">
        <strong className="pstat__value" suppressHydrationWarning>{fmtNum(shown)}{unit && <small> {unitFor(value, unit)}</small>}</strong>
        <span className="pstat__label">{name}</span>
      </span>
    </li>
  )
}

// One partner: who they are, and what was shipped together.
function Partner({ content, p, thumbs }) {
  // When every figure uses the same unit, lead with the combined total.
  const { stats, total } = partnerFigures(p)
  return (
    <article className="partner">
      <div className="partner__card reveal">
        <div className="partner__brand">
          <PartnerLogo p={p} />
          <div>
            <h3>{p.name}</h3>
            {p.role && <p className="partner__role">{p.role}</p>}
          </div>
        </div>
        {p.text && <p className="partner__text">{p.text}</p>}
        <div className="partner__meta">
          {p.since && <span className="partner__since">{label(content, 'partnerSince')} {p.since}</span>}
          {p.link && <a className="partner__link" href={p.link} target="_blank" rel="noreferrer">{label(content, 'partnerVisit')} <ArrowUpRight size={15} weight="bold" /></a>}
        </div>
      </div>
      {stats.length > 0 && (
        <ul className={`pstats ${total ? 'pstats--total' : ''}`}>
          {total > 0 && <Stat main value={total} unit={stats[0].unit} name={label(content, 'partnerTotal')} i={0} />}
          {/* An odd figure out at the end spans the row instead of leaving a gap. */}
          {stats.map((s, i) => <Stat key={i} value={num(s.value)} unit={s.unit} name={s.label} thumb={thumbs?.[s.label]} wide={i === stats.length - 1 && i % 2 === 0} i={i + 1} />)}
        </ul>
      )}
    </article>
  )
}

// Partners and the amounts shipped with them, shown inside the track record.
export default function Partners({ content, thumbs }) {
  const c = content.partners || {}
  const items = livePartners(content)
  if (!items.length) return null
  return (
    <div className="partners" id="partners">
      {(c.title || c.text) && (
        <div className="partners__head reveal">
          {c.title && <h3>{c.title}</h3>}
          {c.text && <p>{c.text}</p>}
        </div>
      )}
      {c.example && !content.sampleData && <p className="sample-note"><Info size={18} weight="duotone" /> {label(content, 'partnerSampleNote')}</p>}
      {items.map((p, i) => <Partner key={i} content={content} p={p} thumbs={thumbs} />)}
    </div>
  )
}
