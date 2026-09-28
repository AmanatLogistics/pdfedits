import { Check } from 'lucide-react'
import { company, photos } from '../data/site.js'
import Photo from './Photo.jsx'

const POINTS = [
  'Direct sourcing from growers and processors',
  'Every lot sorted, graded and quality checked',
  'Accurate weights and transparent pricing',
  'Bulk and custom packing to buyer specification',
]

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container about">
        <div className="about__media">
          <Photo photo={photos.bazaar} className="about__img" sizes="(max-width: 900px) 100vw, 560px" />
          <div className="about__years">
            <strong>{new Date().getFullYear() - company.since}+</strong>
            <span>Years in the<br />fruit trade</span>
          </div>
        </div>
        <div className="about__text">
          <p className="eyebrow">About Us</p>
          <h2>A Trusted Name in Dry Fruit &amp; Fresh Fruit Trade</h2>
          <p className="lead">
            {company.name} is an import and export company specialising in dry fruits and fresh fruits. From our base in
            {' '}{company.city}, we supply wholesalers, retailers, food manufacturers and distributors in India and overseas.
          </p>
          <p>
            We bring premium almonds, pistachios, walnuts, dates and raisins into India, and export Indian mangoes,
            pomegranates, grapes and cashews to markets across the Middle East, Asia and Europe.
          </p>
          <ul className="checklist">
            {POINTS.map((p) => <li key={p}><Check size={18} /> {p}</li>)}
          </ul>
          <a href="#contact" className="btn btn--dark">Contact Our Team</a>
        </div>
      </div>
    </section>
  )
}
