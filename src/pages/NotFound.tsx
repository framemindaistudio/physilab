import { ButtonLink } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="readout text-6xl font-medium text-ink-3">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">This page is not on the bench</h1>
      <p className="mt-2 text-ink-2">The link may be mistyped, or the experiment may not exist yet.</p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink to="/experiments" variant="primary">
          Browse experiments
        </ButtonLink>
        <ButtonLink to="/">Home</ButtonLink>
      </div>
    </div>
  )
}
