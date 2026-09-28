import { photos, plates } from '../data/site.js'
import Photo from './Photo.jsx'

const ROMAN = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

export default function Harvest() {
  return (
    <section className="harvest" id="harvest">
      <div className="container">
        <header className="sec-head sec-head--split">
          <div>
            <span className="sec-num">§ 2</span>
            <h2>From the orchard to the crate</h2>
          </div>
          <p>
            Afghan almonds and Iranian pistachios, Medjool dates, Kashmiri walnuts, Ratnagiri mangoes and Bhagwa
            pomegranates. Each lot is sorted, graded and packed before it is shipped.
          </p>
        </header>
        <div className="harvest__grid">
          <figure className="plate plate--lead">
            <Photo photo={photos.bazaar} sizes="(max-width: 700px) 100vw, 50vw" />
            <figcaption><span>Pl. {ROMAN[0]}</span> The bazaar, New Delhi</figcaption>
          </figure>
          {plates.map((p, i) => (
            <figure className={`plate plate--${i}`} key={p.name}>
              <Photo photo={p} sizes="(max-width: 700px) 50vw, 25vw" />
              <figcaption><span>Pl. {ROMAN[i + 1]}</span> {p.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
