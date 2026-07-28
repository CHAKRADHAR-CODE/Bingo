import React from 'react';
import { Users, Bot, ChevronRight, Zap } from 'lucide-react';
import { ThemeMode } from '../types';

interface MainChoiceMenuProps {
  theme: ThemeMode;
  playerName: string;
  onChangeName: () => void;
  onSelectRoom: () => void;
  onSelectAi: () => void;
}

export const MainChoiceMenu: React.FC<MainChoiceMenuProps> = ({
  theme, playerName, onChangeName, onSelectRoom, onSelectAi,
}) => {
  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 py-12 ${dark ? '' : 'light-mode'}`}>
      {dark && (
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 65%)' }} />
      )}

      <div className="relative z-10 w-full max-w-sm">
        {/* Greeting Block */}
        <div className="mb-10 text-center fade-up">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-amber-500/70 mb-2">
            WELCOME BACK
          </p>
          <h1 className={`text-4xl font-black mb-3 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {playerName}
          </h1>
          <button
            onClick={onChangeName}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              dark
                ? 'bg-white/5 border-white/8 text-slate-500 hover:text-amber-400 hover:border-amber-500/30'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            Change Name
          </button>
        </div>

        {/* Mode label */}
        <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-4 text-center" style={{ color: 'var(--text-muted)' }}>
          SELECT GAME MODE
        </p>

        {/* Cards */}
        <div className="space-y-3 fade-up" style={{ animationDelay: '0.1s' }}>
          {/* ROOM */}
          <button
            onClick={onSelectRoom}
            className={`w-full group relative overflow-hidden rounded-2xl p-5 text-left flex items-center gap-4 transition-all duration-200 border ${
              dark
                ? 'glass hover:border-amber-500/25 hover:bg-[var(--surface-3)]'
                : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-lg shadow-sm'
            }`}
          >
            {/* Hover sweep */}
            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              dark ? 'bg-amber-500/10 border border-amber-500/15' : 'bg-amber-50 border border-amber-200'
            }`}>
              <Users className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`font-black text-base ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px' }}>
                  MULTIPLAYER
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  dark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  ONLINE
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                Create or join a private room with a 6-digit code
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 ${dark ? 'text-slate-700' : 'text-slate-300'}`} />
          </button>

          {/* AI */}
          <button
            onClick={onSelectAi}
            className={`w-full group relative overflow-hidden rounded-2xl p-5 text-left flex items-center gap-4 transition-all duration-200 border ${
              dark
                ? 'glass hover:border-slate-500/30 hover:bg-[var(--surface-3)]'
                : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-lg shadow-sm'
            }`}
          >
            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              dark ? 'bg-slate-600/15 border border-slate-500/15' : 'bg-slate-100 border border-slate-200'
            }`}>
              <Bot className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`font-black text-base ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px' }}>
                  VS AI
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  dark ? 'bg-slate-600/20 text-slate-400' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  OFFLINE
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                Battle AI opponents instantly — no internet required
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 ${dark ? 'text-slate-700' : 'text-slate-300'}`} />
          </button>
        </div>

        {/* Footer hint */}
        <div className={`mt-8 text-center text-[10px] tracking-widest font-mono ${dark ? 'text-slate-800' : 'text-slate-400'}`}>
          BINGO PRIME · 2025
        </div>
      </div>
    </div>
  );
};
