import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Ledger from './components/Ledger.jsx'
import Harvest from './components/Harvest.jsx'
import Lanes from './components/Lanes.jsx'
import House from './components/House.jsx'
import Partnership from './components/Partnership.jsx'
import Enquiry from './components/Enquiry.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [type, setType] = useState('general')

  const propose = () => {
    setType('partnership')
    document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <main>
        <Hero onPartner={propose} />
        <Ledger />
        <Harvest />
        <Lanes />
        <House />
        <Partnership onPartner={propose} />
        <Enquiry type={type} setType={setType} />
      </main>
      <Footer />
      <Analytics />
    </>
  )
}
