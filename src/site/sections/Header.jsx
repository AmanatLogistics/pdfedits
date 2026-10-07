import { useEffect, useState } from 'preact/hooks'
import { Clock, EnvelopeSimple, List, Phone, X } from '../ph.jsx'
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

  const close = () => setOpen(false)
  return (
    <header className={`header ${solid || open ? 'header--solid' : ''}`}>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__links">
            {company.phone && <a href={telHref(company.phone)}><Phone size={15} weight="duotone" /> {company.phone}</a>}
            {company.email && <a href={`mailto:${company.email}`}><EnvelopeSimple size={15} weight="duotone" /> {company.email}</a>}
          </div>
          {company.hours && <span className="topbar__hours"><Clock size={15} weight="duotone" /> {company.hours}</span>}
        </div>
      </div>
      <div className="container header__bar">
        <a href="#top" className="header__brand">
          <Logo company={company} light={!solid && !open} />
        </a>
        <nav id="site-nav" className={`nav ${open ? 'is-open' : ''}`} aria-label="Main">
          {navSections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'is-active' : ''} onClick={close}>{s.label}</a>
          ))}
          <a href="#contact" className="btn btn--accent nav__cta" onClick={close}>{hero.primaryButton || 'Request a Quote'}</a>
          <div className="nav__contact">
            {company.phone && <a href={telHref(company.phone)}><Phone size={18} weight="duotone" /> {company.phone}</a>}
            {company.email && <a href={`mailto:${company.email}`}><EnvelopeSimple size={18} weight="duotone" /> {company.email}</a>}
          </div>
        </nav>
        <button type="button" className="header__toggle" aria-controls="site-nav" aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>
    </header>
  )
}
