import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { IconButton } from './IconButton';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function Modal({ title, onClose, children, footer }: Props) {
  return (
    <div className="dialog-backdrop animate-sp-fade" style={{ zIndex: 30 }}>
      <div className="dialog w-full" style={{ maxWidth: 520, maxHeight: '86vh', overflow: 'auto', padding: 'var(--space-8)' }}>
        <div className="flex items-center justify-between gap-4 font-heading text-xl">
          {title}
          <IconButton label="Close" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>
        <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {children}
        </div>
        <div className="flex justify-end gap-3 mt-8">{footer}</div>
      </div>
    </div>
  );
}
