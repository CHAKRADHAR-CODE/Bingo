import React from 'react';
import { Sun, Moon, Minus, Maximize2, X, Wifi } from 'lucide-react';
import { ThemeMode } from '../types';

interface DesktopHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  playerName?: string;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ theme, onToggleTheme, playerName }) => {
  const handleMinimize = () => { try { const { ipcRenderer } = (window as any).require('electron'); ipcRenderer.send('window-minimize'); } catch (e) {} };
  const handleMaximize = () => {
    try { const { ipcRenderer } = (window as any).require('electron'); ipcRenderer.send('window-maximize'); } catch (e) {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  };
  const handleClose = () => { try { const { ipcRenderer } = (window as any).require('electron'); ipcRenderer.send('window-close'); } catch (e) {} };

  const dark = theme === 'dark';

  return (
    <header
      className={`h-11 flex items-center justify-between px-4 select-none z-50 fixed top-0 left-0 right-0 ${
        dark
          ? 'bg-[var(--surface-2)]/90 backdrop-blur-xl border-b border-white/5'
          : 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <img src="./logo.png" alt="Bingo" className="w-6 h-6 object-contain rounded" />
        <span
          className={`text-sm font-black tracking-[0.2em] ${dark ? 'text-amber-400' : 'text-slate-900'}`}
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          BINGO
        </span>
      </div>

      {/* Center: player badge */}
      {playerName && (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${
          dark ? 'bg-white/5 text-slate-400 border border-white/6' : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          {playerName}
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded-lg transition-all ${
            dark ? 'hover:bg-white/8 text-slate-500 hover:text-amber-400' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
          }`}
        >
          {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <div className={`w-px h-4 mx-1 ${dark ? 'bg-white/8' : 'bg-slate-200'}`} />
        <button onClick={handleMinimize} className={`p-1.5 rounded transition-colors ${dark ? 'hover:bg-white/8 text-slate-600 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400'}`}><Minus className="w-3.5 h-3.5" /></button>
        <button onClick={handleMaximize} className={`p-1.5 rounded transition-colors ${dark ? 'hover:bg-white/8 text-slate-600 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400'}`}><Maximize2 className="w-3.5 h-3.5" /></button>
        <button onClick={handleClose} className="p-1.5 rounded transition-colors hover:bg-red-500/90 text-slate-600 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
    </header>
  );
};
