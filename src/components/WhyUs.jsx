import { BadgeCheck, Clock3, Globe2, Handshake, Scale, ShieldCheck } from 'lucide-react'

const REASONS = [
  { icon: BadgeCheck, title: 'Consistent Quality', text: 'The grade in the sample is the grade in the shipment.' },
  { icon: Scale, title: 'Fair, Transparent Pricing', text: 'Clear quotes with no hidden charges.' },
  { icon: Clock3, title: 'Reliable Timelines', text: 'Shipments planned and dispatched on the dates we commit to.' },
  { icon: ShieldCheck, title: 'Compliance Handled', text: 'Export and import paperwork prepared correctly, first time.' },
  { icon: Globe2, title: 'Strong Network', text: 'Established partners at origin and in destination markets.' },
  { icon: Handshake, title: 'Long-Term Relationships', text: 'Most of our buyers come back season after season.' },
]

export default function WhyUs() {
  return (
    <section className="section section--dark" id="why">
      <div className="container">
        <div className="section-head section-head--light">
          <p className="eyebrow">Why Choose Us</p>
          <h2>What Our Buyers Value</h2>
        </div>
        <div className="reasons">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <div className="reason" key={title}>
              <Icon size={30} strokeWidth={1.5} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
