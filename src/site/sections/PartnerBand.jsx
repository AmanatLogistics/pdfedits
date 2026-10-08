import { ArrowRight, Handshake, Info } from '../ph.jsx'
import { Emblem } from '../Logo.jsx'
import Photo from '../Photo.jsx'
import { useCountUp } from '../hooks.js'
import { thumbOf } from '../images.js'
import { fmtNum, unitFor } from '../trade.js'
import { label } from '../labels.js'
import { livePartners, partnerFigures, PartnerLogo } from './Partners.jsx'

function Total({ value, unit, name }) {
  const [ref, shown] = useCountUp(value)
  return (
    <li className="pband__total" ref={ref}>
      <strong suppressHydrationWarning>{fmtNum(shown)}<small> {unitFor(value, unit)}</small></strong>
      <span>{name}</span>
    </li>
  )
}

// The partnership in short, with a link to the full figures on the Track Record page.
// Shown on the home page and, if chosen in the admin panel, on other pages.
export default function PartnerBand({ content, tone = 'gray' }) {
  const p = livePartners(content)[0]
  if (!p) return null
  const B = content.partners?.band || {}
  const { stats, total, unit } = partnerFigures(p)
  const thumbs = Object.fromEntries((content.products?.items || []).map((x) => [x.title, thumbOf(x.image?.src, 96)]))
  const title = B.title || `${label(content, 'partnerWith')}: ${p.name}`
  return (
    <section className={`section section--${tone} pband-section`} id="partnership">
      <div className="container">
        <div className="pband reveal">
          <div className="pband__copy">
            <div className="pband__logos" aria-hidden="true">
              <span className="pband__tile">{content.company?.logo ? <img className="pband__logo" src={content.company.logo} alt="" /> : <Emblem size={46} />}</span>
              <span className="pband__link"><Handshake size={22} weight="duotone" /></span>
              <span className="pband__tile"><PartnerLogo p={p} className="pband__logo" iconClass="pband__icon" size={28} /></span>
            </div>
            {B.eyebrow && <p className="eyebrow pband__eyebrow">{B.eyebrow}</p>}
            <h2>{title}</h2>
            {B.text && <p className="pband__text">{B.text}</p>}
            <p className="pband__meta">
              <strong>{p.name}</strong>
              {p.role && <span>{p.role}</span>}
              {p.since && <span>{label(content, 'partnerSince')} {p.since}</span>}
            </p>
            <a className="btn btn--primary" href="/track-record#partners">{B.button || label(content, 'seeRecord')} <ArrowRight size={17} weight="bold" /></a>
          </div>
          {stats.length > 0 && (
            <div className="pband__figures">
              <ul className="pband__stats">
                {total > 0 && <Total value={total} unit={unit} name={label(content, 'partnerTotal')} />}
                {stats.slice(0, 4).map((s, i) => (
                  <li key={i} className={`pband__stat ${i === Math.min(stats.length, 4) - 1 && i % 2 === 0 ? 'is-wide' : ''}`}>
                    {thumbs[s.label] && <Photo image={{ src: thumbs[s.label], alt: '' }} className="pband__thumb" plain width="40" height="40" />}
                    <span><strong>{fmtNum(s.value)} <small>{unitFor(s.value, s.unit)}</small></strong>{s.label}</span>
                  </li>
                ))}
              </ul>
              {content.partners?.example && <p className="pband__note"><Info size={15} weight="duotone" /> {label(content, 'partnerExampleShort')}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
