import { EnvelopeSimple, MapPin, Phone } from '../ph.jsx'
import Logo from '../Logo.jsx'
import { telHref } from '../hooks.js'

export default function Footer({ content, pages }) {
  const { company, footer } = content
  return (
    <footer className="footer" id="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <Logo company={company} light />
          {footer.about && <p>{footer.about}</p>}
        </div>
        <div>
          <h3>Company</h3>
          <a href="/">Home</a>
          {pages.map((p) => <a key={p.id} href={p.path}>{p.label}</a>)}
        </div>
        <div>
          <h3>Get in touch</h3>
          {company.email && <a href={`mailto:${company.email}`}><EnvelopeSimple size={17} weight="duotone" /> {company.email}</a>}
          {company.partnershipEmail && <a href={`mailto:${company.partnershipEmail}`}><EnvelopeSimple size={17} weight="duotone" /> {company.partnershipEmail}</a>}
          {company.phone && <a href={telHref(company.phone)}><Phone size={17} weight="duotone" /> {company.phone}</a>}
          {company.address && <span><MapPin size={17} weight="duotone" /> {company.address}</span>}
        </div>
      </div>
      <div className="container footer__bottom">
        <span suppressHydrationWarning>© {new Date().getFullYear()} {company.name}. {footer.copyright}</span>
      </div>
    </footer>
  )
}
