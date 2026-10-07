import { useEffect, useState } from 'preact/hooks'
import { CheckCircle, Clock, Copy, EnvelopeSimple, Handshake, MapPin, PaperPlaneTilt, Phone, WhatsappLogo } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import { scrollToForm, telHref, waHref } from '../hooks.js'

const EMPTY = { name: '', company: '', email: '', phone: '', country: '', product: '', quantity: '', message: '', website: '' }

function buildMailto(to, typeLabel, f) {
  const subject = `${typeLabel}${f.product ? ` – ${f.product}` : ''} – ${f.name}${f.company ? `, ${f.company}` : ''}`
  const details = [`Inquiry: ${typeLabel}`, f.product && `Product: ${f.product}`, f.quantity && `Quantity: ${f.quantity}`].filter(Boolean)
  const signature = [f.name, f.company, f.email, f.phone, f.country].filter(Boolean)
  const body = [details.join('\n'), f.message, `—\n${signature.join('\n')}`].join('\n\n')
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function Contact({ content, tone, request: outside }) {
  const [local, setRequest] = useState(null)
  const request = !outside ? local : !local ? outside : local.at > outside.at ? local : outside
  const { contact, company, products } = content
  const types = contact.inquiryTypes?.length ? contact.inquiryTypes : [{ label: 'General inquiry', partnership: false }]
  const [typeIndex, setTypeIndex] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState({ status: 'idle', message: '' })
  const [copied, setCopied] = useState('')

  // Links from other pages arrive as /contact?product=Raisins or ?partner=1.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const product = q.get('product')
    if (!product && !q.has('partner')) return
    const t = setTimeout(() => {
      setRequest({ product: product || '', partnership: q.has('partner'), at: Date.now() })
      scrollToForm(false)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // A button elsewhere on the page ("Become a Partner", a product card) can
  // pre-select the inquiry type or product.
  const [handled, setHandled] = useState(null)
  if (request && request !== handled) {
    setHandled(request)
    if (request.partnership) {
      const i = types.findIndex((t) => t.partnership)
      if (i >= 0) setTypeIndex(i)
    } else if (request.product) {
      const i = types.findIndex((t) => !t.partnership)
      if (i >= 0) setTypeIndex(i)
      setForm((f) => ({ ...f, product: request.product }))
    }
  }

  const type = types[Math.min(typeIndex, types.length - 1)]
  const to = type.partnership && company.partnershipEmail ? company.partnershipEmail : company.email
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'sending', message: '' })
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: type.label, partnership: !!type.partnership }),
      })
      if (res.ok) {
        setState({ status: 'sent', message: contact.successMessage })
        setForm(EMPTY)
        return
      }
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}))
        setState({ status: 'error', message: data.error || 'Please check the form and try again.' })
        return
      }
    } catch { /* network error: fall back to email below */ }
    // Sending from the website is not set up (or failed): hand over to the
    // visitor's email app with the message already written.
    window.location.href = buildMailto(to, type.label, form)
    setState({ status: 'mailto', message: '' })
  }

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1800) } catch { /* ignore */ }
  }

  const productNames = products?.items?.map((p) => p.title) ?? []

  return (
    <section className={`section section--${tone}`} id="contact">
      <div className="container">
        {contact.partnerTitle && (
          <div className="partner-band reveal">
            <span className="partner-band__icon"><Handshake size={30} weight="duotone" /></span>
            <div>
              <h3>{contact.partnerTitle}</h3>
              {contact.partnerText && <p>{contact.partnerText}</p>}
            </div>
            <button type="button" className="btn btn--accent" onClick={() => { setRequest({ partnership: true, at: Date.now() }); scrollToForm() }}>{contact.partnerButton || 'Become a partner'}</button>
          </div>
        )}
        <SectionHead eyebrow={contact.eyebrow} title={contact.title} text={contact.text} />
        <div className="contact">
          <aside className="contact__info reveal">
            {company.email && (
              <div className="cinfo">
                <span className="cinfo__icon"><EnvelopeSimple size={22} weight="duotone" /></span>
                <div><h3>Orders &amp; inquiries</h3><a href={`mailto:${company.email}`}>{company.email}</a></div>
                <button type="button" className="cinfo__copy" onClick={() => copy(company.email)} aria-label="Copy email address">
                  {copied === company.email ? <CheckCircle size={16} weight="bold" /> : <Copy size={16} />}
                </button>
              </div>
            )}
            {company.partnershipEmail && (
              <div className="cinfo">
                <span className="cinfo__icon"><Handshake size={22} weight="duotone" /></span>
                <div><h3>Business partnerships</h3><a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a></div>
                <button type="button" className="cinfo__copy" onClick={() => copy(company.partnershipEmail)} aria-label="Copy partnership email address">
                  {copied === company.partnershipEmail ? <CheckCircle size={16} weight="bold" /> : <Copy size={16} />}
                </button>
              </div>
            )}
            {company.phone && (
              <div className="cinfo">
                <span className="cinfo__icon"><Phone size={22} weight="duotone" /></span>
                <div><h3>Phone</h3><a href={telHref(company.phone)}>{company.phone}</a></div>
              </div>
            )}
            {company.whatsapp && (
              <div className="cinfo">
                <span className="cinfo__icon cinfo__icon--wa"><WhatsappLogo size={22} weight="duotone" /></span>
                <div><h3>WhatsApp</h3><a href={waHref(company.whatsapp)} target="_blank" rel="noreferrer">Chat with our team</a></div>
              </div>
            )}
            {company.address && (
              <div className="cinfo">
                <span className="cinfo__icon"><MapPin size={22} weight="duotone" /></span>
                <div><h3>Office</h3><span>{company.address}</span></div>
              </div>
            )}
            {company.hours && (
              <div className="cinfo">
                <span className="cinfo__icon"><Clock size={22} weight="duotone" /></span>
                <div><h3>Business hours</h3><span>{company.hours}</span></div>
              </div>
            )}
            {company.mapEmbedUrl && /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(company.mapEmbedUrl) && (
              <iframe className="contact__map" title="Office location" src={company.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            )}
          </aside>

          <form className="form reveal" onSubmit={submit} noValidate={false}>
            {state.status === 'sent' ? (
              <div className="form__done" role="status">
                <CheckCircle size={48} weight="duotone" />
                <h3>Inquiry sent</h3>
                <p>{state.message}</p>
                <button type="button" className="btn btn--primary" onClick={() => setState({ status: 'idle', message: '' })}>Send another inquiry</button>
              </div>
            ) : (
              <>
                <div className="form__grid">
                  <label className="form__full">Inquiry type
                    <select value={typeIndex} onChange={(e) => setTypeIndex(Number(e.target.value))}>
                      {types.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                    </select>
                  </label>
                  <label><span>Full name <em>*</em></span><input required name="name" value={form.name} onChange={set('name')} autoComplete="name" maxLength={120} /></label>
                  <label>Company<input name="company" value={form.company} onChange={set('company')} autoComplete="organization" maxLength={160} /></label>
                  <label><span>Email <em>*</em></span><input required type="email" name="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={200} /></label>
                  <label>Phone / WhatsApp<input type="tel" name="phone" value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={40} /></label>
                  {!type.partnership && (
                    <>
                      <label>Product
                        <input name="product" list="product-list" value={form.product} onChange={set('product')} placeholder="e.g. Almonds" maxLength={160} />
                        <datalist id="product-list">{productNames.map((p) => <option key={p} value={p} />)}</datalist>
                      </label>
                      <label>Quantity<input name="quantity" value={form.quantity} onChange={set('quantity')} placeholder="e.g. 20 Tons" maxLength={80} /></label>
                    </>
                  )}
                  <label className="form__full">Country<input name="country" value={form.country} onChange={set('country')} autoComplete="country-name" maxLength={80} /></label>
                  <label className="form__full"><span>Message <em>*</em></span>
                    <textarea required rows={5} name="message" value={form.message} onChange={set('message')} maxLength={5000}
                      placeholder={type.partnership ? 'Tell us about your business and the partnership you have in mind.' : 'Grade, packing, delivery port and timeline.'} />
                  </label>
                  <label className="form__hp" aria-hidden="true">Website<input tabIndex={-1} name="website" value={form.website} onChange={set('website')} autoComplete="off" /></label>
                </div>
                <div className="form__foot">
                  <button type="submit" className="btn btn--accent btn--lg" disabled={state.status === 'sending'}>
                    {state.status === 'sending' ? 'Sending…' : contact.submitLabel || 'Send Inquiry'} <PaperPlaneTilt size={18} weight="bold" />
                  </button>
                  <p className="form__note" role="status">
                    {state.status === 'error' && <span className="form__error">{state.message}</span>}
                    {state.status === 'mailto' && <>Your email app should open with the message ready. If it doesn’t, write to <a href={`mailto:${to}`}>{to}</a>.</>}
                    {(state.status === 'idle' || state.status === 'sending') && <>Goes to <strong>{to}</strong></>}
                  </p>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
