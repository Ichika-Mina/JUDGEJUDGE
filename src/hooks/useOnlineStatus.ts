import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [networkOnline, setNetworkOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [manualOffline, setManualOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isOnline = networkOnline && !manualOffline;

  const toggleManualOffline = () => {
    setManualOffline((prev) => !prev);
  };

  return {
    isOnline,
    networkOnline,
    manualOffline,
    toggleManualOffline,
    setManualOffline,
  };
}
