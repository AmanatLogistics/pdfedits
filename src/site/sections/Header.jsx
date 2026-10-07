import { useEffect, useState } from 'react'
import { Clock, Mail, Menu, Phone, X } from 'lucide-react'
import Logo from '../Logo.jsx'
import { telHref } from '../hooks.js'

export default function Header({ content, navSections }) {
  const { company, hero } = content
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight the menu item for the section on screen.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-45% 0px -50% 0px' })
    navSections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [navSections])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  return (
    <header className={`header ${solid || open ? 'header--solid' : ''}`}>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__links">
            {company.phone && <a href={telHref(company.phone)}><Phone size={14} /> {company.phone}</a>}
            {company.email && <a href={`mailto:${company.email}`}><Mail size={14} /> {company.email}</a>}
          </div>
          {company.hours && <span className="topbar__hours"><Clock size={14} /> {company.hours}</span>}
        </div>
      </div>
      <div className="container header__bar">
        <a href="#top" className="header__brand" aria-label={`${company.name}, back to top`}>
          <Logo company={company} light={!solid && !open} />
        </a>
        <nav id="site-nav" className={`nav ${open ? 'is-open' : ''}`} aria-label="Main">
          {navSections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'is-active' : ''} onClick={() => setOpen(false)}>{s.label}</a>
          ))}
          <a href="#contact" className="btn btn--accent nav__cta" onClick={() => setOpen(false)}>{hero.primaryButton || 'Request a Quote'}</a>
          <div className="nav__contact">
            {company.phone && <a href={telHref(company.phone)}><Phone size={16} /> {company.phone}</a>}
            {company.email && <a href={`mailto:${company.email}`}><Mail size={16} /> {company.email}</a>}
          </div>
        </nav>
        <button type="button" className="header__toggle" aria-controls="site-nav" aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  )
}
