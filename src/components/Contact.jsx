import { useState } from 'react'
import { Clock, Handshake, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { company } from '../data/site.js'

const TYPES = [
  { id: 'general', label: 'General inquiry' },
  { id: 'order', label: 'Price quote / order' },
  { id: 'import', label: 'Import to India' },
  { id: 'export', label: 'Export from India' },
  { id: 'partnership', label: 'Business partnership' },
]

const EMPTY = { name: '', company: '', email: '', phone: '', country: '', goods: '', message: '' }

// No server needed: submitting opens the visitor's email app with the message
// written out and addressed to the inquiry or partnership inbox.
export default function Contact({ type, setType }) {
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isPartner = type === 'partnership'
  const to = isPartner ? company.partnershipEmail : company.email
  const typeLabel = TYPES.find((t) => t.id === type)?.label ?? 'Inquiry'

  const submit = (e) => {
    e.preventDefault()
    const subject = `${typeLabel} – ${form.name}${form.company ? `, ${form.company}` : ''}`
    const details = [`Inquiry type: ${typeLabel}`, form.goods && `Products & quantity: ${form.goods}`].filter(Boolean)
    const signature = [form.name, form.company, form.email, form.phone, form.country].filter(Boolean)
    const body = [details.join('\n'), form.message, `—\n${signature.join('\n')}`].join('\n\n')
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <section className="section section--gray" id="contact">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Contact Us</p>
          <h2>Request a Quote or Get in Touch</h2>
          <p>Tell us what you need and our team will reply within one working day.</p>
        </div>
        <div className="contact">
          <aside className="contact__info">
            <div className="contact__block">
              <Mail size={22} />
              <div>
                <h3>Orders &amp; Inquiries</h3>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </div>
            </div>
            <div className="contact__block">
              <Handshake size={22} />
              <div>
                <h3>Business Partnerships</h3>
                <a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a>
              </div>
            </div>
            <div className="contact__block">
              <Phone size={22} />
              <div>
                <h3>Phone</h3>
                <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
              </div>
            </div>
            <div className="contact__block">
              <MessageCircle size={22} />
              <div>
                <h3>WhatsApp</h3>
                <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer">Chat with us</a>
              </div>
            </div>
            <div className="contact__block">
              <MapPin size={22} />
              <div>
                <h3>Office</h3>
                <span>{company.city}</span>
              </div>
            </div>
            <div className="contact__block">
              <Clock size={22} />
              <div>
                <h3>Business Hours</h3>
                <span>{company.hours}</span>
              </div>
            </div>
          </aside>

          <form className="form" onSubmit={submit}>
            <div className="form__grid">
              <label className="form__full">Inquiry type
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <label>Full name *<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
              <label>Company<input value={form.company} onChange={set('company')} autoComplete="organization" /></label>
              <label>Email *<input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
              <label>Phone / WhatsApp<input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
              <label>Products &amp; quantity<input value={form.goods} onChange={set('goods')} placeholder="e.g. Almonds, 5 tonnes" /></label>
              <label>Country<input value={form.country} onChange={set('country')} autoComplete="country-name" /></label>
              <label className="form__full">Message *
                <textarea required rows={5} value={form.message} onChange={set('message')}
                  placeholder={isPartner ? 'Tell us about your business and the partnership you are proposing.' : 'Grade, packing, delivery port and timeline.'} />
              </label>
            </div>
            <div className="form__foot">
              <button type="submit" className="btn btn--primary btn--lg">{isPartner ? 'Send Proposal' : 'Send Inquiry'}</button>
              <p role="status">
                {sent
                  ? <>Your email app should now be open with the message ready to send. If not, email <a href={`mailto:${to}`}>{to}</a>.</>
                  : <>Your message will be sent to <strong>{to}</strong>.</>}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
