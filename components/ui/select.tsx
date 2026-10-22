export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-[6px]">
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-medium text-fg2">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-3 border-[1.5px] rounded-input text-[15px] bg-surface text-fg outline-none transition-colors duration-150 ${
          hasError
            ? 'border-red focus:border-red'
            : 'border-border focus:border-accent'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="text-[12px] text-red">{error}</span>
      )}
    </div>
  );
}
