import { company, plates } from '../data/site.js'
import Photo from './Photo.jsx'

const byName = (n) => plates.find((p) => p.name === n)

export default function Hero({ onPartner }) {
  return (
    <section className="hero" id="top">
      <div className="container hero__grid">
        <div className="hero__text">
          <span className="tag">🌍 Import &amp; export since {company.since}</span>
          <h1>
            Fresh fruits &amp; dry fruits, <span className="hl">delivered worldwide</span>
          </h1>
          <p className="hero__lede">
            {company.name} brings the world’s best almonds, pistachios, dates and raisins to India, and takes India’s
            mangoes, pomegranates, grapes and cashews to buyers across the globe.
          </p>
          <div className="hero__actions">
            <a href="#contact" className="pill pill--brown pill--lg">Send inquiry</a>
            <button type="button" className="pill pill--outline pill--lg" onClick={onPartner}>Partner with us</button>
          </div>
          <ul className="hero__chips" aria-label="Some of what we trade">
            <li className="chip chip--mango">🥭 Mangoes</li>
            <li className="chip chip--berry">🍎 Apples</li>
            <li className="chip chip--pistachio">🥜 Nuts</li>
            <li className="chip chip--sky">🍇 Grapes</li>
          </ul>
        </div>
        <div className="hero__art">
          <div className="hero__blob" aria-hidden="true" />
          <Photo photo={byName('Mangoes')} eager className="hero__main" sizes="(max-width: 900px) 80vw, 480px" />
          <Photo photo={byName('Almonds')} eager className="hero__small hero__small--a" sizes="200px" />
          <Photo photo={byName('Pomegranates')} eager className="hero__small hero__small--b" sizes="200px" />
          <span className="sticker sticker--a">🌰 Premium dry fruits</span>
          <span className="sticker sticker--b">🍊 Fresh every season</span>
        </div>
      </div>
    </section>
  )
}
