import { plates } from '../data/site.js'
import Photo from './Photo.jsx'

const SHOWN = ['Almonds', 'Cashews', 'Pistachios', 'Dates', 'Mangoes', 'Pomegranates', 'Walnuts', 'Dried apricots']

export default function Gallery() {
  const items = SHOWN.map((n) => plates.find((p) => p.name === n)).filter(Boolean)
  return (
    <section className="section" id="gallery">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">What We Trade</p>
          <h2>Dry Fruits &amp; Fresh Fruits</h2>
          <p>A selection of the produce we import and export throughout the year.</p>
        </div>
        <div className="gallery">
          {items.map((p) => (
            <figure className="gallery__item" key={p.name}>
              <Photo photo={p} sizes="(max-width: 700px) 50vw, 300px" />
              <figcaption>{p.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
