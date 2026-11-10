import { useState, type ReactNode } from 'react';

interface Props {
  readonly onConfirm: () => void;
  readonly children: ReactNode;
  readonly confirmLabel?: string;
  readonly className?: string;
}

/** Двухшаговое подтверждение вместо window.confirm (в WebView диалоги ненадёжны). */
export function ConfirmButton({ onConfirm, children, confirmLabel = 'Точно?', className }: Props) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onBlur={() => { setArmed(false); }}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        onConfirm();
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
