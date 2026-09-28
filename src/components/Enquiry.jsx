import { useState } from 'react'
import { company } from '../data/site.js'

export const TYPES = [
  { id: 'general', label: 'General enquiry' },
  { id: 'order', label: 'Prices & orders' },
  { id: 'import', label: 'Import to India' },
  { id: 'export', label: 'Export from India' },
  { id: 'partnership', label: 'Business partnership' },
]

const EMPTY = { name: '', company: '', email: '', phone: '', country: '', goods: '', quantity: '', message: '' }

// There is no server behind this form: sending opens the visitor's own email
// app with the message written out and addressed to the right inbox.
export default function Enquiry({ type, setType }) {
  const [form, setForm] = useState(EMPTY)
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const isPartner = type === 'partnership'
  const to = isPartner ? company.partnershipEmail : company.email
  const typeLabel = TYPES.find((t) => t.id === type)?.label ?? 'Enquiry'

  const submit = (e) => {
    e.preventDefault()
    const subject = `${typeLabel} – ${form.name}${form.company ? `, ${form.company}` : ''}`
    const details = [
      `Enquiry: ${typeLabel}`,
      form.goods && `Goods: ${form.goods}`,
      form.quantity && `Quantity: ${form.quantity}`,
    ].filter(Boolean)
    const signature = [form.name, form.company, form.email, form.phone, form.country].filter(Boolean)
    const body = [details.join('\n'), form.message, `—\n${signature.join('\n')}`].join('\n\n')
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  const field = (n, key, label, props = {}) => (
    <label className="slip__field">
      <span><b>{String(n).padStart(2, '0')}</b> {label}{props.required ? ' *' : ''}</span>
      <input value={form[key]} onChange={set(key)} {...props} />
    </label>
  )

  return (
    <section className="enquiry" id="enquiry">
      <div className="container enquiry__grid">
        <div className="enquiry__info">
          <header className="sec-head">
            <span className="sec-num">§ 6</span>
            <h2>Write to us</h2>
            <p>Ask for prices, samples or a shipment quote. We answer every enquiry within one working day.</p>
          </header>
          <dl className="addresses">
            <div>
              <dt>Orders &amp; enquiries</dt>
              <dd><a href={`mailto:${company.email}`}>{company.email}</a></dd>
            </div>
            <div>
              <dt>Business partnership</dt>
              <dd><a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a></dd>
            </div>
            <div>
              <dt>Telephone</dt>
              <dd className="addresses__small">
                <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
                {' · '}
                <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>
              </dd>
            </div>
            <div>
              <dt>Office</dt>
              <dd className="addresses__small">{company.city}<br />{company.hours}</dd>
            </div>
          </dl>
        </div>

        <form className="slip" onSubmit={submit}>
          <div className="slip__head">
            <span>Enquiry slip</span>
            <span>To: {to}</span>
          </div>
          <fieldset className="slip__types">
            <legend>Regarding</legend>
            {TYPES.map((t) => (
              <label key={t.id} className={type === t.id ? 'is-checked' : ''}>
                <input type="radio" name="type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} />
                {t.label}
              </label>
            ))}
          </fieldset>
          <div className="slip__row">
            {field(1, 'name', 'Name', { required: true, autoComplete: 'name' })}
            {field(2, 'company', 'Company', { autoComplete: 'organization' })}
          </div>
          <div className="slip__row">
            {field(3, 'email', 'Email', { required: true, type: 'email', autoComplete: 'email' })}
            {field(4, 'phone', 'Phone / WhatsApp', { type: 'tel', autoComplete: 'tel' })}
          </div>
          <div className="slip__row">
            {field(5, 'goods', 'Goods', { placeholder: 'e.g. W240 cashews, Medjool dates' })}
            {field(6, 'quantity', 'Quantity', { placeholder: 'e.g. 5 tonnes, one container' })}
          </div>
          {field(7, 'country', 'Country', { autoComplete: 'country-name' })}
          <label className="slip__field">
            <span><b>08</b> Message *</span>
            <textarea required rows={4} value={form.message} onChange={set('message')}
              placeholder={isPartner ? 'Tell us about your business and the partnership you have in mind.' : 'Grade, packing, port of delivery, dates.'} />
          </label>
          <div className="slip__foot">
            <button type="submit" className="button">{isPartner ? 'Send proposal' : 'Send enquiry'}</button>
            <p role="status">
              {sent
                ? <>Your email app should now be open with the message written out. Press send there. If nothing opened, write to <a href={`mailto:${to}`}>{to}</a>.</>
                : <>Opens your email app with the message ready to send.</>}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
