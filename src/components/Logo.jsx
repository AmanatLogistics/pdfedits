export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#d9a441" />
      <path d="M32 12c10 6 15 16 13 27-2 9-8 14-13 14s-11-5-13-14c-2-11 3-21 13-27z" fill="#16382a" />
      <path d="M32 18v31" stroke="#d9a441" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
