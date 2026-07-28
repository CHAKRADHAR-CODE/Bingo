import React from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  return (
    <div className="fixed top-11 left-0 right-0 z-40 bg-red-600/90 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>NO INTERNET CONNECTION - Playing in Offline AI Mode</span>
    </div>
  );
};
