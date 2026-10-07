import SectionHead from '../SectionHead.jsx'
import { Icon } from '../icons.jsx'

export default function Services({ content, tone }) {
  const { services } = content
  return (
    <section className={`section section--${tone}`} id="services">
      <div className="container">
        <SectionHead eyebrow={services.eyebrow} title={services.title} text={services.text} align="split" />
        <div className="services">
          {services.items.map((s, i) => (
            <article className="service reveal" key={i}>
              <span className="service__icon"><Icon name={s.icon} size={26} strokeWidth={1.7} /></span>
              <span className="service__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
