'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

const EliteAmbientScene = dynamic(() => import('@/components/ui/EliteAmbientScene'), {
  ssr: false,
  loading: () => <div className="elite-ambient-fallback" aria-hidden />,
});

export default function EliteAmbientCanvas() {
  const reduceMotion = useReducedMotion();
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (reduceMotion || !tabVisible) {
    return <div className="elite-ambient-fallback" aria-hidden />;
  }

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none" aria-hidden>
      <EliteAmbientScene />
    </div>
  );
}
