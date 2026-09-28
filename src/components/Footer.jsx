import { company } from '../data/site.js'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="footer__brand">
            <Logo size={36} />
            <strong>{company.name}</strong>
          </div>
          <p>{company.tagline}. Trading with India and markets around the world.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="#about">About us</a>
          <a href="#products">Products</a>
          <a href="#stats">Our trade</a>
          <a href="#trade">Countries</a>
        </div>
        <div>
          <h4>Get in touch</h4>
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a>
          <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
          <span>{company.address}</span>
        </div>
      </div>
      <div className="container footer__bottom">
        © {new Date().getFullYear()} {company.name}. All rights reserved.
      </div>
    </footer>
  )
}
