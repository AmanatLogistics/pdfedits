import { company, photos } from '../data/site.js'
import Photo from './Photo.jsx'

const POINTS = [
  { emoji: '🌱', title: 'Straight from the source', text: 'We buy directly from farms and processors where each fruit grows best.', tone: 'pistachio' },
  { emoji: '⭐', title: 'Graded for quality', text: 'Every lot is sorted by size and grade and checked before it ships.', tone: 'mango' },
  { emoji: '⚖️', title: 'Honest weights', text: 'The weight on the invoice is the weight in the box.', tone: 'berry' },
  { emoji: '📄', title: 'Paperwork handled', text: 'Invoices, certificates of origin, phytosanitary papers and customs.', tone: 'sky' },
]

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container about__grid">
        <div className="about__photos">
          <Photo photo={photos.bazaar} className="about__photo about__photo--big" sizes="(max-width: 900px) 90vw, 440px" />
          <Photo photo={photos.truck} className="about__photo about__photo--small" sizes="240px" />
          <div className="about__badge">
            <strong>{new Date().getFullYear() - company.since}+</strong>
            <span>years of trading</span>
          </div>
        </div>
        <div>
          <span className="tag tag--pistachio">👋 About us</span>
          <h2>From the farm to your warehouse</h2>
          <p className="lead">
            {company.name} is an import and export company for dry fruits and fresh fruits. India is at the heart of
            everything we do: we bring in the finest nuts and dried fruits, and send out India’s best fresh fruit.
          </p>
          <p>
            Wholesalers, shops, supermarkets, sweet makers and food companies work with us for steady supply,
            fair prices and quality they can count on.
          </p>
          <div className="points">
            {POINTS.map((p) => (
              <div className={`point point--${p.tone}`} key={p.title}>
                <span className="point__emoji" aria-hidden="true">{p.emoji}</span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
