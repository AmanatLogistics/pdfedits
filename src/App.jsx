import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Numbers from './components/Numbers.jsx'
import About from './components/About.jsx'
import Gallery from './components/Gallery.jsx'
import Trade from './components/Trade.jsx'
import Partner from './components/Partner.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [type, setType] = useState('general')
  const partner = () => {
    setType('partnership')
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <>
      <Navbar />
      <main>
        <Hero onPartner={partner} />
        <Numbers />
        <About />
        <Gallery />
        <Trade />
        <Partner onPartner={partner} />
        <Contact type={type} setType={setType} />
      </main>
      <Footer />
      <Analytics />
    </>
  )
}
