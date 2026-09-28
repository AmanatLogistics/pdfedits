import { company, ledger, photos } from '../data/site.js'
import Photo from './Photo.jsx'
import Stamp from './Stamp.jsx'

const fig = (key) => ledger.find((l) => l.key === key)

export default function Hero({ onPartner }) {
  return (
    <section className="hero" id="top">
      <div className="container hero__grid">
        <div className="hero__text">
          <p className="kicker">Import &amp; export house · {company.city}</p>
          <h1>
            Dry fruits and fresh fruits, traded <em>honestly</em> between India and the world.
          </h1>
          <p className="hero__lede">
            {company.name} buys almonds, pistachios, dates and raisins where they grow best and brings them
            to India, and sends India’s mangoes, pomegranates, grapes and cashews to buyers abroad.
          </p>
          <div className="hero__actions">
            <a href="#enquiry" className="button">Send an enquiry</a>
            <button type="button" className="textlink" onClick={onPartner}>Business partnership →</button>
          </div>
          <dl className="hero__figures">
            {['imported', 'exported', 'orders'].map((k) => (
              <div key={k}>
                <dt>{fig(k).label}</dt>
                <dd>{fig(k).value.toLocaleString('en-IN')}<small>{fig(k).unit === 'tonnes' ? ' t' : ''}</small></dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="hero__figure">
          <Photo photo={photos.hero} eager sizes="(max-width: 900px) 100vw, 45vw" />
          <Stamp className="hero__stamp" text="IMPORT · EXPORT · INDIA · WORLDWIDE · " center={[company.since, 'ESTD.']} />
          <figcaption>Pl. I — Dried fruit on a market stall</figcaption>
        </figure>
      </div>
    </section>
  )
}
