import { ArrowRight } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'
import { label } from '../labels.js'
import { fmtNum, unitOf } from '../trade.js'

// A live figure for each page's card, unless the admin panel sets its own.
function figure(id, content, trade) {
  if (id === 'track-record') return trade.shipped > 0 ? `${fmtNum(trade.shipped)} ${unitOf(content)} ${label(content, 'shipped')}` : ''
  if (id === 'products') return content.products?.items?.length ? `${content.products.items.length} ${label(content, 'productsWord')}` : ''
  if (id === 'shipping') return (content.destinations?.routes || []).map((r) => r.title).filter(Boolean).join(' · ')
  if (id === 'about') return content.company?.since ? `${label(content, 'since')} ${content.company.since}` : ''
  return ''
}

export default function Explore({ content, trade, pages }) {
  const E = content.home?.explore || {}
  const cards = pages.filter((p) => p.id !== 'contact')
  if (!cards.length) return null
  return (
    <section className="section section--white" id="explore">
      <div className="container">
        <SectionHead eyebrow={E.eyebrow} title={E.title} text={E.text} align="split" />
        <ul className={`explore explore--${cards.length}`}>
          {cards.map((p, i) => {
            const c = E.cards?.[p.id] || {}
            const stat = c.stat || figure(p.id, content, trade)
            return (
              <li key={p.id} className="reveal" style={{ '--i': i }}>
                <a className="explore__card" href={p.path}>
                  <Photo image={c.image || p.image} className="explore__img" sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" />
                  <span className="explore__body">
                    {stat && <span className="explore__stat">{stat}</span>}
                    <strong className="explore__title">{c.title || p.label}</strong>
                    {c.text && <span className="explore__text">{c.text}</span>}
                    <span className="explore__go">{label(content, 'openPage')} <ArrowRight size={16} weight="bold" /></span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
