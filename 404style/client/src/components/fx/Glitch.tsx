import { cn } from '@/lib/utils';

/** RGB-split глитч. children — только строка (дублируется в data-text). */
export function Glitch({ children, className, scan = false }: { children: string; className?: string; scan?: boolean }) {
  return (
    <span className={cn('glitch', scan && 'scanlines', className)} data-text={children}>
      {children}
    </span>
  );
}
