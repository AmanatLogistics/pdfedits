import { Mail, MapPin, Phone } from 'lucide-react'
import Logo from '../Logo.jsx'
import { telHref } from '../hooks.js'

export default function Footer({ content, navSections }) {
  const { company, footer } = content
  return (
    <footer className="footer" id="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <Logo company={company} light />
          {footer.about && <p>{footer.about}</p>}
        </div>
        <div>
          <h4>Company</h4>
          {navSections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.label}</a>)}
          <a href="#contact">Contact</a>
        </div>
        <div>
          <h4>Get in touch</h4>
          {company.email && <a href={`mailto:${company.email}`}><Mail size={15} /> {company.email}</a>}
          {company.partnershipEmail && <a href={`mailto:${company.partnershipEmail}`}><Mail size={15} /> {company.partnershipEmail}</a>}
          {company.phone && <a href={telHref(company.phone)}><Phone size={15} /> {company.phone}</a>}
          {company.address && <span><MapPin size={15} /> {company.address}</span>}
        </div>
      </div>
      <div className="container footer__bottom">
        <span suppressHydrationWarning>© {new Date().getFullYear()} {company.name}. {footer.copyright}</span>
      </div>
    </footer>
  )
}
