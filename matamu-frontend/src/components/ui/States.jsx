export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-text-muted">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      )}
      <p className="font-semibold text-text-primary">{title}</p>
      {description && <p className="text-sm text-text-secondary max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message = 'Failed to load data', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <p className="text-sm text-danger font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-text-secondary underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  )
}
