import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'

export default function Gallery({ content, tone, full }) {
  const { gallery: G } = content
  const items = (G.items || []).filter((g) => g.image?.src)
  if (!items.length) return null
  return (
    <section className={`section section--${tone}`} id="gallery">
      <div className="container">
        <SectionHead eyebrow={G.eyebrow} title={G.title} text={G.text} />
        <ul className={`gallery gallery--${Math.min(items.length, 6)} ${full ? 'gallery--full' : ''}`}>
          {items.map((g, i) => (
            <li key={i} className="gallery__item reveal" style={{ '--i': i }}>
              <Photo image={g.image} className="gallery__img" sizes={i === 0 ? '(max-width: 700px) 100vw, 50vw' : '(max-width: 700px) 50vw, 25vw'} />
              {g.caption && <span className="gallery__cap">{g.caption}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
