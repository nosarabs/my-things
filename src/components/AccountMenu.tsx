import { PersonIcon, SignOutIcon } from '@primer/octicons-react';
import type { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { signOut } from '../lib/supabase';
import styles from './Header.module.css';
import menu from './Menu.module.css';
import { Modal } from './Modal';

export function AccountMenu({ user }: { user: User }) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const { user_name, avatar_url } = user.user_metadata;
  const name = user_name ? `@${user_name}` : (user.email ?? 'your account');

  return (
    <>
      <button
        type="button"
        className={styles.avatarButton}
        aria-label="Account"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setAnchor({ x: box.right, y: box.bottom + 4 });
        }}
      >
        {avatar_url ? <img className={styles.avatar} src={avatar_url} alt="" /> : <PersonIcon size={16} />}
      </button>
      {anchor && (
        <Modal labelledBy="account-menu-title" anchor={anchor} onClose={() => setAnchor(null)}>
          <h2 id="account-menu-title" className={menu.title}>
            Signed in as {name}
          </h2>
          <div className={menu.list}>
            <button
              type="button"
              className={menu.item}
              onClick={() => {
                setAnchor(null);
                void signOut();
              }}
            >
              <SignOutIcon size={16} />
              Sign out
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
