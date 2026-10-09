import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  manualOffline: boolean;
  onResetManual?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  manualOffline,
  onResetManual,
}) => {
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5 rounded-xl bg-amber-950/90 border border-amber-600/50 px-3.5 py-2 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        <WifiOff className="w-4 h-4 text-amber-400" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      </div>

      <div className="flex flex-col">
        <span className="font-semibold text-amber-300 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Offline Mode Active
        </span>
        <span className="text-[11px] text-amber-300/80">
          {manualOffline
            ? 'Simulated offline • Local MTG Rules Engine running'
            : 'No internet connection • Local MTG Rules Engine running'}
        </span>
      </div>

      {manualOffline && onResetManual && (
        <button
          onClick={onResetManual}
          className="ml-2 px-2 py-1 rounded bg-amber-800/60 hover:bg-amber-700 text-[10px] text-amber-100 font-medium transition cursor-pointer"
        >
          Go Online
        </button>
      )}
    </div>
  );
};
