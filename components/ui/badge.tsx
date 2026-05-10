export type BadgeVariant = 'accent' | 'green' | 'red' | 'amber' | 'purple' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: 'bg-accent-light text-accent-dark',
  green: 'bg-green-light text-green-dark',
  red: 'bg-red-light text-red-dark',
  amber: 'bg-amber-light text-amber-dark',
  purple: 'bg-purple-light text-purple-dark',
  neutral: 'bg-bg text-muted border border-border',
};

export function Badge({ variant = 'accent', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-[9px] py-[3px] rounded-badge text-[11px] font-medium uppercase tracking-[0.5px] whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
