import type { ReactNode } from 'react';

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`field block ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
