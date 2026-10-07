import SectionHead from '../SectionHead.jsx'

export default function Process({ content, tone }) {
  const { process } = content
  return (
    <section className={`section section--${tone}`} id="process">
      <div className="container">
        <SectionHead eyebrow={process.eyebrow} title={process.title} />
        <ol className="steps" style={{ '--n': process.steps.length }}>
          {process.steps.map((s, i) => (
            <li className="step reveal" key={i}>
              <span className="step__num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
