import { useCallback, useMemo, useState } from 'react'
import { fontsHref, themeCss } from './theme.js'
import { useReveal } from './hooks.js'
import Header from './sections/Header.jsx'
import Hero from './sections/Hero.jsx'
import About from './sections/About.jsx'
import Services from './sections/Services.jsx'
import Products from './sections/Products.jsx'
import Performance from './sections/Performance.jsx'
import Reach from './sections/Reach.jsx'
import Process from './sections/Process.jsx'
import Why from './sections/Why.jsx'
import Certifications from './sections/Certifications.jsx'
import Testimonials from './sections/Testimonials.jsx'
import Faq from './sections/Faq.jsx'
import Partnership from './sections/Partnership.jsx'
import Contact from './sections/Contact.jsx'
import Footer from './sections/Footer.jsx'
import WhatsAppButton from './sections/WhatsAppButton.jsx'

const SECTIONS = { about: About, services: Services, products: Products, performance: Performance, reach: Reach, process: Process, why: Why, certifications: Certifications, testimonials: Testimonials, faq: Faq, partnership: Partnership, contact: Contact }
// Sections with their own dark background; the rest alternate white and grey.
const DARK = new Set(['reach', 'partnership'])

// Sections that would render nothing are skipped, so they never break the
// alternating backgrounds or show up in the menu.
function hasContent(id, c) {
  if (id === 'certifications') return c.certifications?.items?.length > 0
  if (id === 'testimonials') return c.testimonials?.items?.length > 0
  if (id === 'faq') return c.faq?.items?.length > 0
  if (id === 'performance') return c.performance?.years?.length > 0
  return !!c[id]
}

export default function Site({ content }) {
  const [request, setRequest] = useState(null)
  const sections = useMemo(
    () => content.sections.filter((s) => s.visible && SECTIONS[s.id] && hasContent(s.id, content)),
    [content],
  )
  const navSections = useMemo(() => sections.filter((s) => s.inNav && s.id !== 'contact'), [sections])

  const goToContact = useCallback((req) => {
    setRequest({ ...req, at: Date.now() })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const tones = useMemo(() => {
    let light = 0
    return sections.map((s) => (DARK.has(s.id) ? 'dark' : light++ % 2 === 0 ? 'white' : 'gray'))
  }, [sections])

  useReveal([sections.map((s) => s.id).join()])

  const href = fontsHref(content.theme)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss(content.theme) }} />
      {href && <link rel="stylesheet" href={href} />}
      <Header content={content} navSections={navSections} />
      <main>
        <Hero content={content} onPartner={() => goToContact({ partnership: true })} />
        {sections.map((s, i) => {
          const Section = SECTIONS[s.id]
          return (
            <Section key={s.id} content={content} tone={tones[i]}
              request={s.id === 'contact' ? request : undefined}
              onPartner={() => goToContact({ partnership: true })}
              onAsk={(product) => goToContact({ product })} />
          )
        })}
      </main>
      <Footer content={content} navSections={navSections} />
      <WhatsAppButton content={content} />
    </>
  )
}
