import { useState } from 'react'
import { CheckCircle2, Clock, Copy, Handshake, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { company, dryFruits, freshFruits } from '../data/site.js'

const TYPES = [
  { id: 'general', label: 'General inquiry' },
  { id: 'order', label: 'Product price / order' },
  { id: 'import', label: 'Import to India' },
  { id: 'export', label: 'Export from India' },
  { id: 'partnership', label: 'Business partnership' },
]

const PRODUCTS = [...dryFruits, ...freshFruits].map((p) => p.name)

const EMPTY = { name: '', company: '', email: '', phone: '', country: '', quantity: '', message: '' }

// The form has no server behind it: submitting opens the visitor's email app
// with a ready-to-send message addressed to the right inbox.
export default function Contact({ inquiry, setInquiry }) {
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState('')

  const isPartner = inquiry.type === 'partnership'
  const to = isPartner ? company.partnershipEmail : company.email
  const typeLabel = TYPES.find((t) => t.id === inquiry.type)?.label ?? 'Inquiry'
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const subject = `${typeLabel}${inquiry.product ? ` – ${inquiry.product}` : ''} – ${form.name}${form.company ? ` (${form.company})` : ''}`
    const lines = [
      `Inquiry type: ${typeLabel}`,
      inquiry.product && `Product: ${inquiry.product}`,
      form.quantity && `Quantity: ${form.quantity}`,
      '',
      form.message,
      '',
      '---',
      `Name: ${form.name}`,
      form.company && `Company: ${form.company}`,
      `Email: ${form.email}`,
      form.phone && `Phone / WhatsApp: ${form.phone}`,
      form.country && `Country: ${form.country}`,
    ].filter((l) => l !== false && l !== undefined && l !== null)
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
    setSent(true)
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      setCopied('')
    }
  }

  return (
    <section className="section contact" id="contact">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Contact us</p>
          <h2>Send us an inquiry</h2>
          <p className="section__lead">
            Ask for prices, samples or a shipment quote — or reach out about a business partnership. We reply within one working day.
          </p>
        </div>
        <div className="contact__grid">
          <aside className="contact__info">
            <div className="mailcard">
              <span className="mailcard__icon"><Mail size={22} /></span>
              <div>
                <h3>Orders &amp; inquiries</h3>
                <p>Prices, samples, availability and shipping.</p>
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </div>
              <button type="button" className="icon-btn" onClick={() => copy(company.email)} aria-label="Copy inquiry email">
                {copied === company.email ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <div className="mailcard mailcard--gold">
              <span className="mailcard__icon"><Handshake size={22} /></span>
              <div>
                <h3>Business partnership</h3>
                <p>Distributors, wholesale, bulk contracts and private label.</p>
                <a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a>
              </div>
              <button type="button" className="icon-btn" onClick={() => copy(company.partnershipEmail)} aria-label="Copy partnership email">
                {copied === company.partnershipEmail ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <ul className="contact__list">
              <li><Phone size={18} /> <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a></li>
              <li><MessageCircle size={18} /> <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a></li>
              <li><MapPin size={18} /> {company.address}</li>
              <li><Clock size={18} /> {company.hours}</li>
            </ul>
          </aside>

          <form className="form" onSubmit={submit}>
            <div className="form__types" role="radiogroup" aria-label="What is your inquiry about?">
              {TYPES.map((t) => (
                <button type="button" role="radio" aria-checked={inquiry.type === t.id} key={t.id}
                  className={`chip ${inquiry.type === t.id ? 'is-active' : ''}`}
                  onClick={() => setInquiry((q) => ({ ...q, type: t.id }))}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="form__row">
              <label>Full name *<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
              <label>Company<input value={form.company} onChange={set('company')} autoComplete="organization" /></label>
            </div>
            <div className="form__row">
              <label>Email *<input type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></label>
              <label>Phone / WhatsApp<input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
            </div>
            <div className="form__row">
              <label>Product
                <select value={inquiry.product} onChange={(e) => setInquiry((q) => ({ ...q, product: e.target.value }))}>
                  <option value="">Any / multiple products</option>
                  {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label>Quantity<input placeholder="e.g. 5 tonnes, 1 container" value={form.quantity} onChange={set('quantity')} /></label>
            </div>
            <label>Your country<input value={form.country} onChange={set('country')} autoComplete="country-name" /></label>
            <label>Message *
              <textarea required rows={5} value={form.message} onChange={set('message')}
                placeholder={isPartner ? 'Tell us about your business and the partnership you have in mind…' : 'Grade, packing, delivery port, timeline…'} />
            </label>
            <button type="submit" className="btn btn--green btn--block">
              <Send size={18} /> Send {isPartner ? 'partnership proposal' : 'inquiry'}
            </button>
            <p className="form__note">
              {sent
                ? <><CheckCircle2 size={16} /> Your email app should now be open with the message ready. Just press send. If nothing opened, email us at <a href={`mailto:${to}`}>{to}</a>.</>
                : <>This opens your email app with a message addressed to <b>{to}</b>.</>}
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
