import { ArrowUpRight, Handshake, Info } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import { useCountUp } from '../hooks.js'
import { fmtNum } from '../trade.js'
import { label } from '../labels.js'

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

function Stat({ value, unit, name, main, i }) {
  const [ref, shown] = useCountUp(value)
  return (
    <li className={`pstat reveal ${main ? 'pstat--main' : ''}`} style={{ '--i': i }} ref={ref}>
      <strong className="pstat__value" suppressHydrationWarning>{fmtNum(shown)}{unit && <small> {unit}</small>}</strong>
      <span className="pstat__label">{name}</span>
    </li>
  )
}

// One partner: who they are, and what was shipped together.
function Partner({ content, p }) {
  const stats = (p.stats || []).filter((s) => s.label && num(s.value) > 0)
  // When every figure uses the same unit, lead with the combined total.
  const units = new Set(stats.map((s) => String(s.unit || '').trim().toLowerCase()))
  const total = stats.length > 1 && units.size === 1 ? stats.reduce((sum, s) => sum + num(s.value), 0) : 0
  return (
    <article className="partner">
      <div className="partner__card reveal">
        <div className="partner__brand">
          {p.logo?.src
            ? <img className="partner__logo" src={p.logo.src} alt={p.logo.alt || p.name} loading="lazy" />
            : <span className="partner__icon"><Handshake size={30} weight="duotone" /></span>}
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
          {stats.map((s, i) => <Stat key={i} value={num(s.value)} unit={s.unit} name={s.label} i={i + 1} />)}
        </ul>
      )}
    </article>
  )
}

export default function Partners({ content, tone }) {
  const c = content.partners || {}
  const items = (c.items || []).filter((p) => p.name)
  if (!items.length) return null
  return (
    <section className={`section section--${tone}`} id="partners">
      <div className="container">
        <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.text} align="split" />
        {c.example && <p className="sample-note"><Info size={18} weight="duotone" /> {label(content, 'partnerSampleNote')}</p>}
        <div className="partners">
          {items.map((p, i) => <Partner key={i} content={content} p={p} />)}
        </div>
      </div>
    </section>
  )
}
