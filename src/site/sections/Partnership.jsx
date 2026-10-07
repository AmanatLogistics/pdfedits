import { ArrowRight, Check, Mail } from 'lucide-react'
import Photo from '../Photo.jsx'

export default function Partnership({ content, onPartner }) {
  const { partnership: p, company } = content
  return (
    <section className="partner" id="partnership">
      <Photo image={p.image} className="partner__bg" sizes="100vw" />
      <div className="partner__shade" aria-hidden="true" />
      <div className="container partner__grid">
        <div className="reveal">
          {p.eyebrow && <p className="eyebrow eyebrow--light">{p.eyebrow}</p>}
          <h2>{p.title}</h2>
          {p.text && <p className="partner__text">{p.text}</p>}
          {p.audiences?.length > 0 && (
            <ul className="partner__who">
              {p.audiences.filter(Boolean).map((a, i) => <li key={i}><Check size={16} strokeWidth={3} /> {a}</li>)}
            </ul>
          )}
        </div>
        <div className="partner__card reveal">
          <h3>Start a conversation</h3>
          <p>Tell us about your business and what you are looking for. We reply to every proposal.</p>
          <button type="button" className="btn btn--accent btn--lg btn--block" onClick={onPartner}>{p.button || 'Send a proposal'} <ArrowRight size={18} /></button>
          {company.partnershipEmail && (
            <a className="partner__mail" href={`mailto:${company.partnershipEmail}?subject=${encodeURIComponent(`Business partnership with ${company.name}`)}`}>
              <Mail size={16} /> {company.partnershipEmail}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
