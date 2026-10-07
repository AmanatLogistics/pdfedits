import { useCallback, useMemo, useState } from 'preact/hooks'
import { fontsHref, themeCss } from './theme.js'
import { useReveal } from './hooks.js'
import { tradeSummary } from './trade.js'
import Header from './sections/Header.jsx'
import Hero from './sections/Hero.jsx'
import Record from './sections/Record.jsx'
import Shipments from './sections/Shipments.jsx'
import Products from './sections/Products.jsx'
import Destinations from './sections/Destinations.jsx'
import About from './sections/About.jsx'
import Certifications from './sections/Certifications.jsx'
import Testimonials from './sections/Testimonials.jsx'
import Faq from './sections/Faq.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './sections/Footer.jsx'
import WhatsAppButton from './sections/WhatsAppButton.jsx'

const SECTIONS = { record: Record, shipments: Shipments, products: Products, destinations: Destinations, about: About, certifications: Certifications, testimonials: Testimonials, faq: Faq, contact: Contact }
// Sections with their own dark background; the rest alternate white and grey.
const DARK = new Set(['destinations'])

// Sections that would render nothing are skipped, so they never break the
// alternating backgrounds or show up in the menu.
function hasContent(id, c, trade) {
  if (id === 'record') return trade.byYear.length > 0
  if (id === 'shipments') return trade.recent.length > 0
  if (id === 'destinations') return trade.byCountry.length > 0
  if (id === 'products') return c.products?.items?.length > 0
  if (id === 'certifications') return c.certifications?.items?.length > 0
  if (id === 'testimonials') return c.testimonials?.items?.length > 0
  if (id === 'faq') return c.faq?.items?.length > 0
  return !!c[id]
}

export default function Site({ content }) {
  const [request, setRequest] = useState(null)
  const trade = useMemo(() => tradeSummary(content), [content])
  const sections = useMemo(
    () => content.sections.filter((s) => s.visible && SECTIONS[s.id] && hasContent(s.id, content, trade)),
    [content, trade],
  )
  const navSections = useMemo(() => sections.filter((s) => s.inNav), [sections])
  const tones = useMemo(() => {
    let light = 0
    return sections.map((s) => (DARK.has(s.id) ? 'dark' : light++ % 2 === 0 ? 'white' : 'gray'))
  }, [sections])

  const goToContact = useCallback((req) => {
    setRequest({ ...req, at: Date.now() })
    document.querySelector('#contact form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  useReveal([sections.map((s) => s.id).join()])

  const href = fontsHref(content.theme)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss(content.theme) }} />
      {href && <link rel="stylesheet" href={href} />}
      <Header content={content} navSections={navSections} />
      <main>
        <Hero content={content} trade={trade} onPartner={() => goToContact({ partnership: true })} />
        {sections.map((s, i) => {
          const Section = SECTIONS[s.id]
          return (
            <Section key={s.id} content={content} trade={trade} tone={tones[i]}
              request={s.id === 'contact' ? request : undefined}
              onAsk={(product) => goToContact({ product })} />
          )
        })}
      </main>
      <Footer content={content} navSections={navSections} />
      <WhatsAppButton content={content} />
    </>
  )
}
