import { PlusIcon } from '@primer/octicons-react';
import styles from './EmptyCell.module.css';

export function EmptyCell({ onClick }: { onClick(): void }) {
  return (
    <button type="button" className={styles.cell} onClick={onClick} aria-label="Add tile">
      <PlusIcon size={24} />
    </button>
  );
}
