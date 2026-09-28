import { ArrowRight, Handshake, ShieldCheck, Ship } from 'lucide-react'
import { company, stats } from '../data/site.js'
import { HeroBowl } from './FruitArt.jsx'

const fmt = (n) => n.toLocaleString('en-IN')

export default function Hero({ onPartner }) {
  const imported = stats.find((s) => s.key === 'imported')
  const orders = stats.find((s) => s.key === 'orders')
  return (
    <section className="hero" id="top">
      <div className="hero__pattern" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--light">Trusted fruit traders since {company.since}</p>
          <h1>
            Premium <em>dry fruits</em> &amp; fresh fruits, traded across borders.
          </h1>
          <p className="hero__lead">
            {company.name} imports and exports the finest almonds, cashews, pistachios, dates,
            mangoes, pomegranates and more — connecting growers and buyers in India and across the world.
          </p>
          <div className="hero__cta">
            <a href="#contact" className="btn btn--gold">
              Send an Inquiry <ArrowRight size={18} />
            </a>
            <button type="button" className="btn btn--ghost" onClick={onPartner}>
              <Handshake size={18} /> Become a Partner
            </button>
          </div>
          <ul className="hero__trust">
            <li><ShieldCheck size={18} /> Graded &amp; quality checked</li>
            <li><Ship size={18} /> Sea, air &amp; road freight</li>
          </ul>
        </div>
        <div className="hero__art">
          <div className="hero__glow" aria-hidden="true" />
          <HeroBowl className="hero__bowl" />
          <div className="hero__badge hero__badge--a">
            <strong>{fmt(imported.value)}{imported.suffix}</strong>
            <span>tonnes imported</span>
          </div>
          <div className="hero__badge hero__badge--b">
            <strong>{fmt(orders.value)}{orders.suffix}</strong>
            <span>orders completed</span>
          </div>
        </div>
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              Almonds ✦ Cashews ✦ Pistachios ✦ Walnuts ✦ Raisins ✦ Dates ✦ Apricots ✦ Figs ✦ Mangoes ✦
              Pomegranates ✦ Apples ✦ Grapes ✦ Kinnow ✦ Bananas ✦&nbsp;
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
