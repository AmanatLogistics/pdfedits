import { company, photos } from '../data/site.js'
import Photo from './Photo.jsx'

const WHO = ['🏬 Wholesalers & distributors', '🛒 Supermarkets & shops', '🍬 Sweet makers & food companies', '🌐 Importers & exporters abroad']

export default function Partner({ onPartner }) {
  return (
    <section className="section partner" id="partner">
      <div className="container">
        <div className="partner__card">
          <div className="partner__text">
            <span className="tag tag--onbrown">🤝 Business partnership</span>
            <h2>Let’s grow together</h2>
            <p>
              Looking for a reliable supplier or buyer of dry fruits and fresh fruits? We welcome long-term partners,
              distributors, bulk contracts and private-label packing.
            </p>
            <ul className="partner__who">
              {WHO.map((w) => <li key={w}>{w}</li>)}
            </ul>
            <div className="partner__actions">
              <button type="button" className="pill pill--gold pill--lg" onClick={onPartner}>Become a partner</button>
              <a className="partner__mail" href={`mailto:${company.partnershipEmail}?subject=${encodeURIComponent(`Business partnership with ${company.name}`)}`}>
                ✉️ {company.partnershipEmail}
              </a>
            </div>
          </div>
          <Photo photo={photos.hero} className="partner__photo" sizes="(max-width: 900px) 80vw, 420px" />
        </div>
      </div>
    </section>
  )
}
