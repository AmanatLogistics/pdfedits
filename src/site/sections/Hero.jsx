import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Photo from '../Photo.jsx'
import { useCountUp, fmt } from '../hooks.js'

function Stat({ stat }) {
  const [ref, shown] = useCountUp(Number(stat.value) || 0)
  return (
    <div className="hero-stat" ref={ref}>
      <strong>{fmt(shown)}{stat.suffix}</strong>
      <span>{stat.label}</span>
    </div>
  )
}

export default function Hero({ content, onPartner }) {
  const { hero, stats } = content
  return (
    <section className="hero" id="top">
      <Photo image={hero.image} eager className="hero__bg" sizes="100vw" />
      <div className="hero__shade" aria-hidden="true" />
      <div className="container hero__content">
        {hero.eyebrow && <p className="hero__eyebrow"><span aria-hidden="true" />{hero.eyebrow}</p>}
        <h1>{hero.title}</h1>
        {hero.text && <p className="hero__text">{hero.text}</p>}
        <div className="hero__actions">
          {hero.primaryButton && <a href="#contact" className="btn btn--accent btn--lg">{hero.primaryButton} <ArrowRight size={18} /></a>}
          {hero.secondaryButton && <button type="button" className="btn btn--ghost btn--lg" onClick={onPartner}>{hero.secondaryButton}</button>}
        </div>
        {hero.trustPoints?.length > 0 && (
          <ul className="hero__trust">
            {hero.trustPoints.filter(Boolean).map((t, i) => <li key={i}><CheckCircle2 size={18} /> {t}</li>)}
          </ul>
        )}
      </div>
      {hero.showStats && stats?.length > 0 && (
        <div className="container hero__stats-wrap">
          <div className="hero__stats" style={{ '--cols': Math.min(stats.length, 4) }}>
            {stats.map((s, i) => <Stat key={i} stat={s} />)}
          </div>
        </div>
      )}
    </section>
  )
}
