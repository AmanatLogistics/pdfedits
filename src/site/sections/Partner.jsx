import { ArrowUpRight, CheckCircle, Plus } from '../ph.jsx'
import { Emblem } from '../Logo.jsx'
import { label } from '../labels.js'

// The logistics partnership: both companies' logos, what was shipped
// together, and what the partner handles.
export default function Partner({ content, tone = 'white' }) {
  const P = content.partner
  if (!P?.name) return null
  const stats = (P.stats || []).filter((s) => s.value)
  const points = (P.points || []).filter(Boolean)
  const safeColor = /^#[0-9a-f]{3,8}$/i.test(P.color || '') ? P.color : '#7e2e47'
  return (
    <section className={`section section--${tone}`} id="partner">
      <div className="container">
        <div className="partner reveal" style={{ '--partner': safeColor }}>
          <div className="partner__brand">
            <div className="partner__logos">
              <span className="partner__us"><Emblem size={58} /><strong>{content.company?.name}</strong></span>
              <span className="partner__x" aria-hidden="true"><Plus size={20} weight="bold" /></span>
              {P.logo
                ? <img className="partner__logo" src={P.logo} alt={P.name} width="220" height="212" loading="lazy" />
                : <strong className="partner__name">{P.name}</strong>}
            </div>
            {stats.length > 0 && (
              <dl className="partner__stats" style={{ '--n': Math.min(stats.length, 3) }}>
                {stats.map((s, i) => <div key={i}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
              </dl>
            )}
          </div>
          <div className="partner__text">
            {P.eyebrow && <p className="eyebrow">{P.eyebrow}</p>}
            {P.title && <h2>{P.title}</h2>}
            {P.text && <p className="partner__lead">{P.text}</p>}
            {points.length > 0 && (
              <ul className="partner__points">
                {points.map((t, i) => <li key={i}><CheckCircle size={20} weight="duotone" /> {t}</li>)}
              </ul>
            )}
            {P.link && (
              <a className="btn btn--primary partner__link" href={P.link} target="_blank" rel="noreferrer">
                {label(content, 'partnerVisit')} {P.name} <ArrowUpRight size={16} weight="bold" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
