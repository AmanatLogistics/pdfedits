import { lanes, photos } from '../data/site.js'
import Photo from './Photo.jsx'

export default function Lanes() {
  return (
    <section className="lanes" id="lanes">
      <div className="container lanes__grid">
        <figure className="lanes__figure">
          <Photo photo={photos.ship} sizes="(max-width: 900px) 100vw, 40vw" />
          <figcaption>Pl. XII — Containers at port. Our goods move by sea, air and road.</figcaption>
        </figure>
        <div>
          <header className="sec-head">
            <span className="sec-num">§ 3</span>
            <h2>Trade lanes</h2>
            <p>India sits at one end of nearly every lane we run. Fruit comes in from the orchards of Central Asia, Iran, the Gulf and the Americas, and goes out to the Gulf, South Asia, South-East Asia and Europe.</p>
          </header>
          <table className="manifest">
            <thead>
              <tr><th scope="col">From</th><th scope="col" /><th scope="col">To</th><th scope="col">Goods</th></tr>
            </thead>
            <tbody>
              {lanes.map((l) => (
                <tr key={`${l.from}-${l.to}`}>
                  <td>{l.from}</td>
                  <td><span className={`dir dir--${l.dir.toLowerCase()}`}>{l.dir}</span></td>
                  <td>{l.to}</td>
                  <td className="manifest__goods">{l.goods}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
