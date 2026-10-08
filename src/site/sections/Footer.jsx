import { EnvelopeSimple, MapPin, Phone } from '../ph.jsx'
import Logo from '../Logo.jsx'
import { telHref } from '../hooks.js'
import { label } from '../labels.js'

// Photos used under a licence that asks for a credit carry one (image.credit).
function photoCredits(content) {
  const found = new Map()
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') {
      if (v.src && v.credit && !found.has(v.credit)) found.set(v.credit, v.creditUrl || '')
      Object.values(v).forEach(walk)
    }
  }
  walk(content)
  return [...found]
}

export default function Footer({ content, pages }) {
  const { company, footer, partner } = content
  const credits = photoCredits(content)
  return (
    <footer className="footer" id="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <Logo company={company} light />
          {footer.about && <p>{footer.about}</p>}
          {partner?.inFooter && partner?.logo && (
            <div className="footer__partner">
              <span>{label(content, 'footerPartner')}</span>
              {partner.link
                ? <a href={partner.link} target="_blank" rel="noreferrer"><img src={partner.logo} alt={partner.name} width="64" height="62" loading="lazy" /></a>
                : <img src={partner.logo} alt={partner.name} width="64" height="62" loading="lazy" />}
            </div>
          )}
        </div>
        <div>
          <h3>{label(content, 'footerCompany')}</h3>
          <a href="/">{label(content, 'home')}</a>
          {pages.map((p) => <a key={p.id} href={p.path}>{p.label}</a>)}
        </div>
        <div>
          <h3>{label(content, 'footerContact')}</h3>
          {company.email && <a href={`mailto:${company.email}`}><EnvelopeSimple size={17} weight="duotone" /> {company.email}</a>}
          {company.partnershipEmail && <a href={`mailto:${company.partnershipEmail}`}><EnvelopeSimple size={17} weight="duotone" /> {company.partnershipEmail}</a>}
          {company.phone && <a href={telHref(company.phone)}><Phone size={17} weight="duotone" /> {company.phone}</a>}
          {company.address && <span><MapPin size={17} weight="duotone" /> {company.address}</span>}
        </div>
      </div>
      <div className="container footer__bottom">
        <span suppressHydrationWarning>© {new Date().getFullYear()} {company.name}. {footer.copyright}</span>
        {credits.length > 0 && (
          <span className="footer__credits">{label(content, 'photos')}: {credits.map(([text, url], i) => (
            <span key={text}>{i > 0 && ' · '}{url ? <a href={url} target="_blank" rel="noreferrer">{text}</a> : text}</span>
          ))}</span>
        )}
      </div>
    </footer>
  )
}
