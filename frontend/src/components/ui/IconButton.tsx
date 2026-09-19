import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
}

export function IconButton({ children, label, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid place-items-center w-[30px] h-[30px] rounded-sm bg-transparent border border-divider text-neutral-400 cursor-pointer hover:text-accent-300 hover:border-accent-700 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
