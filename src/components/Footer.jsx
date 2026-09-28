import { company } from '../data/site.js'
import { Logo } from './Header.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <Logo light />
          <p>Importers and exporters of dry fruits and fresh fruits, trading between India and markets worldwide since {company.since}.</p>
        </div>
        <div>
          <h4>Company</h4>
          <a href="#about">About Us</a>
          <a href="#services">Services</a>
          <a href="#performance">Trade Performance</a>
          <a href="#reach">Global Reach</a>
        </div>
        <div>
          <h4>Work With Us</h4>
          <a href="#contact">Request a Quote</a>
          <a href="#partnership">Business Partnership</a>
          <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
        <div>
          <h4>Contact</h4>
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a>
          <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
          <span>{company.city}</span>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} {company.name}. All rights reserved.</span>
      </div>
    </footer>
  )
}
