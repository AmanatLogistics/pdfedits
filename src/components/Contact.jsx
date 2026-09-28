import { useState } from 'react'
import { company } from '../data/site.js'

const TYPES = [
  { id: 'general', label: 'General inquiry' },
  { id: 'order', label: 'Prices & orders' },
  { id: 'import', label: 'Import to India' },
  { id: 'export', label: 'Export from India' },
  { id: 'partnership', label: 'Business partnership' },
]

const EMPTY = { name: '', company: '', email: '', phone: '', country: '', goods: '', message: '' }

// No server needed: sending opens the visitor's email app with the message
// ready, addressed to the inquiry or partnership inbox.
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
    const details = [`Inquiry: ${typeLabel}`, form.goods && `Products & quantity: ${form.goods}`].filter(Boolean)
    const signature = [form.name, form.company, form.email, form.phone, form.country].filter(Boolean)
    const body = [details.join('\n'), form.message, `—\n${signature.join('\n')}`].join('\n\n')
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <section className="section contact" id="contact">
      <div className="container">
        <div className="heading">
          <span className="tag tag--mango">💬 Contact us</span>
          <h2>Let’s talk business</h2>
          <p>Ask for prices, samples or a shipping quote. We reply within one working day.</p>
        </div>
        <div className="contact__grid">
          <div className="contact__cards">
            <a className="mail-card mail-card--mango" href={`mailto:${company.email}`}>
              <span className="mail-card__emoji" aria-hidden="true">📩</span>
              <span className="mail-card__title">Orders &amp; inquiries</span>
              <span className="mail-card__addr">{company.email}</span>
            </a>
            <a className="mail-card mail-card--brown" href={`mailto:${company.partnershipEmail}`}>
              <span className="mail-card__emoji" aria-hidden="true">🤝</span>
              <span className="mail-card__title">Business partnership</span>
              <span className="mail-card__addr">{company.partnershipEmail}</span>
            </a>
            <div className="contact__extra">
              <a href={`tel:${company.phone.replace(/\s/g, '')}`}>📞 {company.phone}</a>
              <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer">💚 Chat on WhatsApp</a>
              <span>📍 {company.city}</span>
              <span>🕘 {company.hours}</span>
            </div>
          </div>

          <form className="form" onSubmit={submit}>
            <div className="form__types" role="radiogroup" aria-label="What is this about?">
              {TYPES.map((t) => (
                <button type="button" role="radio" aria-checked={type === t.id} key={t.id}
                  className={`type-pill ${type === t.id ? 'is-active' : ''}`} onClick={() => setType(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="form__row">
              <label>Your name *<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
              <label>Company<input value={form.company} onChange={set('company')} autoComplete="organization" /></label>
            </div>
            <div className="form__row">
              <label>Email *<input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
              <label>Phone / WhatsApp<input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
            </div>
            <div className="form__row">
              <label>Products &amp; quantity<input value={form.goods} onChange={set('goods')} placeholder="e.g. 5 tonnes almonds" /></label>
              <label>Country<input value={form.country} onChange={set('country')} autoComplete="country-name" /></label>
            </div>
            <label>Message *
              <textarea required rows={5} value={form.message} onChange={set('message')}
                placeholder={isPartner ? 'Tell us about your business and what kind of partnership you have in mind…' : 'Grade, packing, delivery port, timeline…'} />
            </label>
            <button type="submit" className="pill pill--brown pill--lg pill--block">
              {isPartner ? 'Send partnership proposal' : 'Send inquiry'} →
            </button>
            <p className="form__note" role="status">
              {sent
                ? <>✅ Your email app should now be open with the message ready. Just press send. Nothing opened? Email <a href={`mailto:${to}`}>{to}</a>.</>
                : <>This opens your email app with a message to <b>{to}</b>.</>}
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
