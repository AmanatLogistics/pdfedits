import { lanes, photos } from '../data/site.js'
import Photo from './Photo.jsx'

function LaneCard({ dir, title, emoji, items }) {
  return (
    <div className={`lane-card lane-card--${dir}`}>
      <div className="lane-card__head">
        <span className="lane-card__emoji" aria-hidden="true">{emoji}</span>
        <h3>{title}</h3>
      </div>
      <ul>
        {items.map((l) => (
          <li key={`${l.from}-${l.to}`}>
            <strong>{dir === 'import' ? l.from : l.to}</strong>
            <span>{l.goods}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Trade() {
  const imports = lanes.filter((l) => l.dir === 'Import')
  const exports = lanes.filter((l) => l.dir === 'Export')
  return (
    <section className="section trade" id="trade">
      <div className="container">
        <div className="heading">
          <span className="tag tag--sky">🇮🇳 India at the heart</span>
          <h2>Where we trade</h2>
          <p>Most of our trade flows in and out of India, connecting farms and buyers across Asia, the Middle East, Europe and the Americas.</p>
        </div>
        <div className="trade__grid">
          <LaneCard dir="import" title="We import into India from" emoji="📥" items={imports} />
          <LaneCard dir="export" title="We export from India to" emoji="📤" items={exports} />
        </div>
        <div className="trade__banner">
          <Photo photo={photos.ship} sizes="(max-width: 1240px) 100vw, 1200px" />
          <div className="trade__banner-text">
            <strong>By sea, air &amp; road</strong>
            <span>Tracked shipments, delivered on time</span>
          </div>
        </div>
      </div>
    </section>
  )
}
