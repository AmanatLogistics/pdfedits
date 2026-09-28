import { company } from '../data/site.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__cols">
        <p>Importers &amp; exporters of dry fruits and fresh fruits. {company.city}.</p>
        <p>
          <a href={`mailto:${company.email}`}>{company.email}</a><br />
          <a href={`mailto:${company.partnershipEmail}`}>{company.partnershipEmail}</a>
        </p>
        <p>© {new Date().getFullYear()} {company.name}</p>
      </div>
      <div className="footer__mark" aria-hidden="true">{company.name}</div>
    </footer>
  )
}
