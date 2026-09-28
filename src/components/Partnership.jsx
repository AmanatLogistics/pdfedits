import { Mail } from 'lucide-react'
import { company, photos } from '../data/site.js'
import Photo from './Photo.jsx'

export default function Partnership({ onPartner }) {
  return (
    <section className="partnership" id="partnership">
      <Photo photo={photos.truck} className="partnership__bg" sizes="100vw" />
      <div className="partnership__overlay" aria-hidden="true" />
      <div className="container partnership__content">
        <div>
          <p className="eyebrow">Business Partnership</p>
          <h2>Partner With {company.name}</h2>
          <p>
            We are looking for distributors, wholesalers, retail chains, food manufacturers and overseas importers
            for long-term supply partnerships, bulk contracts and private-label packing.
          </p>
        </div>
        <div className="partnership__actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onPartner}>Send a Partnership Proposal</button>
          <a href={`mailto:${company.partnershipEmail}?subject=${encodeURIComponent(`Business partnership with ${company.name}`)}`} className="partnership__mail">
            <Mail size={18} /> {company.partnershipEmail}
          </a>
        </div>
      </div>
    </section>
  )
}
