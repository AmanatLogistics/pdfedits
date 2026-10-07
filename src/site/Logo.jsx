export default function Logo({ company, light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      {company.logo
        ? <img className="logo__img" src={company.logo} alt="" />
        : <span className="logo__mark" aria-hidden="true">{company.monogram || company.name?.slice(0, 2)}</span>}
      <span className="logo__text">
        <strong>{company.name}</strong>
        {company.tagline && <small>{company.tagline}</small>}
      </span>
    </span>
  )
}
