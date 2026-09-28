import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  FlaskConical,
  Gauge,
  GraduationCap,
  Info,
  LayoutGrid,
  Menu,
  Monitor,
  Moon,
  NotebookPen,
  Sun,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react'
import { setTheme, useThemeChoice, type ThemeChoice } from '@/store/theme'
import { cn } from '@/utils/cn'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/experiments', label: 'Experiments', icon: LayoutGrid },
  { to: '/lab', label: 'Virtual Lab', icon: FlaskConical },
  { to: '/theory', label: 'Theory', icon: BookOpen },
  { to: '/notebook', label: 'My Lab Notebook', icon: NotebookPen },
  { to: '/viva', label: 'Viva', icon: GraduationCap },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/about', label: 'About', icon: Info },
]

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="14" fill="var(--prussian)" />
        <path d="M16 14h32" stroke="var(--paper)" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 14 44 44" stroke="var(--paper)" strokeWidth="2.5" />
        <path d="M32 14v30" stroke="var(--paper)" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="44" cy="46" r="7" fill="var(--sodium)" />
      </svg>
      <span className="font-display text-[19px] font-extrabold tracking-[-0.02em] text-ink">PHYSILAB</span>
    </span>
  )
}

function ThemeSwitch() {
  const choice = useThemeChoice()
  const opts: { v: ThemeChoice; icon: LucideIcon; label: string }[] = [
    { v: 'light', icon: Sun, label: 'Light theme' },
    { v: 'system', icon: Monitor, label: 'Match system theme' },
    { v: 'dark', icon: Moon, label: 'Dark theme' },
  ]
  return (
    <div className="flex rounded-lg border border-line bg-panel p-0.5" role="radiogroup" aria-label="Colour theme">
      {opts.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={choice === v}
          aria-label={label}
          title={label}
          onClick={() => setTheme(v)}
          className={cn('grid h-7 flex-1 place-items-center rounded-md', choice === v ? 'bg-panel-2 text-ink' : 'text-ink-3 hover:text-ink')}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-prussian-soft font-medium text-prussian' : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
              )
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  const isHome = pathname === '/'

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-panel focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen flex-col border-r border-line bg-panel/80 px-3 py-5 backdrop-blur lg:flex">
        <NavLink to="/" className="mb-7 px-3" aria-label="PHYSILAB home">
          <Logo />
        </NavLink>
        <nav aria-label="Main">
          <NavItems />
        </nav>
        <div className="mt-auto space-y-3 px-1">
          <ThemeSwitch />
          <p className="px-2 text-[11px] leading-snug text-ink-3">Virtual Physics Laboratory for Engineering Education</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-panel/90 px-4 backdrop-blur lg:hidden">
        <NavLink to="/" aria-label="PHYSILAB home">
          <Logo />
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 hover:bg-panel-2"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {open && (
        <div id="mobile-nav" className="no-print fixed inset-x-0 top-14 z-30 border-b border-line bg-panel px-3 py-3 shadow-lg lg:hidden">
          <nav aria-label="Main">
            <NavItems onNavigate={() => setOpen(false)} />
          </nav>
          <div className="mt-3 px-1">
            <ThemeSwitch />
          </div>
        </div>
      )}

      <main id="main" className={cn('min-w-0', isHome ? '' : 'mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10')}>
        {children}
      </main>
    </div>
  )
}
