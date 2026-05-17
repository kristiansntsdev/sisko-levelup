interface SummaryTileProps {
  label: string
  value: string | number
  sub?: string
  valueColor?: string
  className?: string
}

export function SummaryTile({ label, value, sub, valueColor, className = '' }: SummaryTileProps) {
  return (
    <div className={`flex-1 bg-surface border border-border rounded-[14px] p-[13px] ${className}`}>
      <p className="text-[11px] font-semibold text-muted uppercase tracking-[0.5px]">{label}</p>
      <p
        className="text-[20px] font-bold mt-1 leading-none"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
    </div>
  )
}
