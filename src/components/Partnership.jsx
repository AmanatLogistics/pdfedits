import { Building2, Handshake, Mail, Store, Factory, Warehouse } from 'lucide-react'
import { company } from '../data/site.js'

const WHO = [
  { icon: Warehouse, label: 'Wholesalers & distributors' },
  { icon: Store, label: 'Retailers & supermarkets' },
  { icon: Factory, label: 'Food & sweet manufacturers' },
  { icon: Building2, label: 'Importers & exporters abroad' },
]

export default function Partnership({ onPartner }) {
  return (
    <section className="section partnership" id="partnership">
      <div className="container partnership__card">
        <div>
          <p className="eyebrow eyebrow--light">Business partnership</p>
          <h2>Let’s grow together</h2>
          <p className="section__lead">
            Looking for a dependable supplier or buyer for dry fruits and fresh fruits? We welcome long-term
            partnerships, distributorships, private-label packing and bulk supply contracts.
          </p>
          <div className="partnership__cta">
            <button type="button" className="btn btn--gold" onClick={onPartner}>
              <Handshake size={18} /> Propose a partnership
            </button>
            <a className="btn btn--ghost" href={`mailto:${company.partnershipEmail}?subject=${encodeURIComponent(`Business partnership with ${company.name}`)}`}>
              <Mail size={18} /> {company.partnershipEmail}
            </a>
          </div>
        </div>
        <ul className="who">
          {WHO.map(({ icon: Icon, label }) => (
            <li key={label}><Icon size={22} /> {label}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
