import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { lanes, photos } from '../data/site.js'
import Photo from './Photo.jsx'

export default function Reach() {
  const imports = lanes.filter((l) => l.dir === 'Import')
  const exports = lanes.filter((l) => l.dir === 'Export')
  return (
    <section className="reach" id="reach">
      <Photo photo={photos.ship} className="reach__bg" sizes="100vw" />
      <div className="reach__overlay" aria-hidden="true" />
      <div className="container reach__content">
        <div className="section-head section-head--light">
          <p className="eyebrow">Global Reach</p>
          <h2>India at the Centre of Our Trade Network</h2>
          <p>We move goods by sea, air and road between India and partner markets across four continents.</p>
        </div>
        <div className="reach__grid">
          <div className="reach__col">
            <h3><ArrowDownLeft size={22} /> Imports into India</h3>
            <ul>
              {imports.map((l) => <li key={l.from}><strong>{l.from}</strong><span>{l.goods}</span></li>)}
            </ul>
          </div>
          <div className="reach__col">
            <h3><ArrowUpRight size={22} /> Exports from India</h3>
            <ul>
              {exports.map((l) => <li key={l.to}><strong>{l.to}</strong><span>{l.goods}</span></li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
