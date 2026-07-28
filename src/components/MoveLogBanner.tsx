import React, { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { MoveLog, ThemeMode } from '../types';

interface MoveLogBannerProps {
  theme: ThemeMode;
  logs: MoveLog[];
}

export const MoveLogBanner: React.FC<MoveLogBannerProps> = ({ theme, logs }) => {
  const dark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);
  const latest = logs.length > 0 ? logs[logs.length - 1] : null;
  const prev = logs.length > 1 ? logs.slice(0, -1).reverse().slice(0, 6) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className={`rounded-xl border overflow-hidden ${
      dark ? 'bg-[#0f1623] border-white/8' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className={`flex items-center gap-1.5 px-3 py-2 border-b ${
        dark ? 'border-white/6' : 'border-slate-100'
      }`}>
        <Activity className="w-3 h-3 text-blue-500" />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Activity
        </span>
        {logs.length > 0 && (
          <span className={`ml-auto text-[9px] font-mono ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            {logs.length}
          </span>
        )}
      </div>

      <div className="px-3 py-2">
        {latest ? (
          <>
            <div className={`flex items-center gap-2 p-2 rounded-lg mb-1.5 ${
              dark ? 'bg-blue-500/8 border border-blue-500/15' : 'bg-blue-50 border border-blue-100'
            }`}>
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-black text-[10px]">{latest.calledNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-semibold truncate ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span className="text-blue-400">{latest.playerName}</span>
                  <span className={dark ? ' text-slate-500' : ' text-slate-400'}> called </span>
                  <span className="font-black">#{latest.calledNumber}</span>
                </p>
              </div>
              <span className={`text-[9px] font-mono shrink-0 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                {latest.timestamp}
              </span>
            </div>

            {prev.length > 0 && (
              <div ref={scrollRef} className="max-h-28 overflow-y-auto space-y-0.5">
                {prev.map(log => (
                  <div key={log.id} className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                    dark ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    <span className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[8px] shrink-0 ${
                      dark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'
                    }`}>{log.calledNumber}</span>
                    <span className="font-medium truncate flex-1">{log.playerName}</span>
                    <span className="font-mono text-[8px] shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className={`text-[10px] py-1 ${dark ? 'text-slate-700' : 'text-slate-400'}`}>
            Waiting for first move…
          </p>
        )}
      </div>
    </div>
  );
};
