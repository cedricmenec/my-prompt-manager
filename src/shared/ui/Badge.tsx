interface BadgeProps {
  label: string
}

export function Badge({ label }: BadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary-border">
      {label}
    </span>
  )
}
