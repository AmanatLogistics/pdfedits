import { ArrowRight, Package } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'
import { thumbOf } from '../images.js'
import { fmtNum, unitFor, unitOf } from '../trade.js'
import { label } from '../labels.js'
import { productPath } from '../pages.js'

// The products in short on the home page, each linking to its own page, with a
// few lines about what we supply (this is also the text Google reads first).
export default function DryFruits({ content, trade, tone = 'gray' }) {
  const D = content.home?.products || {}
  const items = (content.products?.items || []).filter((p) => p.title)
  if (!items.length) return null
  const unit = unitOf(content)
  const traded = Object.fromEntries(trade.byProduct.map((p) => [p.name, p]))
  return (
    <section className={`section section--${tone}`} id="dry-fruits">
      <div className="container">
        <SectionHead eyebrow={D.eyebrow} title={D.title} text={D.text} align="split"
          more={{ href: '/products', label: label(content, 'allProductsLink') }} />
        <ul className="fruits">
          {items.map((p, i) => {
            const t = traded[p.title]
            return (
              <li key={p.title} className="reveal" style={{ '--i': i % 3 }}>
                <a className="fruit" href={productPath(p.title)}>
                  <Photo image={{ src: thumbOf(p.image?.src, 240) || p.image?.src, alt: p.image?.alt || p.title }} className="fruit__img" plain width="96" height="96" />
                  <span className="fruit__body">
                    <h3>{p.heading || p.title}</h3>
                    <span className="fruit__line">{p.summary || p.season}</span>
                    {t?.tonnes > 0 && <span className="fruit__tons"><Package size={15} weight="duotone" /> {fmtNum(t.tonnes)} {unitFor(t.tonnes, unit)} {label(content, 'shipped')}</span>}
                  </span>
                  <ArrowRight size={18} weight="bold" className="fruit__go" />
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
