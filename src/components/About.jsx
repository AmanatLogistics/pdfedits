import { Award, Leaf, Scale, Truck } from 'lucide-react'
import { company } from '../data/site.js'
import FruitArt from './FruitArt.jsx'

const POINTS = [
  { icon: Leaf, title: 'Sourced at origin', text: 'We buy directly from farms and processors in the regions each fruit grows best.' },
  { icon: Scale, title: 'Graded & weighed', text: 'Every lot is sorted by size and grade, with honest weights on every pack.' },
  { icon: Award, title: 'Quality checked', text: 'Moisture, colour and taste checked before anything leaves the warehouse.' },
  { icon: Truck, title: 'Delivered on time', text: 'Sea, air and road freight with the paperwork taken care of for you.' },
]

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container about__grid">
        <div className="about__art">
          <FruitArt art="almond" seed={21} className="about__img about__img--a" title="Almonds" />
          <FruitArt art="date" seed={5} className="about__img about__img--b" title="Dates" />
          <div className="about__years">
            <strong>{new Date().getFullYear() - company.since}+</strong>
            <span>years in the fruit trade</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">About {company.name}</p>
          <h2>From the orchards to your warehouse</h2>
          <p className="section__lead">
            {company.name} is an import and export house for dry fruits and fresh fruits. India is at the heart of
            our business: we bring the world’s best nuts and dried fruits into India, and we send India’s finest
            mangoes, grapes, pomegranates and cashews out to buyers abroad.
          </p>
          <p>
            Wholesalers, retailers, supermarkets, sweet makers and food manufacturers trust us for steady supply,
            fair prices and consistent quality — season after season.
          </p>
          <div className="about__points">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <div className="point" key={title}>
                <span className="point__icon"><Icon size={20} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
