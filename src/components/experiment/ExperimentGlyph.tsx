/** Small line drawings of each apparatus, used on cards. Prussian ink, sodium for the measured thing. */
export function ExperimentGlyph({ id, size = 56 }: { id: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 64 64', fill: 'none', 'aria-hidden': true } as const
  const ink = 'var(--prussian)'
  const mark = 'var(--sodium)'
  switch (id) {
    case 'pendulum':
      return (
        <svg {...common}>
          <path d="M14 10h36" stroke={ink} strokeWidth="3" strokeLinecap="round" />
          <path d="M32 10 42 44" stroke={ink} strokeWidth="1.8" />
          <path d="M32 10v36" stroke={ink} strokeOpacity=".3" strokeDasharray="2 3" />
          <path d="M22 44a14 14 0 0 0 20 0" stroke={ink} strokeOpacity=".4" />
          <circle cx="43" cy="46" r="6" fill={mark} />
        </svg>
      )
    case 'projectile':
      return (
        <svg {...common}>
          <path d="M8 52h48" stroke={ink} strokeWidth="2" />
          <path d="M10 52C20 14 42 14 54 52" stroke={ink} strokeWidth="1.8" strokeDasharray="3 3" />
          <path d="M10 52l7-9" stroke={ink} strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="24" r="4.5" fill={mark} />
        </svg>
      )
    case 'ohms-law':
      return (
        <svg {...common}>
          <path d="M8 32h10l4-8 6 16 6-16 6 16 6-16 4 8h10" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="32" cy="50" r="7" stroke={ink} strokeWidth="1.8" />
          <path d="M32 50l4-4" stroke={mark} strokeWidth="2" strokeLinecap="round" />
          <path d="M20 14h24" stroke={mark} strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
        </svg>
      )
    case 'faraday':
      return (
        <svg {...common}>
          {[26, 31, 36, 41].map((x) => (
            <ellipse key={x} cx={x} cy="32" rx="3.5" ry="14" stroke="#b8732e" strokeWidth="1.8" />
          ))}
          <rect x="4" y="27" width="9" height="10" fill="#2e6db4" />
          <rect x="13" y="27" width="9" height="10" fill="#c0392b" />
          <path d="M50 22v20" stroke={mark} strokeWidth="2.2" />
          <path d="M46 38l4 5 4-5" stroke={mark} strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      )
    case 'double-slit':
      return (
        <svg {...common}>
          <path d="M18 8v18M18 30v4M18 38v18" stroke={ink} strokeWidth="3" />
          <path d="M22 22a12 12 0 0 1 0 12M26 18a18 18 0 0 1 0 20M30 14a24 24 0 0 1 0 28" stroke={ink} strokeOpacity=".5" />
          {[12, 20, 28, 36, 44, 52].map((y, i) => (
            <rect key={y} x="50" y={y - 2} width="6" height="4" fill={mark} opacity={i === 2 || i === 3 ? 1 : 0.45} />
          ))}
        </svg>
      )
    case 'photoelectric':
      return (
        <svg {...common}>
          <path d="M14 14v36" stroke={ink} strokeWidth="3" />
          <path d="M50 18v28" stroke={ink} strokeWidth="2.5" />
          <path d="M40 6l-4 4 3 2-4 4 3 2-6 5" stroke={mark} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="24" cy="30" r="2.5" fill={ink} />
          <circle cx="32" cy="36" r="2.5" fill={ink} />
          <circle cx="40" cy="28" r="2.5" fill={ink} />
          <path d="M20 58h24" stroke={ink} strokeOpacity=".4" />
        </svg>
      )
    default:
      return <svg {...common} />
  }
}
