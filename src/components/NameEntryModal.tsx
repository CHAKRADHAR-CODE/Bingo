import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ThemeMode } from '../types';

interface NameEntryModalProps {
  theme: ThemeMode;
  onSaveName: (name: string) => void;
}

export const NameEntryModal: React.FC<NameEntryModalProps> = ({ theme, onSaveName }) => {
  const [name, setName] = useState('');
  const dark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSaveName(name.trim());
  };

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${dark ? 'bg-[var(--surface-1)]' : 'bg-slate-50 light-mode'}`}>
      {dark && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(245,158,11,0.05) 0%, transparent 70%)' }} />
      )}

      <div className={`relative w-full max-w-sm rounded-2xl p-8 fade-up ${dark ? 'glass' : 'bg-white border border-slate-200 shadow-2xl'}`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-3 ${dark ? 'glass-warm' : 'bg-amber-50 border border-amber-200'}`}>
            <img src="./logo.png" alt="Bingo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h2 className={`text-xl font-black mb-0.5 ${dark ? 'text-amber-400' : 'text-slate-900'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
              ENTER CALL-SIGN
            </h2>
            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              Choose your display name before entering the arena
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            maxLength={16}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name..."
            autoFocus
            className={`w-full px-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all duration-200 ${
              dark
                ? 'bg-[var(--surface-1)] border border-white/8 text-white placeholder:text-slate-700 focus:border-amber-500/50'
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ENTER ARENA
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
