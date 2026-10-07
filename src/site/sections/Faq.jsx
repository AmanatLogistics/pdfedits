import { Plus } from '../ph.jsx'

export default function Faq({ content, tone }) {
  const { faq } = content
  if (!faq.items?.length) return null
  return (
    <section className={`section section--${tone}`} id="faq">
      <div className="container faq">
        <div className="faq__head reveal">
          {faq.eyebrow && <p className="eyebrow">{faq.eyebrow}</p>}
          <h2>{faq.title}</h2>
          <a href="#contact" className="btn btn--primary">Ask a question</a>
        </div>
        <div className="faq__list reveal">
          {faq.items.map((f, i) => (
            <details key={i} className="faq__item">
              <summary><span>{f.q}</span><Plus size={18} weight="bold" aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
