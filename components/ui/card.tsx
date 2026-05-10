export type CardVariant = 'default' | 'elevated';

export interface CardProps {
  variant?: CardVariant;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

const variantClasses: Record<CardVariant, string> = {
  default: '',
  elevated: 'shadow-sm',
};

export function Card({ variant = 'default', as: Tag = 'div', children, className = '', ...props }: CardProps) {
  return (
    <Tag
      className={`bg-surface border border-border rounded-card overflow-hidden ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
