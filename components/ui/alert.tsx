export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant: AlertVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, { bg: string; icon: string }> = {
  info: { bg: 'bg-accent-light', icon: 'ℹ' },
  success: { bg: 'bg-green-light', icon: '✓' },
  warning: { bg: 'bg-amber-light', icon: '⚠' },
  error: { bg: 'bg-red-light', icon: '✕' },
};

export function Alert({ variant, title, description, icon, className = '' }: AlertProps) {
  const { bg, icon: defaultIcon } = variantClasses[variant];
  return (
    <div className={`flex items-start gap-3 rounded-btn p-3 pr-4 ${bg} ${className}`}>
      <span className="flex-shrink-0 text-[18px] leading-none mt-[1px]">
        {icon ?? defaultIcon}
      </span>
      <div className="flex flex-col gap-[2px]">
        <span className="text-[13px] font-semibold text-fg">{title}</span>
        {description && (
          <span className="text-[12px] text-fg2 leading-relaxed">{description}</span>
        )}
      </div>
    </div>
  );
}
