import { ArrowRight, ArrowUpRight, CalendarBlank, CheckCircle, MapPin, Package, WhatsappLogo } from '../ph.jsx'
import PageHero from './PageHero.jsx'
import Photo from '../Photo.jsx'
import { fmtDate, fmtNum, unitFor, unitOf } from '../trade.js'
import { freightName, label } from '../labels.js'
import { waHref } from '../hooks.js'
import { productPath } from '../pages.js'

// One product's own page: what it is, where it comes from, how it is packed and
// how much has been shipped, with a button to ask for a price. These pages let
// Google show the website for searches such as "Afghan dried figs".
export default function ProductPage({ content, trade, product: p, onAsk }) {
  const unit = unitOf(content)
  const T = (k) => label(content, k)
  const t = trade.byProduct.find((x) => x.name === p.title)
  const products = content.products || {}
  const others = (products.items || []).filter((x) => x.title && x.title !== p.title)
  const heading = p.heading || p.title
  const paragraphs = String(p.description || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)
  const facts = [
    p.origin && [T('origin'), p.origin],
    p.season && [T('season'), p.season],
    p.tag && [T('category'), p.tag],
    p.grades && [T('grades'), p.grades],
    p.packing && [T('packing'), p.packing],
    t?.tonnes > 0 && [T('shippedSoFar'), `${fmtNum(t.tonnes)} ${unitFor(t.tonnes, unit)}`],
  ].filter(Boolean)
  const wa = content.company?.whatsapp
  // This product's own consignments, newest first.
  const history = trade.recent.filter((r) => r.product === p.title).slice(0, 8)
  const hub = content.destinations?.hub || 'Kandahar'
  return (
    <>
      <PageHero content={content} trade={trade}
        page={{ label: p.title, title: heading, text: p.summary || products.text, image: p.image }}
        parent={{ label: content.pages?.products?.label || 'Products', path: '/products' }}
        stat={t?.tonnes > 0 ? <><strong>{fmtNum(t.tonnes)}</strong> {unitFor(t.tonnes, unit)} {T('shipped')}{t.orders ? <> · <strong>{fmtNum(t.orders)}</strong> {(content.statLabels?.orders || 'orders').toLowerCase()}</> : null}</> : null} />
      <section className="section section--white" id="product">
        <div className="container pdetail">
          <div className="pdetail__media reveal">
            <Photo image={p.image} className="pdetail__img" eager sizes="(max-width: 900px) 100vw, 45vw" />
            {p.tag && <span className="product__tag">{p.tag}</span>}
          </div>
          <div className="pdetail__body reveal">
            <p className="eyebrow">{content.company?.name}</p>
            <h2>{p.aboutTitle || `${T('about')} ${p.title.toLowerCase()}`}</h2>
            {paragraphs.map((x, i) => <p key={i} className={i === 0 ? 'pdetail__lead' : undefined}>{x}</p>)}
            {facts.length > 0 && (
              <dl className="pdetail__facts">
                {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            )}
            {p.points?.length > 0 && (
              <ul className="pdetail__points">
                {p.points.filter(Boolean).map((x, i) => <li key={i}><CheckCircle size={20} weight="duotone" /> {x}</li>)}
              </ul>
            )}
            <div className="pdetail__actions">
              <button type="button" className="btn btn--accent btn--lg" onClick={() => onAsk(p.title)}>{T('askPrice')} <ArrowRight size={18} weight="bold" /></button>
              {wa && <a className="btn btn--outline btn--lg" href={waHref(wa, `${content.whatsappButton?.message || ''} ${p.title}`.trim())} target="_blank" rel="noreferrer"><WhatsappLogo size={20} weight="fill" /> WhatsApp</a>}
            </div>
            <p className="pdetail__from"><MapPin size={16} weight="duotone" /> {content.company?.address}</p>
          </div>
        </div>
      </section>
      {history.length > 0 && (
        <section className="section section--gray" id="product-shipments">
          <div className="container">
            <div className="shead shead--split reveal">
              <div className="shead__main"><p className="eyebrow">{T('trackRecordWord')}</p><h2>{T('productShipments')} {p.title.toLowerCase()}</h2></div>
              <div className="shead__side"><a className="more-link" href="/track-record">{T('seeRecord')} <ArrowRight size={16} weight="bold" /></a></div>
            </div>
            <div className="phist reveal">
              <table>
                <thead><tr><th>{T('month')}</th><th>{T('amount')}</th><th>{T('route')}</th><th>{T('transport')}</th></tr></thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr key={i}>
                      <td>{fmtDate(r.date)}</td>
                      <td><strong>{fmtNum(r.tonnes)} {unitFor(r.tonnes, unit)}</strong></td>
                      <td>{r.direction === 'import' ? `${r.country} → ${hub}` : `${hub} → ${r.country}`}</td>
                      <td>{freightName(content, r.transport || 'road')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      {others.length > 0 && (
        <section className={`section section--${history.length ? 'white' : 'gray'}`} id="more-products">
          <div className="container">
            <div className="shead shead--split reveal">
              <div className="shead__main"><p className="eyebrow">{T('moreProducts')}</p><h2>{products.title}</h2></div>
              <div className="shead__side"><a className="more-link" href="/products">{T('allProductsLink')} <ArrowRight size={16} weight="bold" /></a></div>
            </div>
            <ul className="pmore">
              {others.slice(0, 4).map((x, i) => {
                const xt = trade.byProduct.find((y) => y.name === x.title)
                return (
                  <li key={x.title} className="reveal" style={{ '--i': i }}>
                    <a className="pmore__card" href={productPath(x.title)}>
                      <Photo image={x.image} className="pmore__img" sizes="(max-width: 700px) 50vw, 25vw" />
                      <span className="pmore__body">
                        <strong>{x.title}</strong>
                        <span>{xt?.tonnes > 0 ? <><Package size={15} weight="duotone" /> {fmtNum(xt.tonnes)} {unitFor(xt.tonnes, unit)} {T('shipped')}</> : x.season ? <><CalendarBlank size={15} weight="duotone" /> {x.season}</> : null}</span>
                      </span>
                      <ArrowUpRight size={18} weight="bold" className="pmore__go" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
