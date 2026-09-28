import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { company, photos, stats } from '../data/site.js'
import Photo from './Photo.jsx'
import useInView from './useInView.js'

function CountUp({ value, run }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const dur = reduced ? 1 : 1500
    const start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, value])
  return n.toLocaleString('en-IN')
}

export default function Hero({ onPartner }) {
  const [ref, inView] = useInView(0.3)
  return (
    <section className="hero" id="top">
      <Photo photo={photos.hero} eager className="hero__bg" sizes="100vw" />
      <div className="hero__overlay" aria-hidden="true" />
      <div className="container hero__content">
        <p className="hero__eyebrow">Importers &amp; Exporters · Since {company.since}</p>
        <h1>Premium Dry Fruits &amp; Fresh Fruits, Sourced and Shipped Worldwide</h1>
        <p className="hero__lede">
          {company.name} connects growers and buyers across the world, with India at the centre of our trade.
          We import quality nuts and dried fruits into India and export India’s finest fresh produce.
        </p>
        <div className="hero__actions">
          <a href="#contact" className="btn btn--primary btn--lg">Request a Quote <ArrowRight size={18} /></a>
          <button type="button" className="btn btn--outline-light btn--lg" onClick={onPartner}>Become a Partner</button>
        </div>
        <ul className="hero__trust">
          <li><CheckCircle2 size={18} /> Quality graded lots</li>
          <li><CheckCircle2 size={18} /> Export documentation handled</li>
          <li><CheckCircle2 size={18} /> On-time delivery</li>
        </ul>
      </div>
      <div className="container">
        <div className="stats" ref={ref}>
          {stats.map((s) => (
            <div className="stats__item" key={s.key}>
              <strong><CountUp value={s.value} run={inView} />{s.suffix}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
