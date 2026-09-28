import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Services from './components/Services.jsx'
import Performance from './components/Performance.jsx'
import Reach from './components/Reach.jsx'
import Gallery from './components/Gallery.jsx'
import WhyUs from './components/WhyUs.jsx'
import Partnership from './components/Partnership.jsx'
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
      <Header />
      <main>
        <Hero onPartner={partner} />
        <About />
        <Services />
        <Performance />
        <Reach />
        <Gallery />
        <WhyUs />
        <Partnership onPartner={partner} />
        <Contact type={type} setType={setType} />
      </main>
      <Footer />
      <Analytics />
    </>
  )
}
