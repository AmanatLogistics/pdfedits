// The Faiz Fayez emblem: an "FF" monogram in a framed square, drawn in the
// brand colours. Used unless a logo image is uploaded.
export function Emblem({ size = 44, className = '' }) {
  return (
    <svg className={`emblem ${className}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="var(--primary, #6b3a1a)" />
      <rect x="5.5" y="5.5" width="37" height="37" rx="8.5" fill="none" stroke="var(--accent, #c9962b)" stroke-opacity=".5" stroke-width="1" />
      <path d="M13 13h11v3.6h-7v5h6v3.6h-6V35h-4Z" fill="var(--accent, #c9962b)" />
      <path d="M24 17h11v3.6h-7v5h6v3.6h-6V39h-4Z" fill="#f3e3bf" />
    </svg>
  )
}

export default function Logo({ company, light = false }) {
  const name = String(company.name || '')
  const m = name.match(/^(.*?)\s+(LTD\.?|Ltd\.?|Limited|LLC|Co\.?)$/)
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      {company.logo ? <img className="logo__img" src={company.logo} alt="" /> : <Emblem className="logo__mark" />}
      <span className="logo__text">
        <strong>{m ? <>{m[1]} <span className="logo__suffix">{m[2]}</span></> : name}</strong>
        {company.tagline && <small>{company.tagline}</small>}
      </span>
    </span>
  )
}
