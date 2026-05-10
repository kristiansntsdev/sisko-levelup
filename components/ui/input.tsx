export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-[6px]">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-fg2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-3 border-[1.5px] rounded-input text-[15px] bg-surface text-fg outline-none transition-colors duration-150 ${
          hasError
            ? 'border-red focus:border-red'
            : 'border-border focus:border-accent'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[12px] text-red">{error}</span>
      )}
    </div>
  );
}
