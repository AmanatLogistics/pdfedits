import Photo from '../Photo.jsx'
import { Icon } from '../icons.jsx'

export default function About({ content, tone }) {
  const { about, company } = content
  const years = Math.max(0, new Date().getFullYear() - Number(company.since || 0))
  return (
    <section className={`section section--${tone}`} id="about">
      <div className="container about">
        <div className="about__media reveal">
          <Photo image={about.image} className="about__img" sizes="(max-width: 900px) 100vw, 600px" />
          {about.image2?.src && <Photo image={about.image2} className="about__img2" sizes="260px" />}
          {company.since > 0 && about.badgeText && (
            <div className="about__badge">
              <strong suppressHydrationWarning>{years}+</strong>
              <span>{about.badgeText}</span>
            </div>
          )}
        </div>
        <div className="about__text reveal">
          {about.eyebrow && <p className="eyebrow">{about.eyebrow}</p>}
          <h2>{about.title}</h2>
          {about.lead && <p className="lead">{about.lead}</p>}
          {about.text && <p>{about.text}</p>}
          {about.points?.length > 0 && (
            <ul className="features">
              {about.points.map((p, i) => (
                <li key={i} style={{ '--i': i }}>
                  <span className="features__icon"><Icon name={p.icon} size={26} /></span>
                  <div><h3>{p.title}</h3><p>{p.text}</p></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
