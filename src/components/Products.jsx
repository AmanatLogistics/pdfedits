import { useState } from 'react'
import { MapPin, Send } from 'lucide-react'
import { dryFruits, freshFruits } from '../data/site.js'
import FruitArt from './FruitArt.jsx'

const TABS = [
  { id: 'dry', label: 'Dry Fruits', items: dryFruits },
  { id: 'fresh', label: 'Fresh Fruits', items: freshFruits },
]

export default function Products({ onInquire }) {
  const [tab, setTab] = useState('dry')
  const items = TABS.find((t) => t.id === tab).items
  return (
    <section className="section products" id="products">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">What we trade</p>
          <h2>Our dry fruits &amp; fresh fruits</h2>
          <p className="section__lead">
            Available in bulk and in custom packing. Tell us the grade, quantity and destination and we will send you a quote.
          </p>
          <div className="tabs" role="tablist" aria-label="Product range">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="products__grid" role="tabpanel">
          {items.map((p, i) => (
            <article className="product" key={p.name}>
              <div className="product__media">
                {p.photo ? (
                  <img src={p.photo} alt={p.name} loading="lazy" />
                ) : (
                  <FruitArt art={p.art} seed={i + 2} title={p.name} />
                )}
              </div>
              <div className="product__body">
                <h3>{p.name}</h3>
                <p className="product__origin"><MapPin size={14} /> {p.origin}</p>
                <p>{p.desc}</p>
                <button type="button" className="product__cta" onClick={() => onInquire(p.name)}>
                  Inquire about {p.name.toLowerCase()} <Send size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
