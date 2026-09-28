import { company, ledger, tradeByYear } from '../data/site.js'

const fmt = (n) => n.toLocaleString('en-IN')

export default function Ledger() {
  const max = Math.max(...tradeByYear.flatMap((y) => [y.imported, y.exported]))
  const first = tradeByYear[0].year
  const last = tradeByYear[tradeByYear.length - 1].year
  return (
    <section className="ledger" id="ledger">
      <div className="container ledger__page">
        <header className="sec-head">
          <span className="sec-num">§ 1</span>
          <h2>The ledger</h2>
          <p>What has passed through our books since {company.since}. Every figure is a delivery that was weighed, paid for and signed off.</p>
        </header>

        <div className="ledger__totals">
          {ledger.map((l) => (
            <div className={`ledger__row ledger__row--${l.key}`} key={l.key}>
              <span className="ledger__label">{l.label}</span>
              <span className="ledger__dots" aria-hidden="true" />
              <span className="ledger__value">{fmt(l.value)}</span>
              <span className="ledger__unit">{l.unit}</span>
            </div>
          ))}
        </div>

        <div className="ledger__years">
          <div className="ledger__years-head">
            <h3>Year by year, {first}–{last}</h3>
            <p className="legend">
              <span><i className="key key--import" /> Imported</span>
              <span><i className="key key--export" /> Exported</span>
              <span className="legend__unit">tonnes</span>
            </p>
          </div>
          <table>
            <caption className="sr-only">Tonnes imported and exported each year</caption>
            <thead>
              <tr><th scope="col">Year</th><th scope="col">Imported</th><th scope="col">Exported</th><th scope="col" className="ledger__bars-h"><span className="sr-only">Comparison</span></th></tr>
            </thead>
            <tbody>
              {tradeByYear.map((y) => (
                <tr key={y.year}>
                  <th scope="row">{y.year}</th>
                  <td>{fmt(y.imported)}</td>
                  <td>{fmt(y.exported)}</td>
                  <td className="ledger__bars" aria-hidden="true">
                    <span className="bar bar--import" style={{ width: `${(y.imported / max) * 100}%` }} />
                    <span className="bar bar--export" style={{ width: `${(y.exported / max) * 100}%` }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
