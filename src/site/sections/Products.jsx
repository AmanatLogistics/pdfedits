import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'

export default function Products({ content, tone, onAsk }) {
  const { products } = content
  const tags = useMemo(() => [...new Set(products.items.map((p) => p.tag).filter(Boolean))], [products.items])
  const [filter, setFilter] = useState('')
  const items = filter ? products.items.filter((p) => p.tag === filter) : products.items
  return (
    <section className={`section section--${tone}`} id="products">
      <div className="container">
        <SectionHead eyebrow={products.eyebrow} title={products.title} text={products.text} />
        {tags.length > 1 && (
          <div className="filters" role="group" aria-label="Filter">
            <button type="button" className={!filter ? 'is-active' : ''} aria-pressed={!filter} onClick={() => setFilter('')}>All</button>
            {tags.map((t) => (
              <button type="button" key={t} className={filter === t ? 'is-active' : ''} aria-pressed={filter === t} onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>
        )}
        <div className="products">
          {items.map((p) => (
            <button type="button" className="product reveal is-visible" key={p.title} onClick={() => onAsk(p.title)}
              aria-label={`${p.title}: ask for a quote`}>
              <Photo image={p.image} sizes="(max-width: 700px) 50vw, 300px" />
              <span className="product__shade" aria-hidden="true" />
              <span className="product__body">
                {p.tag && <span className="product__tag">{p.tag}</span>}
                <span className="product__title">{p.title}</span>
                <span className="product__cta">Ask for a quote <ArrowUpRight size={15} /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
