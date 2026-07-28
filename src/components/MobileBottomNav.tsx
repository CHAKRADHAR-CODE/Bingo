import React from 'react';
import { Home, Bot, Zap, Users, Trophy } from 'lucide-react';
import { sound } from '../services/soundEngine';
import { nativeService } from '../services/nativeService';
import { GameMode } from '../types';

interface MobileBottomNavProps {
  currentMode: GameMode;
  onNavigate: (mode: GameMode) => void;
  onStartSingleplayer: (mode: "classic" | "arcade") => void;
  onOpenAchievements: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentMode,
  onNavigate,
  onStartSingleplayer,
  onOpenAchievements,
}) => {
  const handleTab = (action: () => void) => {
    sound.playClick();
    nativeService.triggerHaptic('light');
    action();
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-cyan-500/30 px-3 py-2 flex items-center justify-around">
      {/* Home Menu */}
      <button
        onClick={() => handleTab(() => onNavigate('menu'))}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
          currentMode === 'menu' ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </button>

      {/* Solo AI */}
      <button
        onClick={() => handleTab(() => onStartSingleplayer('classic'))}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
          currentMode === 'singleplayer' ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Bot className="w-5 h-5" />
        <span>Solo AI</span>
      </button>

      {/* Action Arcade */}
      <button
        onClick={() => handleTab(() => onStartSingleplayer('arcade'))}
        className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
          currentMode === 'arcade' ? 'text-purple-400 scale-110' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Zap className="w-5 h-5" />
        <span>Arcade</span>
      </button>

      {/* Badges */}
      <button
        onClick={() => handleTab(onOpenAchievements)}
        className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-amber-400 transition-all"
      >
        <Trophy className="w-5 h-5" />
        <span>Badges</span>
      </button>
    </div>
  );
};
