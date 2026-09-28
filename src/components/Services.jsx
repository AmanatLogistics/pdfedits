import { ClipboardCheck, FileText, PackageSearch, PlaneLanding, PlaneTakeoff, Warehouse } from 'lucide-react'

const SERVICES = [
  { icon: PlaneLanding, title: 'Import to India', text: 'Almonds, pistachios, walnuts, dates, raisins, figs and apricots sourced from Afghanistan, Iran, the USA and the Gulf.' },
  { icon: PlaneTakeoff, title: 'Export from India', text: 'Mangoes, pomegranates, grapes, apples, kinnow and cashews shipped to buyers in the Gulf, Asia and Europe.' },
  { icon: PackageSearch, title: 'Sourcing', text: 'We find the right grade, origin and price for your requirement, and share samples before you commit.' },
  { icon: ClipboardCheck, title: 'Quality Control', text: 'Size grading, moisture and visual checks on every lot, with photos and reports before dispatch.' },
  { icon: Warehouse, title: 'Packing & Storage', text: 'Bulk cartons, vacuum packs or private-label packing, with cold storage for fresh produce.' },
  { icon: FileText, title: 'Documentation & Logistics', text: 'Invoices, certificate of origin, phytosanitary certificates, customs clearance and freight by sea, air or road.' },
]

export default function Services() {
  return (
    <section className="section section--gray" id="services">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">What We Do</p>
          <h2>Complete Trade Services, From Sourcing to Delivery</h2>
          <p>One partner for the whole shipment: we handle buying, quality, packing, paperwork and freight.</p>
        </div>
        <div className="services">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <article className="service" key={title}>
              <span className="service__icon"><Icon size={26} strokeWidth={1.6} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
