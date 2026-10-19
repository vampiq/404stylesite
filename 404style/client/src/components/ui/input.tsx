import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const base = 'w-full rounded-xl border border-line bg-surface2/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/30';
type Invalid = { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Invalid>(({ className, invalid, ...p }, ref) => (
  <input ref={ref} aria-invalid={invalid} className={cn(base, invalid && 'border-red-500 focus:border-red-500', className)} {...p} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Invalid>(({ className, invalid, ...p }, ref) => (
  <textarea ref={ref} aria-invalid={invalid} className={cn(base, 'min-h-28 resize-y', invalid && 'border-red-500', className)} {...p} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Invalid>(({ className, invalid, children, ...p }, ref) => (
  <select ref={ref} aria-invalid={invalid} className={cn(base, 'appearance-none bg-no-repeat pr-10', invalid && 'border-red-500', className)} {...p}>{children}</select>
));
Select.displayName = 'Select';

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
      <span role="alert" className="mt-1 block min-h-4 text-xs text-red-400">{error}</span>
    </label>
  );
}
