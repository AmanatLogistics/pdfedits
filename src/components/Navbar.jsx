import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { company } from '../data/site.js'
import Logo from './Logo.jsx'

const LINKS = [
  ['About', '#about'],
  ['Products', '#products'],
  ['Our Trade', '#stats'],
  ['Countries', '#trade'],
  ['Partnership', '#partnership'],
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${scrolled || open ? 'nav--solid' : ''}`}>
      <div className="container nav__inner">
        <a href="#top" className="nav__brand" aria-label={`${company.name} home`}>
          <Logo />
          <span>
            <strong>{company.name}</strong>
            <small>Import &amp; Export</small>
          </span>
        </a>
        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Main">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href="#contact" className="btn btn--gold btn--sm" onClick={() => setOpen(false)}>Get a Quote</a>
        </nav>
        <button className="nav__toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  )
}
