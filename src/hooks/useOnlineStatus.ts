import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isRealOnline, setIsRealOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsRealOnline(true);
    const handleOffline = () => setIsRealOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline: isRealOnline && !isSimulatedOffline,
    isRealOnline,
    isSimulatedOffline,
    toggleSimulatedOffline: () => setIsSimulatedOffline((prev) => !prev),
  };
}
