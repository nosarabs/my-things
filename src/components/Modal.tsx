import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './Modal.module.css';

type Props = {
  labelledBy: string;
  /** Desktop only: open as a small popover at this viewport point instead of centered. */
  anchor?: { x: number; y: number };
  onClose(): void;
  children: ReactNode;
};

/** A native modal dialog that shows as a bottom sheet on phones. Closing unmounts it via onClose. */
export function Modal({ labelledBy, anchor, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className={anchor ? `${styles.modal} ${styles.anchored}` : styles.modal}
      style={anchor && ({ '--x': `${anchor.x}px`, '--y': `${anchor.y}px` } as CSSProperties)}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onPointerDown={(event) => (pressedBackdrop.current = event.target === event.currentTarget)}
      onClick={(event) => pressedBackdrop.current && event.target === event.currentTarget && onClose()}
    >
      {children}
    </dialog>
  );
}
