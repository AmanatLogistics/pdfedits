import { ClipboardList, FileCheck2, PackageOpen, Search, Ship } from 'lucide-react'

const STEPS = [
  { icon: ClipboardList, title: 'Share your requirement', text: 'Product, grade, quantity, packing and destination.' },
  { icon: Search, title: 'Sourcing & samples', text: 'We source the right lot and share samples or photos.' },
  { icon: PackageOpen, title: 'Grading & packing', text: 'Sorted, quality checked and packed to your spec.' },
  { icon: FileCheck2, title: 'Documents & customs', text: 'Invoices, certificate of origin, phytosanitary and clearance.' },
  { icon: Ship, title: 'Shipping & delivery', text: 'Tracked door-to-port or door-to-door delivery.' },
]

export default function Process() {
  return (
    <section className="section process" id="process">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">How it works</p>
          <h2>Simple, transparent ordering</h2>
        </div>
        <ol className="steps">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li className="step" key={title}>
              <span className="step__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="step__icon"><Icon size={24} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
