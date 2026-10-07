import SectionHead from '../SectionHead.jsx'
import { Icon } from '../icons.jsx'

export default function Why({ content, tone }) {
  const { why } = content
  return (
    <section className={`section section--${tone}`} id="why">
      <div className="container">
        <SectionHead eyebrow={why.eyebrow} title={why.title} align="split" />
        <div className="why">
          {why.items.map((w, i) => (
            <div className="why__item reveal" key={i}>
              <span className="why__icon"><Icon name={w.icon} size={24} strokeWidth={1.7} /></span>
              <div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
