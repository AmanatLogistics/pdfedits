import { useMemo, useState } from 'preact/hooks'
import { ArrowUpRight, CalendarBlank, Package } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'
import { fmtNum, unitOf } from '../trade.js'

export default function Products({ content, trade, tone, onAsk, more }) {
  const { products } = content
  const unit = unitOf(content)
  const tags = useMemo(() => [...new Set(products.items.map((p) => p.tag).filter(Boolean))], [products.items])
  const tonnes = Object.fromEntries(trade.byProduct.map((p) => [p.name, p.tonnes]))
  const [filter, setFilter] = useState('')
  const items = filter ? products.items.filter((p) => p.tag === filter) : products.items
  return (
    <section className={`section section--${tone}`} id="products">
      <div className="container">
        <SectionHead eyebrow={products.eyebrow} title={products.title} text={products.text} more={more} />
        {tags.length > 1 && (
          <div className="filters" role="group" aria-label="Filter products">
            <button type="button" className={!filter ? 'is-active' : ''} aria-pressed={!filter} onClick={() => setFilter('')}>All</button>
            {tags.map((t) => (
              <button type="button" key={t} className={filter === t ? 'is-active' : ''} aria-pressed={filter === t} onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>
        )}
        <div className="products">
          {items.map((p, i) => (
            <button type="button" className="product reveal" style={{ '--i': i % 4 }} key={p.title} onClick={() => onAsk(p.title)}>
              <Photo image={p.image} className="product__img" sizes="(max-width: 700px) 50vw, 300px" />
              <span className="product__body">
                <span className="product__top">
                  <span className="product__title">{p.title}</span>
                  {p.tag && <span className="product__tag">{p.tag}</span>}
                </span>
                <span className="product__meta">
                  {tonnes[p.title] > 0 && <span><Package size={16} weight="duotone" /> {fmtNum(tonnes[p.title])} {unit} shipped</span>}
                  {p.season && <span><CalendarBlank size={16} weight="duotone" /> {p.season}</span>}
                </span>
                <span className="product__cta">Ask for a price <ArrowUpRight size={15} weight="bold" /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
