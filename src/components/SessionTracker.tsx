'use client';
import { useEffect } from 'react';

interface Props {
  userId: string;
  parque: string | null;
}

/**
 * Fires a `session_start` analytics event once per browser session.
 * Rendered inside the protected layout — invisible, no UI.
 */
export default function SessionTracker({ userId, parque }: Props) {
  useEffect(() => {
    // Only fire once per tab session
    const key = `session_tracked_${userId}`;
    if (sessionStorage.getItem(key)) return;

    fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, parque }),
    }).then(() => {
      sessionStorage.setItem(key, '1');
    }).catch(() => { /* silent fail — analytics is non-critical */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
