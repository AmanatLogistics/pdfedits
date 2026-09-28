import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Stats from './components/Stats.jsx'
import About from './components/About.jsx'
import Products from './components/Products.jsx'
import Trade from './components/Trade.jsx'
import Process from './components/Process.jsx'
import Partnership from './components/Partnership.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  // Filled in when a visitor clicks "Inquire" on a product card, so the
  // contact form opens with that product already selected.
  const [inquiry, setInquiry] = useState({ product: '', type: 'general' })

  const startInquiry = (next) => {
    setInquiry((prev) => ({ ...prev, ...next }))
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero onPartner={() => startInquiry({ type: 'partnership' })} />
        <Stats />
        <About />
        <Products onInquire={(product) => startInquiry({ product, type: 'order' })} />
        <Trade />
        <Process />
        <Partnership onPartner={() => startInquiry({ type: 'partnership' })} />
        <Contact inquiry={inquiry} setInquiry={setInquiry} />
      </main>
      <Footer />
      <Analytics />
    </>
  )
}
