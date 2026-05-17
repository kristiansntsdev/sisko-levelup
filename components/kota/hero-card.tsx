interface HeroMeta {
  label: string
  value: string | number
}

interface HeroCardProps {
  label: string
  amount: string | number
  meta?: HeroMeta[]
  className?: string
}

export function HeroCard({ label, amount, meta, className = '' }: HeroCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] p-[22px] bg-accent text-white ${className}`}
    >
      {/* decorative circles */}
      <div className="absolute -right-10 -top-10 w-[170px] h-[170px] rounded-full bg-white/[0.08]" />
      <div className="absolute right-[60px] -bottom-[50px] w-[120px] h-[120px] rounded-full bg-white/[0.05]" />

      <p className="relative text-[12px] font-semibold uppercase tracking-[0.3px] opacity-80">{label}</p>
      <p className="relative text-[32px] font-bold mt-1.5 tracking-[-0.5px] leading-none">{amount}</p>

      {meta && meta.length > 0 && (
        <div className="relative flex gap-4 mt-3.5">
          {meta.map((m) => (
            <div key={m.label} className="text-[12px] opacity-85">
              {m.label}
              <b className="block text-[14px] opacity-100 font-bold mt-0.5">{m.value}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
