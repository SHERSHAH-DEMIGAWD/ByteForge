interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  subtext?: string
  variant?: 'default' | 'success' | 'danger'
  className?: string
}

export function MetricCard({ title, value, unit, subtext, variant = 'default', className = '' }: MetricCardProps) {
  const variantClasses = {
    default: 'text-primary',
    success: 'text-accent',
    danger: 'text-destructive',
  }

  return (
    <div className={`bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 hover:border-border/60 transition-all ${className}`}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </div>
      <div className={`text-3xl font-bold ${variantClasses[variant]}`}>
        {value}
        {unit && <span className="text-lg ml-2">{unit}</span>}
      </div>
      {subtext && <div className="text-xs text-muted-foreground mt-2">{subtext}</div>}
    </div>
  )
}
