import { company, photos } from '../data/site.js'
import Photo from './Photo.jsx'

const PRINCIPLES = [
  ['Bought at origin', 'We deal with growers and processors directly, in the regions each fruit grows best.'],
  ['Graded by hand', 'Every lot is sorted by size and grade and checked for moisture, colour and taste.'],
  ['Weighed honestly', 'The weight on the invoice is the weight in the sack. No exceptions.'],
  ['Papers in order', 'Invoices, certificate of origin, phytosanitary certificates and customs clearance, handled for you.'],
]

export default function House() {
  return (
    <section className="house" id="house">
      <div className="container house__grid">
        <div className="house__text">
          <header className="sec-head">
            <span className="sec-num">§ 4</span>
            <h2>The house</h2>
          </header>
          <p className="dropcap">
            {company.name} is a trading house for dry fruits and fresh fruits, working out of {company.city}. We started
            in {company.since} with a simple idea: buyers should get the grade they paid for, on the day they were promised it.
          </p>
          <p>
            Wholesalers, retailers, sweet makers and food manufacturers in India and abroad buy from us season after season,
            because the almonds in the sample are the almonds in the container.
          </p>
          <ol className="principles">
            {PRINCIPLES.map(([t, d]) => (
              <li key={t}><strong>{t}.</strong> {d}</li>
            ))}
          </ol>
        </div>
        <figure className="house__figure">
          <Photo photo={photos.truck} sizes="(max-width: 900px) 100vw, 40vw" />
          <figcaption>Pl. XIII — Sacks on the road, loaded for the market</figcaption>
        </figure>
      </div>
    </section>
  )
}
