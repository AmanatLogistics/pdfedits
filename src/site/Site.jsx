import { useCallback, useMemo, useState } from 'preact/hooks'
import { fontsHref, themeCss } from './theme.js'
import { scrollToForm, useReveal } from './hooks.js'
import { tradeSummary } from './trade.js'
import { PAGES, pageOfSection } from './pages.js'
import Header from './sections/Header.jsx'
import Hero from './sections/Hero.jsx'
import PageHero from './sections/PageHero.jsx'
import Record from './sections/Record.jsx'
import Shipments from './sections/Shipments.jsx'
import Products from './sections/Products.jsx'
import Gallery from './sections/Gallery.jsx'
import Destinations from './sections/Destinations.jsx'
import About from './sections/About.jsx'
import Certifications from './sections/Certifications.jsx'
import Testimonials from './sections/Testimonials.jsx'
import Faq from './sections/Faq.jsx'
import Contact from './sections/Contact.jsx'
import CtaBand from './sections/CtaBand.jsx'
import Footer from './sections/Footer.jsx'
import WhatsAppButton from './sections/WhatsAppButton.jsx'

const SECTIONS = {
  record: Record, shipments: Shipments, products: Products, gallery: Gallery, destinations: Destinations, about: About,
  certifications: Certifications, testimonials: Testimonials, faq: Faq, contact: Contact,
}
// Sections with their own dark background; the rest alternate white and grey.
const DARK = new Set(['destinations'])
// The "see more" link each home-page section shows, pointing to its own page.
const MORE = { record: 'See the full track record', shipments: 'See all shipments', products: 'See all products', destinations: 'Shipping details', about: 'More about us' }

// Sections that would render nothing are skipped, so they never break the
// alternating backgrounds or show up in the menu.
function hasContent(id, c, trade) {
  if (id === 'record') return trade.byYear.length > 0
  if (id === 'shipments') return trade.recent.length > 0
  if (id === 'destinations') return trade.byCountry.length > 0 || c.destinations?.routes?.length > 0
  if (id === 'products') return c.products?.items?.length > 0
  if (id === 'gallery') return c.gallery?.items?.some((g) => g.image?.src)
  if (id === 'certifications') return c.certifications?.items?.length > 0
  if (id === 'testimonials') return c.testimonials?.items?.length > 0
  if (id === 'faq') return c.faq?.items?.length > 0
  return !!c[id]
}

// Pages with at least one section to show, with their menu names.
export function livePages(content, trade = tradeSummary(content)) {
  const visible = new Set(content.sections.filter((s) => s.visible && SECTIONS[s.id] && hasContent(s.id, content, trade)).map((s) => s.id))
  return PAGES
    .filter((p) => p.sections.some((id) => visible.has(id)))
    .map((p) => ({ ...p, ...(content.pages?.[p.id] || {}), id: p.id, path: p.path, sections: p.sections }))
}

export default function Site({ content, page = 'home' }) {
  const [request, setRequest] = useState(null)
  const trade = useMemo(() => tradeSummary(content), [content])
  const pages = useMemo(() => livePages(content, trade), [content, trade])
  const current = page === 'home' ? null : pages.find((p) => p.id === page) || null
  const sections = useMemo(() => {
    const all = content.sections.filter((s) => s.visible && SECTIONS[s.id] && hasContent(s.id, content, trade))
    return current ? all.filter((s) => current.sections.includes(s.id)) : all
  }, [content, trade, current])
  const tones = useMemo(() => {
    let light = 0
    return sections.map((s) => (DARK.has(s.id) ? 'dark' : light++ % 2 === 0 ? 'white' : 'gray'))
  }, [sections])
  const hasContact = sections.some((s) => s.id === 'contact')
  const contactPath = pages.find((p) => p.id === 'contact')?.path

  // "Ask for a price" and "Become a partner" open the inquiry form: on this
  // page if it has one, otherwise on the contact page.
  const goToContact = useCallback((req) => {
    if (!hasContact && contactPath) {
      if (new URLSearchParams(window.location.search).has('preview')) return
      const q = req.partnership ? 'partner=1' : req.product ? `product=${encodeURIComponent(req.product)}` : ''
      window.location.href = `${contactPath}${q ? `?${q}` : ''}#contact`
      return
    }
    setRequest({ ...req, at: Date.now() })
    scrollToForm()
  }, [hasContact, contactPath])

  useReveal([page, sections.map((s) => s.id).join()])

  const href = fontsHref(content.theme)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss(content.theme) }} />
      {href && <link rel="stylesheet" href={href} />}
      <Header content={content} pages={pages} current={page} />
      <main>
        {current
          ? <PageHero content={content} page={current} trade={trade} />
          : <Hero content={content} trade={trade} contactHref={hasContact ? '#contact' : contactPath} onPartner={() => goToContact({ partnership: true })} />}
        {sections.map((s, i) => {
          const Section = SECTIONS[s.id]
          const target = pageOfSection(s.id)
          const more = !current && MORE[s.id] && pages.some((p) => p.id === target?.id) ? { href: target.path, label: MORE[s.id] } : null
          return (
            <Section key={s.id} content={content} trade={trade} tone={tones[i]} full={!!current} more={more}
              request={s.id === 'contact' ? request : undefined}
              onAsk={(product) => goToContact({ product })}
              onPartner={() => goToContact({ partnership: true })} />
          )
        })}
        {current && current.id !== 'contact' && <CtaBand content={content} contactHref={contactPath} />}
      </main>
      <Footer content={content} pages={pages} />
      <WhatsAppButton content={content} />
    </>
  )
}
