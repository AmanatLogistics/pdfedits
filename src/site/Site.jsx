import { useCallback, useMemo, useState } from 'preact/hooks'
import { fontsHref, themeCss } from './theme.js'
import { scrollToForm, useReveal } from './hooks.js'
import { tradeSummary } from './trade.js'
import { PAGES } from './pages.js'
import { navigate } from './router.js'
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
import Partner from './sections/Partner.jsx'
import CtaBand from './sections/CtaBand.jsx'
import Explore from './home/Explore.jsx'
import Reasons from './home/Reasons.jsx'
import Steps from './home/Steps.jsx'
import Footer from './sections/Footer.jsx'
import WhatsAppButton from './sections/WhatsAppButton.jsx'
import ToTop from './sections/ToTop.jsx'

const SECTIONS = {
  record: Record, shipments: Shipments, products: Products, gallery: Gallery, destinations: Destinations, partner: Partner, about: About,
  certifications: Certifications, testimonials: Testimonials, faq: Faq, contact: Contact,
}
// Sections with their own dark background; the rest alternate white and grey.
const DARK = new Set(['destinations'])

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
  if (id === 'partner') return !!c.partner?.name
  return !!c[id]
}

// Pages with at least one section to show, with their menu names.
export function livePages(content, trade = tradeSummary(content)) {
  const visible = new Set(content.sections.filter((s) => s.visible && SECTIONS[s.id] && hasContent(s.id, content, trade)).map((s) => s.id))
  return PAGES
    .filter((p) => p.sections.some((id) => visible.has(id)))
    .map((p) => ({ ...p, ...(content.pages?.[p.id] || {}), id: p.id, path: p.path, sections: p.sections }))
}

export default function Site({ content, page = 'home', moved = false }) {
  const [request, setRequest] = useState(null)
  const trade = useMemo(() => tradeSummary(content), [content])
  const pages = useMemo(() => livePages(content, trade), [content, trade])
  const current = page === 'home' ? null : pages.find((p) => p.id === page) || null
  // The home page has its own overview sections; every other section lives on its own page.
  const sections = useMemo(() => (current
    ? content.sections.filter((s) => s.visible && SECTIONS[s.id] && current.sections.includes(s.id) && hasContent(s.id, content, trade))
    : []), [content, trade, current])
  const tones = useMemo(() => {
    let light = 0
    return sections.map((s) => (DARK.has(s.id) ? 'dark' : light++ % 2 === 0 ? 'white' : 'gray'))
  }, [sections])
  const hasContact = sections.some((s) => s.id === 'contact')
  const contactPath = pages.find((p) => p.id === 'contact')?.path
  const home = content.home || {}

  // "Ask for a price" and "Become a partner" open the inquiry form: on this
  // page if it has one, otherwise on the contact page.
  const goToContact = useCallback((req) => {
    if (!hasContact && contactPath) {
      if (new URLSearchParams(window.location.search).has('preview')) return
      const q = req.partnership ? 'partner=1' : req.product ? `product=${encodeURIComponent(req.product)}` : ''
      navigate(`${contactPath}${q ? `?${q}` : ''}#contact`)
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
      <main key={page} className={moved ? 'page-in' : undefined}>
        {current ? (
          <>
            <PageHero content={content} page={current} trade={trade} />
            {sections.map((s, i) => {
              const Section = SECTIONS[s.id]
              return (
                <Section key={s.id} content={content} trade={trade} tone={tones[i]} full
                  request={s.id === 'contact' ? request : undefined}
                  onAsk={(product) => goToContact({ product })}
                  onPartner={() => goToContact({ partnership: true })} />
              )
            })}
          </>
        ) : (
          <>
            <Hero content={content} trade={trade} contactHref={contactPath} onPartner={() => goToContact({ partnership: true })}
              next={home.explore?.visible !== false ? 'explore' : home.reasons?.visible !== false ? 'why' : home.steps?.visible !== false ? 'how' : 'cta'} />
            {home.explore?.visible !== false && <Explore content={content} trade={trade} pages={pages} />}
            {home.reasons?.visible !== false && <Reasons content={content} />}
            {content.partner?.showOnHome && content.sections.some((s) => s.id === 'partner' && s.visible) && <Partner content={content} tone="white" />}
            {home.steps?.visible !== false && <Steps content={content} contactHref={contactPath} />}
          </>
        )}
        {current?.id !== 'contact' && <CtaBand content={content} contactHref={contactPath} />}
      </main>
      <Footer content={content} pages={pages} />
      <WhatsAppButton content={content} />
      <ToTop above={!!(content.whatsappButton?.enabled && content.company?.whatsapp)} />
    </>
  )
}
