import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { ThemeMode } from '../types';

interface IntroScreenProps {
  theme: ThemeMode;
  onEnter: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ theme, onEnter }) => {
  const [phase, setPhase] = useState(0); // 0→logo 1→title 2→ready
  const dark = theme === 'dark';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center select-none ${
        dark ? 'bg-[var(--surface-1)]' : 'bg-slate-50 light-mode'
      }`}
    >
      {/* Subtle radial background glow */}
      {dark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)',
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-md">

        {/* Animated Logo Container */}
        <div
          className={`relative mb-10 transition-all duration-700 ${
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          {/* Expanding rings animation */}
          {dark && phase >= 1 && (
            <>
              <div className="absolute inset-0 rounded-full border border-amber-500/20 ring-expand" style={{ animationDelay: '0s' }} />
              <div className="absolute inset-0 rounded-full border border-amber-500/12 ring-expand" style={{ animationDelay: '0.7s' }} />
            </>
          )}

          {/* Logo Box */}
          <div
            className={`relative w-32 h-32 rounded-3xl flex items-center justify-center p-5 logo-float ${
              dark ? 'glass logo-pulse' : 'bg-white border border-slate-200 shadow-xl'
            }`}
          >
            {/* Corner accent lines */}
            {dark && (
              <>
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/60 rounded-tl-md" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500/60 rounded-tr-md" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500/60 rounded-bl-md" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/60 rounded-br-md" />
              </>
            )}
            <img src="/logo.png" alt="Bingo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Title */}
        <div
          className={`transition-all duration-700 mb-2 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h1 className={`font-gaming text-5xl font-black tracking-tight mb-1 ${
            dark ? 'text-shimmer' : 'text-slate-900'
          }`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
            BINGO
          </h1>
          <p className="text-xs font-semibold tracking-[0.4em] uppercase text-amber-500/70">
            PRIME EDITION
          </p>
        </div>

        {/* Subtitle */}
        <p
          className={`text-sm leading-relaxed mb-10 transition-all duration-700 delay-100 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } ${dark ? 'text-slate-500' : 'text-slate-500'}`}
        >
          Multiplayer · AI Battles · Real-time Rooms
        </p>

        {/* CTA */}
        <div
          className={`w-full transition-all duration-700 delay-200 ${
            phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <button
            onClick={onEnter}
            className="btn-primary w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-3 relative overflow-hidden group"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {/* Shimmer sweep */}
            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-white/15 skew-x-12" />
            <Play className="w-5 h-5 fill-current relative z-10" />
            <span className="relative z-10 tracking-widest">ENTER GAME</span>
          </button>
        </div>

        {/* Version */}
        <p className={`mt-8 text-[10px] tracking-widest font-mono ${dark ? 'text-slate-800' : 'text-slate-400'}`}>
          v2.0 · NATIVE EDITION
        </p>
      </div>
    </div>
  );
};
