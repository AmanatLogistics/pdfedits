import { useEffect, useState } from 'preact/hooks'
import { CaretRight, X } from '../ph.jsx'
import SectionHead from '../SectionHead.jsx'
import Photo from '../Photo.jsx'

// A large view of one photo, with arrows to move through the gallery.
function Lightbox({ items, index, onClose, onMove }) {
  const g = items[index]
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onMove(1)
      if (e.key === 'ArrowLeft') onMove(-1)
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow }
  }, [onClose, onMove])
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={g.caption || 'Photo'} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <figure className="lightbox__figure">
        <Photo key={index} image={g.image} eager className="lightbox__img" sizes="100vw" />
        {g.caption && <figcaption>{g.caption} <span>{index + 1} / {items.length}</span></figcaption>}
      </figure>
      <button type="button" className="lightbox__btn lightbox__close" onClick={onClose} aria-label="Close"><X size={22} weight="bold" /></button>
      {items.length > 1 && (
        <>
          <button type="button" className="lightbox__btn lightbox__prev" onClick={() => onMove(-1)} aria-label="Previous photo"><CaretRight size={22} weight="bold" /></button>
          <button type="button" className="lightbox__btn lightbox__next" onClick={() => onMove(1)} aria-label="Next photo"><CaretRight size={22} weight="bold" /></button>
        </>
      )}
    </div>
  )
}

export default function Gallery({ content, tone }) {
  const { gallery: G } = content
  const items = (G.items || []).filter((g) => g.image?.src)
  const [open, setOpen] = useState(null)
  if (!items.length) return null
  const move = (d) => setOpen((i) => (i + d + items.length) % items.length)
  return (
    <section className={`section section--${tone}`} id="gallery">
      <div className="container">
        <SectionHead eyebrow={G.eyebrow} title={G.title} text={G.text} />
        <ul className="gallery">
          {items.map((g, i) => (
            <li key={i} className="gallery__item reveal" style={{ '--i': i }}>
              <button type="button" className="gallery__open" onClick={() => setOpen(i)} aria-label={`View larger: ${g.caption || g.image.alt || 'photo'}`}>
                <Photo image={g.image} className="gallery__img" sizes={i === 0 ? '(max-width: 760px) 100vw, 66vw' : '(max-width: 760px) 50vw, 33vw'} />
                {g.caption && <span className="gallery__cap">{g.caption}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open !== null && <Lightbox items={items} index={open} onClose={() => setOpen(null)} onMove={move} />}
    </section>
  )
}
