import { company } from '../data/site.js'
import { Logo } from './Navbar.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="footer__brand"><Logo /> <span>{company.name}</span></div>
          <p>Import &amp; export of dry fruits and fresh fruits, trading with India and the world.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="#about">About</a>
          <a href="#numbers">Our numbers</a>
          <a href="#gallery">Gallery</a>
          <a href="#trade">Where we trade</a>
        </div>
        <div>
          <h4>Contact</h4>
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a>
          <a href={`tel:${company.phone.replace(/\s/g, '')}`}>{company.phone}</a>
        </div>
      </div>
      <div className="container footer__bottom">© {new Date().getFullYear()} {company.name}. All rights reserved.</div>
    </footer>
  )
}
