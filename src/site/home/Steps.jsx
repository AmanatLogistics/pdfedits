import { ArrowRight } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'

export default function Steps({ content, contactHref }) {
  const S = content.home?.steps || {}
  const items = (S.items || []).filter((s) => s.title)
  if (!items.length) return null
  return (
    <section className="section section--gray" id="how">
      <div className="container">
        <SectionHead eyebrow={S.eyebrow} title={S.title} text={S.text} />
        <ol className="timeline" style={{ '--n': items.length }}>
          {items.map((s, i) => (
            <li key={i} className="timeline__step reveal" style={{ '--i': i }}>
              <span className="timeline__n">{i + 1}</span>
              <h3>{s.title}</h3>
              {s.text && <p>{s.text}</p>}
            </li>
          ))}
        </ol>
        {contactHref && S.button && (
          <div className="timeline__cta reveal">
            <a href={contactHref} className="btn btn--primary btn--lg">{S.button} <ArrowRight size={18} weight="bold" /></a>
          </div>
        )}
      </div>
    </section>
  )
}
