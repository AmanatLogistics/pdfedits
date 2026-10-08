import { useMemo, useState } from 'preact/hooks'
import { ArrowUpRight, CalendarBlank, Package } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'
import { fmtNum, unitFor, unitOf } from '../trade.js'
import { label } from '../labels.js'

export default function Products({ content, trade, tone, onAsk, more }) {
  const { products } = content
  const unit = unitOf(content)
  const tags = useMemo(() => [...new Set(products.items.map((p) => p.tag).filter(Boolean))], [products.items])
  const traded = Object.fromEntries(trade.byProduct.map((p) => [p.name, p]))
  // Products we mostly import say "imported" rather than "shipped".
  const amount = (name) => {
    const t = traded[name]
    if (!t?.tonnes) return null
    return `${fmtNum(t.tonnes)} ${unitFor(t.tonnes, unit)} ${label(content, t.imported > t.exported ? 'imported' : 'shipped')}`
  }
  const [filter, setFilter] = useState('')
  const items = filter ? products.items.filter((p) => p.tag === filter) : products.items
  return (
    <section className={`section section--${tone}`} id="products">
      <div className="container">
        <SectionHead eyebrow={products.eyebrow} title={products.title} text={products.text} more={more} />
        {tags.length > 1 && (
          <div className="filters" role="group" aria-label="Filter products">
            <button type="button" className={!filter ? 'is-active' : ''} aria-pressed={!filter} onClick={() => setFilter('')}>{label(content, 'allProducts')}</button>
            {tags.map((t) => (
              <button type="button" key={t} className={filter === t ? 'is-active' : ''} aria-pressed={filter === t} onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>
        )}
        <div className="products">
          {items.map((p, i) => (
            <button type="button" className="product reveal" style={{ '--i': i % 4 }} key={p.title} onClick={() => onAsk(p.title)}>
              <span className="product__media">
                <Photo image={p.image} className="product__img" sizes="(max-width: 700px) 50vw, (max-width: 1020px) 33vw, 300px" />
                {p.tag && <span className="product__tag">{p.tag}</span>}
              </span>
              <span className="product__body">
                <span className="product__title">{p.title}</span>
                <span className="product__meta">
                  {amount(p.title) && <span><Package size={16} weight="duotone" /> {amount(p.title)}</span>}
                  {p.season && <span><CalendarBlank size={16} weight="duotone" /> {p.season}</span>}
                </span>
                <span className="product__cta">{label(content, 'askPrice')} <ArrowUpRight size={15} weight="bold" /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
