'use client'

interface FilterTab {
  key: string
  label: string
  count: number
}

interface FilterTabsProps {
  tabs: FilterTab[]
  active: string
  onChange: (key: string) => void
}

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-bg border border-border rounded-[12px]">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-2 px-1.5 rounded-[9px] text-[13px] font-medium transition-all duration-150 ${
            active === t.key
              ? 'bg-surface text-accent shadow-[var(--shadow-xs)]'
              : 'text-muted bg-transparent'
          }`}
        >
          {t.label}
          <span className="text-[11px] opacity-65 ml-1">{t.count}</span>
        </button>
      ))}
    </div>
  )
}
