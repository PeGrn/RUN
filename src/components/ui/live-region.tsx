'use client';

import { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  /**
   * 'polite' : Attend que l'utilisateur ait fini de parler/lire
   * 'assertive' : Interrompt immédiatement pour annoncer
   */
  politeness?: 'polite' | 'assertive';
  /**
   * Durée avant de clear le message (ms)
   * 0 = ne jamais clear
   */
  clearDelay?: number;
}

/**
 * Composant pour annoncer les changements dynamiques aux lecteurs d'écran
 *
 * Usage:
 * ```tsx
 * const [announcement, setAnnouncement] = useState('');
 *
 * const handleAction = () => {
 *   // ... faire quelque chose
 *   setAnnouncement('Action effectuée avec succès');
 * };
 *
 * return (
 *   <>
 *     <LiveRegion message={announcement} />
 *     <button onClick={handleAction}>Action</button>
 *   </>
 * );
 * ```
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  clearDelay = 3000
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearDelay > 0 && message) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearDelay);
      return () => clearTimeout(timer);
    }
  }, [message, clearDelay]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}
