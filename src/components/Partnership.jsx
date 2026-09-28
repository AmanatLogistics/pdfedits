import { company } from '../data/site.js'

const WHO = ['Wholesalers and distributors', 'Supermarkets and retail chains', 'Sweet makers and food manufacturers', 'Importers and exporters abroad', 'Private-label and bulk contracts']

export default function Partnership({ onPartner }) {
  return (
    <section className="partner" id="partnership">
      <div className="container partner__grid">
        <div>
          <span className="sec-num">§ 5</span>
          <h2>Trade with us, not just buy from us.</h2>
          <p>
            We are looking for long-term partners: businesses that need a steady supply of dry fruits or fresh fruits,
            and growers and exporters who want a reliable buyer in India.
          </p>
          <div className="partner__actions">
            <button type="button" className="button button--paper" onClick={onPartner}>Propose a partnership</button>
            <a className="partner__mail" href={`mailto:${company.partnershipEmail}?subject=${encodeURIComponent(`Business partnership with ${company.name}`)}`}>
              {company.partnershipEmail}
            </a>
          </div>
        </div>
        <ul className="partner__who">
          {WHO.map((w) => <li key={w}>{w}</li>)}
        </ul>
      </div>
    </section>
  )
}
