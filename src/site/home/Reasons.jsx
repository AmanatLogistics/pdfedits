import SectionHead from '../SectionHead.jsx'
import { Icon } from '../icons.jsx'

export default function Reasons({ content }) {
  const R = content.home?.reasons || {}
  const items = (R.items || []).filter((r) => r.title)
  if (!items.length) return null
  return (
    <section className="section section--dark" id="why">
      <div className="container">
        <SectionHead eyebrow={R.eyebrow} title={R.title} text={R.text} align="split" light />
        <ul className="reasons">
          {items.map((r, i) => (
            <li key={i} className="reason reveal" style={{ '--i': i }}>
              <span className="reason__n">{String(i + 1).padStart(2, '0')}</span>
              <span className="reason__icon"><Icon name={r.icon} size={28} /></span>
              <h3>{r.title}</h3>
              {r.text && <p>{r.text}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
