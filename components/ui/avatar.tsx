export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-[13px]',
  lg: 'w-12 h-12 text-[15px]',
};

export function Avatar({ src, alt = '', initials, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center ${sizeClasses[size]} ${!src ? 'bg-accent-light text-accent-dark font-semibold' : ''} ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <span>{initials ?? '?'}</span>
      )}
    </div>
  );
}
