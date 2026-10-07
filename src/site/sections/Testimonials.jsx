import { Quote } from 'lucide-react'
import SectionHead from '../SectionHead.jsx'

export default function Testimonials({ content, tone }) {
  const { testimonials: t } = content
  if (!t.items?.length) return null
  return (
    <section className={`section section--${tone}`} id="testimonials">
      <div className="container">
        <SectionHead eyebrow={t.eyebrow} title={t.title} />
        <div className="quotes">
          {t.items.map((q, i) => (
            <figure className="quote reveal" key={i}>
              <Quote size={28} aria-hidden="true" />
              <blockquote>{q.quote}</blockquote>
              <figcaption><strong>{q.name}</strong>{(q.role || q.company) && <span>{[q.role, q.company].filter(Boolean).join(', ')}</span>}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
