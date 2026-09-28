import { useEffect, useState } from 'react'
import { company } from '../data/site.js'

const LINKS = [
  ['About', '#about'],
  ['Our numbers', '#numbers'],
  ['Gallery', '#gallery'],
  ['Where we trade', '#trade'],
  ['Partner with us', '#partner'],
]

export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#e0a526" />
      <path d="M24 9c8 5 12 13 10.5 21.5C33 37 28.5 40 24 40s-9-3-10.5-9.5C12 22 16 14 24 9z" fill="#7a3d12" />
      <path d="M24 14v22" stroke="#e0a526" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 22l5-4M24 28l-5-4" stroke="#e0a526" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="container nav__inner">
        <a href="#top" className="nav__brand">
          <Logo />
          <span>{company.name}</span>
        </a>
        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Main">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href="#contact" className="pill pill--brown" onClick={() => setOpen(false)}>Contact us</a>
        </nav>
        <button type="button" className="nav__burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
