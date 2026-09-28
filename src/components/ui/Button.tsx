import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'measure' | 'danger'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-45 select-none whitespace-nowrap'
const variants: Record<Variant, string> = {
  primary: 'bg-prussian text-[var(--paper)] hover:bg-prussian-strong',
  secondary: 'border border-line bg-panel text-ink hover:border-ink-3',
  ghost: 'text-ink-2 hover:bg-panel-2 hover:text-ink',
  measure: 'bg-sodium text-[#1b1206] hover:bg-sodium-strong',
  danger: 'border border-line bg-panel text-bad hover:border-bad',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={cn(base, variants[variant], sizes[size], className)} {...rest} />
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  )
}
