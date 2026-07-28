'use client';

import { useEffect, useState } from 'react';

interface Props {
  message: string | null;
  onDismiss: () => void;
}

export default function InsiderAlertToast({ message, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message || !visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border"
      style={{
        background: 'rgba(22,28,45,.95)',
        borderColor: 'rgba(234,179,8,.3)',
        color: '#facc15',
        backdropFilter: 'blur(12px)',
      }}
    >
      {message}
    </div>
  );
}
