import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Alert from '@radix-ui/react-alert-dialog';
import { X } from 'lucide-react';
import { Button } from './button';

const overlay = 'fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0';
const panel = 'fixed left-1/2 top-1/2 z-[91] max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-glowP data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95';

export function Modal({ open, onOpenChange, title, children, wide }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content className={`${panel} ${wide ? 'max-w-3xl' : 'max-w-lg'}`} aria-describedby={undefined}>
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="font-display text-xl font-bold">{title}</Dialog.Title>
            <Dialog.Close aria-label="Закрыть" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X size={18} /></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, text, confirmLabel = 'Удалить', onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; text: string; confirmLabel?: string; onConfirm: () => void }) {
  return (
    <Alert.Root open={open} onOpenChange={onOpenChange}>
      <Alert.Portal>
        <Alert.Overlay className={overlay} />
        <Alert.Content className={`${panel} max-w-md`}>
          <Alert.Title className="font-display text-xl font-bold">{title}</Alert.Title>
          <Alert.Description className="mt-2 text-muted">{text}</Alert.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Alert.Cancel asChild><Button variant="secondary">Отмена</Button></Alert.Cancel>
            <Alert.Action asChild><Button className="bg-red-500 text-white shadow-none hover:brightness-110" onClick={onConfirm}>{confirmLabel}</Button></Alert.Action>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  );
}
