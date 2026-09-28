import { useEffect, useState } from 'react'
import { Clock, Mail, Menu, Phone, X } from 'lucide-react'
import { company } from '../data/site.js'

const LINKS = [
  ['Home', '#top'],
  ['About', '#about'],
  ['Services', '#services'],
  ['Trade', '#performance'],
  ['Global Reach', '#reach'],
  ['Partnership', '#partnership'],
]

export function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      <span className="logo__mark" aria-hidden="true">FF</span>
      <span className="logo__text">
        <strong>{company.name}</strong>
        <small>Import &amp; Export</small>
      </span>
    </span>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__left">
            <a href={`tel:${company.phone.replace(/\s/g, '')}`}><Phone size={14} /> {company.phone}</a>
            <a href={`mailto:${company.email}`}><Mail size={14} /> {company.email}</a>
          </div>
          <span className="topbar__hours"><Clock size={14} /> {company.hours}</span>
        </div>
      </div>
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="container header__inner">
          <a href="#top" aria-label={`${company.name} home`}><Logo /></a>
          <nav className={`header__nav ${open ? 'is-open' : ''}`} aria-label="Main">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <a href="#contact" className="btn btn--primary header__cta" onClick={() => setOpen(false)}>Request a Quote</a>
          </nav>
          <button type="button" className="header__toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
    </>
  )
}
