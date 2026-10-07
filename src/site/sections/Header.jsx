import { useEffect, useState } from 'preact/hooks'
import { Clock, EnvelopeSimple, List, Phone, X } from '../ph.jsx'
import Logo from '../Logo.jsx'
import { telHref } from '../hooks.js'
import { onNavigate } from '../router.js'

export default function Header({ content, pages, current }) {
  const { company, hero } = content
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the phone menu when a link in it opens another page.
  useEffect(() => onNavigate(() => setOpen(false)), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  const nav = pages.filter((p) => p.inNav !== false && p.id !== 'contact')
  const contact = pages.find((p) => p.id === 'contact')
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
        <a href="/" className="header__brand" aria-current={current === 'home' ? 'page' : undefined}>
          <Logo company={company} light={!solid && !open} />
        </a>
        <nav id="site-nav" className={`nav ${open ? 'is-open' : ''}`} aria-label="Main">
          <a href="/" className={`nav__home ${current === 'home' ? 'is-active' : ''}`} aria-current={current === 'home' ? 'page' : undefined}>Home</a>
          {nav.map((p) => (
            <a key={p.id} href={p.path} className={current === p.id ? 'is-active' : ''} aria-current={current === p.id ? 'page' : undefined}>{p.label}</a>
          ))}
          {contact && <a href={contact.path} className="btn btn--accent nav__cta">{hero.primaryButton || 'Request a Quote'}</a>}
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
