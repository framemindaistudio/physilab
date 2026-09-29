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
    case 'newtons-rings':
      return (
        <svg {...common}>
          {[4, 9, 13, 16.5, 19.5, 22.5, 25].map((r, i) => (
            <circle key={r} cx="32" cy="32" r={r} stroke={i % 2 ? ink : mark} strokeWidth={i % 2 ? 1.2 : 2} strokeOpacity={1 - i * 0.08} />
          ))}
          <circle cx="32" cy="32" r="2" fill={ink} />
        </svg>
      )
    case 'diffraction-grating':
      return (
        <svg {...common}>
          <path d="M32 58V34" stroke={ink} strokeWidth="3" />
          <path d="M22 34h20" stroke={ink} strokeWidth="3" />
          <path d="M32 34 10 8M32 34l-14-26M32 34l14-26M32 34 54 8" stroke={mark} strokeWidth="1.8" />
          <path d="M32 34V6" stroke={ink} strokeOpacity=".5" />
        </svg>
      )
    case 'malus-law':
      return (
        <svg {...common}>
          <ellipse cx="20" cy="32" rx="7" ry="20" stroke={ink} strokeWidth="1.8" />
          <path d="M20 16v32" stroke={ink} strokeOpacity=".6" />
          <ellipse cx="44" cy="32" rx="7" ry="20" stroke={ink} strokeWidth="1.8" />
          <path d="M38 20l12 24" stroke={mark} strokeWidth="2" />
          <path d="M4 32h10M28 32h8M52 32h8" stroke={mark} strokeWidth="2" strokeDasharray="2 3" />
        </svg>
      )
    case 'sonometer':
      return (
        <svg {...common}>
          <rect x="4" y="40" width="56" height="12" rx="2" fill={ink} fillOpacity=".25" />
          <path d="M12 40 16 32l4 8M44 40l4-8 4 8" stroke={ink} strokeWidth="1.8" />
          <path d="M16 32c8-14 24-14 32 0M16 32c8 14 24 14 32 0" stroke={mark} strokeWidth="1.8" />
          <path d="M4 32h56" stroke={ink} strokeOpacity=".5" />
        </svg>
      )
    case 'rc-circuit':
      return (
        <svg {...common}>
          <path d="M8 14c6 0 10 30 48 34" stroke={mark} strokeWidth="2.2" />
          <path d="M8 8v48h50" stroke={ink} strokeWidth="1.6" />
          <path d="M26 22h12M26 27h12" stroke={ink} strokeWidth="2.4" />
        </svg>
      )
    case 'planck-led':
      return (
        <svg {...common}>
          {[
            ['#c0392b', 12],
            ['#e8930c', 24],
            ['#2c7a4b', 36],
            ['#1d4e89', 48],
          ].map(([col, x]) => (
            <g key={x as number}>
              <path d={`M${x} 40v-14a6 6 0 0 1 12 0v14z`} fill={col as string} fillOpacity=".75" />
              <path d={`M${(x as number) + 3} 40v12M${(x as number) + 9} 40v10`} stroke={ink} strokeWidth="1.5" />
            </g>
          ))}
        </svg>
      )
    case 'band-gap':
      return (
        <svg {...common}>
          <rect x="8" y="8" width="48" height="14" fill={ink} fillOpacity=".25" />
          <rect x="8" y="42" width="48" height="14" fill={mark} fillOpacity=".35" />
          <path d="M24 42V24M40 42V24" stroke={mark} strokeWidth="1.8" strokeDasharray="2 2" />
          <circle cx="24" cy="18" r="3" fill={ink} />
          <circle cx="40" cy="18" r="3" fill={ink} />
        </svg>
      )
    case 'hall-effect':
      return (
        <svg {...common}>
          <rect x="10" y="18" width="44" height="28" rx="3" stroke={ink} strokeWidth="1.8" />
          <path d="M2 32h8M54 32h8" stroke={ink} strokeWidth="2" />
          {[16, 26, 36, 46].map((x) => (
            <circle key={x} cx={x} cy="42" r="2" fill={mark} />
          ))}
          <path d="M16 22h32" stroke={ink} strokeOpacity=".4" strokeDasharray="3 3" />
          <path d="M32 6v8" stroke={mark} strokeWidth="2" />
        </svg>
      )
    case 'fermi-energy':
      return (
        <svg {...common}>
          <path d="M6 16h22c6 0 6 32 12 32h18" stroke={ink} strokeWidth="2" />
          <path d="M6 16h22c2 0 3 4 4 12" stroke={mark} strokeWidth="2.4" />
          <path d="M32 8v48" stroke={ink} strokeOpacity=".4" strokeDasharray="2 3" />
          <path d="M6 56h52" stroke={ink} strokeOpacity=".5" />
        </svg>
      )
    case 'laser-wavelength':
      return (
        <svg {...common}>
          <rect x="4" y="27" width="14" height="10" rx="2" fill={ink} />
          <path d="M18 32h10" stroke={mark} strokeWidth="2" />
          <path d="M28 20v24" stroke={ink} strokeWidth="2.5" />
          <path d="M28 32 58 32M28 32l30-14M28 32l30 14" stroke={mark} strokeWidth="1.3" strokeOpacity=".7" />
          {[18, 32, 46].map((y) => (
            <circle key={y} cx="58" cy={y} r="2.8" fill={mark} />
          ))}
        </svg>
      )
    case 'optical-fiber':
      return (
        <svg {...common}>
          <path d="M4 44c14 0 18-24 32-24s18 12 24 12" stroke={ink} strokeWidth="9" strokeOpacity=".2" strokeLinecap="round" />
          <path d="M4 44c14 0 18-24 32-24s18 12 24 12" stroke={ink} strokeWidth="2" />
          <path d="M8 42l6-5 5 3 6-9 5 3 6-8 5 4 6-2 5 4 6-1" stroke={mark} strokeWidth="1.6" />
        </svg>
      )
    case 'four-probe':
      return (
        <svg {...common}>
          <rect x="6" y="40" width="52" height="10" rx="2" fill={ink} fillOpacity=".3" />
          {[16, 26, 38, 48].map((x, i) => (
            <path key={x} d={`M${x} 40V12`} stroke={i === 0 || i === 3 ? mark : ink} strokeWidth="2.6" />
          ))}
          <path d="M16 12h32" stroke={mark} strokeOpacity=".5" />
        </svg>
      )
    case 'lcr-resonance':
      return (
        <svg {...common}>
          <path d="M4 54c14 0 18-2 22-18s4-26 6-26 2 10 6 26 8 18 22 18" stroke={mark} strokeWidth="2.2" />
          <path d="M4 56h56M4 56V6" stroke={ink} strokeOpacity=".5" />
          <path d="M32 10v46" stroke={ink} strokeOpacity=".35" strokeDasharray="2 3" />
        </svg>
      )
    case 'black-box':
      return (
        <svg {...common}>
          <rect x="16" y="14" width="36" height="36" rx="5" fill={ink} />
          <path d="M4 24h12M4 40h12" stroke={ink} strokeWidth="2" />
          <text x="34" y="39" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--sodium)">?</text>
        </svg>
      )
    case 'photodiode':
      return (
        <svg {...common}>
          <path d="M22 22l16 10-16 10z" fill={ink} />
          <path d="M40 20v24M8 32h14M40 32h16" stroke={ink} strokeWidth="2" />
          <path d="M10 8l10 10M18 6l8 10" stroke={mark} strokeWidth="2" />
          <path d="M20 18l0-5-4 1M26 16l0-5-4 1" stroke={mark} strokeWidth="1.5" />
        </svg>
      )
    case 'dielectric-constant':
      return (
        <svg {...common}>
          <rect x="12" y="8" width="5" height="48" fill={ink} />
          <rect x="47" y="8" width="5" height="48" fill={ink} />
          <rect x="17" y="8" width="30" height="48" fill={mark} fillOpacity=".2" />
          {[16, 28, 40, 52].map((y) => (
            <g key={y}>
              <rect x="24" y={y - 4} width="8" height="4" fill="var(--bad)" />
              <rect x="32" y={y - 4} width="8" height="4" fill={ink} />
            </g>
          ))}
        </svg>
      )
    default:
      return <svg {...common} />
  }
}
