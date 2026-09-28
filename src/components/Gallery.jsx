import { plates } from '../data/site.js'
import Photo from './Photo.jsx'

const TONES = ['mango', 'pistachio', 'berry', 'sky']

export default function Gallery() {
  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <div className="heading">
          <span className="tag tag--berry">📸 Gallery</span>
          <h2>A taste of what we trade</h2>
          <p>Nuts, dried fruits and fresh fruits, sorted, graded and packed with care.</p>
        </div>
        <div className="gallery__grid">
          {plates.map((p, i) => (
            <figure className={`gallery__item gallery__item--${i}`} key={p.name}>
              <Photo photo={p} sizes="(max-width: 700px) 50vw, 300px" />
              <figcaption className={`chip chip--${TONES[i % TONES.length]}`}>{p.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
