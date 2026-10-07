import { SealCheck } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'

export default function Certifications({ content, tone }) {
  const { certifications: c } = content
  if (!c.items?.length) return null
  return (
    <section className={`section section--${tone}`} id="certifications">
      <div className="container">
        <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.text} />
        <div className="certs">
          {c.items.map((it, i) => {
            const body = (
              <>
                {it.image?.src ? <img src={it.image.src} alt={it.image.alt || it.name} loading="lazy" /> : <SealCheck size={40} weight="duotone" />}
                <strong>{it.name}</strong>
                {it.number && <span>{it.number}</span>}
              </>
            )
            return it.link
              ? <a className="cert reveal" key={i} href={it.link} target="_blank" rel="noreferrer">{body}</a>
              : <div className="cert reveal" key={i}>{body}</div>
          })}
        </div>
      </div>
    </section>
  )
}
