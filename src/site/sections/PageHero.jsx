import { CaretRight } from '../ph.jsx'
import Photo from '../Photo.jsx'
import { fmtNum, unitOf } from '../trade.js'
import { label } from '../labels.js'

// The banner at the top of every page except the home page.
export default function PageHero({ content, page, trade }) {
  const unit = unitOf(content)
  return (
    <section className="phero" id="top">
      <Photo image={page.image} eager className="phero__bg" sizes="100vw" />
      <div className="phero__shade" aria-hidden="true" />
      <div className="container phero__inner">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/">{label(content, 'home')}</a><CaretRight size={13} weight="bold" /><span aria-current="page">{page.label}</span>
        </nav>
        <h1>{page.title || page.label}</h1>
        {page.text && <p>{page.text}</p>}
        {trade.shipped > 0 && (
          <p className="phero__stat">
            <strong>{fmtNum(trade.shipped)}</strong> {unit} {label(content, 'shipped')} · <strong>{fmtNum(trade.orders)}</strong> {(content.statLabels?.orders || 'Orders completed').toLowerCase()}
          </p>
        )}
      </div>
    </section>
  )
}
