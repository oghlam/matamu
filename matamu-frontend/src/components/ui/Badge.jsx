const variants = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent/10 text-accent',
  muted: 'bg-surface-2 text-text-secondary',
}

const dots = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
  muted: 'bg-text-muted',
}

// severity → badge variant mapping (used across the app)
export const severityVariant = {
  critical: 'danger',
  severe: 'danger',
  high: 'danger',
  moderate: 'warning',
  medium: 'warning',
  low: 'success',
}

export const statusVariant = {
  published: 'success',
  pending: 'accent',
  pending_verification: 'warning',
  acknowledged: 'accent',
  resolved: 'muted',
}

export default function Badge({ variant = 'muted', dot = true, children }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none',
        variants[variant] ?? variants.muted,
      ].join(' ')}
    >
      {dot && (
        <span
          className={['w-1.5 h-1.5 rounded-full shrink-0', dots[variant] ?? dots.muted].join(' ')}
        />
      )}
      {children}
    </span>
  )
}
