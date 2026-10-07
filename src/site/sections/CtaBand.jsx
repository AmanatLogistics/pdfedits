import { ArrowRight, WhatsappLogo } from '../ph.jsx'
import { waHref } from '../hooks.js'

// A closing call to action at the bottom of each page.
export default function CtaBand({ content, contactHref }) {
  const { cta = {}, company, whatsappButton, hero } = content
  if (!contactHref) return null
  return (
    <section className="cta-band" id="cta">
      <div className="container cta-band__inner reveal">
        <div>
          <h2>{cta.title || 'Ready to place an order?'}</h2>
          {cta.text && <p>{cta.text}</p>}
        </div>
        <div className="cta-band__actions">
          <a href={contactHref} className="btn btn--accent btn--lg">{cta.button || hero.primaryButton || 'Request a Quote'} <ArrowRight size={18} weight="bold" /></a>
          {company.whatsapp && (
            <a href={waHref(company.whatsapp, whatsappButton?.message)} className="btn btn--ghost btn--lg" target="_blank" rel="noreferrer">
              <WhatsappLogo size={20} weight="fill" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
