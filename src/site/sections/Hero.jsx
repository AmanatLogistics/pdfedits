import { ArrowRight, CheckCircle, TrendUp } from '../ph.jsx'
import Photo from '../Photo.jsx'
import { useCountUp } from '../hooks.js'
import { fmtNum, unitFor, unitOf, yearsSince } from '../trade.js'
import { label } from '../labels.js'
import { livePartners, showPartnerIn } from './Partners.jsx'

function Sparkline({ years }) {
  if (years.length < 2) return null
  const totals = years.map((y) => y.exported + y.imported)
  const max = Math.max(...totals) || 1
  const pts = totals.map((t, i) => [(i / (totals.length - 1)) * 100, 34 - (t / max) * 30])
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <svg className="spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,36 ${line} 100,36`} className="spark__area" />
      <polyline points={line} className="spark__line" vector-effect="non-scaling-stroke" />
    </svg>
  )
}

function Big({ value }) {
  const [ref, shown] = useCountUp(value)
  return <strong ref={ref} className="hero-card__big">{fmtNum(shown)}</strong>
}

export default function Hero({ content, trade, contactHref = '#contact', onPartner, next }) {
  const { hero, statLabels: L, company } = content
  // The trend line covers full years only, so the label does too.
  const full = trade.byYear.filter((y) => !y.partial)
  const first = full[0]?.year
  const last = full[full.length - 1]?.year
  const unit = unitOf(content)
  const many = trade.countries > 1
  // Without imports, "exported" would only repeat the total above it.
  const average = trade.orders ? trade.shipped / trade.orders : 0
  const partner = showPartnerIn(content, 'hero') ? livePartners(content)[0] : null
  return (
    <section className="hero" id="top">
      <Photo image={hero.image} eager className="hero__bg" sizes="100vw" />
      <div className="hero__shade" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy">
          {hero.eyebrow && <p className="hero__eyebrow"><span aria-hidden="true" />{hero.eyebrow}</p>}
          <h1>{hero.title}</h1>
          {hero.text && <p className="hero__text">{hero.text}</p>}
          <div className="hero__actions">
            {hero.primaryButton && <a href={contactHref} className="btn btn--accent btn--lg">{hero.primaryButton} <ArrowRight size={18} weight="bold" /></a>}
            {hero.secondaryButton && <button type="button" className="btn btn--ghost btn--lg" onClick={onPartner}>{hero.secondaryButton}</button>}
          </div>
          {hero.trustPoints?.length > 0 && (
            <ul className="hero__trust">
              {hero.trustPoints.filter(Boolean).map((t, i) => <li key={i}><CheckCircle size={20} weight="duotone" /> {t}</li>)}
            </ul>
          )}
          {partner && (
            <a className="hero__partner" href="/track-record#partners">
              {partner.logo?.src && <img src={partner.logo.src} alt="" />}
              <span>{label(content, 'partnerWith')}</span>
              <strong>{partner.name}</strong>
              <ArrowRight size={15} weight="bold" />
            </a>
          )}
        </div>
        {trade.shipped > 0 && (
          <aside className="hero-card" aria-label="Trade record summary">
            <p className="hero-card__label">{hero.cardTitle || `Total shipped since ${company.since}`}</p>
            <div className="hero-card__total"><Big value={trade.shipped} /><span>{unit}</span></div>
            <Sparkline years={full} />
            {first && <p className="hero-card__range">{first === last ? first : `${first} – ${last}`}{trade.growth && trade.growth.pct > 0 && <span><TrendUp size={15} weight="bold" /> +{trade.growth.pct}% in {trade.growth.to}</span>}</p>}
            <dl className="hero-card__stats">
              {trade.imported > 0 ? (
                <>
                  <div><dt>{L.exported}</dt><dd>{fmtNum(trade.exported)}</dd></div>
                  <div><dt>{L.imported}</dt><dd>{fmtNum(trade.imported)}</dd></div>
                </>
              ) : (
                <>
                  <div><dt>{label(content, 'productsTraded')}</dt><dd>{trade.byProduct.length}</dd></div>
                  <div><dt>{label(content, 'averageOrder')}</dt><dd>{fmtNum(average)} <small>{unitFor(average, unit)}</small></dd></div>
                </>
              )}
              <div><dt>{L.orders}</dt><dd>{fmtNum(trade.orders)}</dd></div>
              {many
                ? <div><dt>{L.countries}</dt><dd>{fmtNum(trade.countries)}</dd></div>
                : <div><dt>{L.years}</dt><dd suppressHydrationWarning>{yearsSince(company.since)}+</dd></div>}
            </dl>
            <a href="/track-record" className="hero-card__link">{label(content, 'seeRecord')} <ArrowRight size={15} weight="bold" /></a>
          </aside>
        )}
      </div>
      {next && <a className="hero__scroll" href={`#${next}`} aria-label="Scroll down"><span /></a>}
    </section>
  )
}
