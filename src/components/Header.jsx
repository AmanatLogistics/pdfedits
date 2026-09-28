import { useState } from 'react'
import { company } from '../data/site.js'

const LINKS = [
  ['The ledger', '#ledger'],
  ['Harvest', '#harvest'],
  ['Trade lanes', '#lanes'],
  ['The house', '#house'],
  ['Partnership', '#partnership'],
]

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="masthead">
      <div className="masthead__strip">
        <div className="container masthead__strip-inner">
          <span>Dry fruits &amp; fresh fruits — Import · Export — Est. {company.since}</span>
          <a href={`mailto:${company.email}`}>{company.email}</a>
        </div>
      </div>
      <div className="container masthead__bar">
        <a href="#top" className="wordmark">{company.name}</a>
        <button type="button" className="masthead__menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Menu'}
        </button>
        <nav className={`masthead__nav ${open ? 'is-open' : ''}`} aria-label="Main">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href="#enquiry" className="masthead__cta" onClick={() => setOpen(false)}>Enquire</a>
        </nav>
      </div>
    </header>
  )
}
