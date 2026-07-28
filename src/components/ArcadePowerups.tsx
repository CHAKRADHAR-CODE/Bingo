import React, { useState } from 'react';
import { Zap, Snowflake, Shield, Sparkles } from 'lucide-react';
import { sound } from '../services/soundEngine';

interface ArcadePowerupsProps {
  onUsePowerup: (type: 'autoMark' | 'freeze' | 'shield' | 'doubleScore') => void;
  disabled?: boolean;
}

export const ArcadePowerups: React.FC<ArcadePowerupsProps> = ({ onUsePowerup, disabled }) => {
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({
    autoMark: false,
    freeze: false,
    shield: false,
    doubleScore: false,
  });

  const trigger = (type: 'autoMark' | 'freeze' | 'shield' | 'doubleScore') => {
    if (disabled || cooldowns[type]) return;
    sound.playPowerup();
    onUsePowerup(type);

    setCooldowns((prev) => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCooldowns((prev) => ({ ...prev, [type]: false }));
    }, 8000); // 8 second cooldown
  };

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-lg">
      <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mr-1 hidden sm:inline">
        POWER-UPS:
      </span>

      {/* Auto Mark */}
      <button
        onClick={() => trigger('autoMark')}
        disabled={disabled || cooldowns.autoMark}
        title="Auto-Mark: Instantly fills an optimal number on your board"
        className={`relative group px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
          cooldowns.autoMark || disabled
            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 shadow-md shadow-cyan-500/20 active:scale-95'
        }`}
      >
        <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-bounce" />
        <span>AUTO MARK</span>
      </button>

      {/* Freeze */}
      <button
        onClick={() => trigger('freeze')}
        disabled={disabled || cooldowns.freeze}
        title="Freeze: Freezes opponent turns"
        className={`relative group px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
          cooldowns.freeze || disabled
            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            : 'bg-blue-950/80 hover:bg-blue-900 border border-blue-400/50 text-blue-300 shadow-md shadow-blue-500/20 active:scale-95'
        }`}
      >
        <Snowflake className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-45 transition-transform" />
        <span>FREEZE</span>
      </button>

      {/* Shield */}
      <button
        onClick={() => trigger('shield')}
        disabled={disabled || cooldowns.shield}
        title="Shield: Protects your board for 2 turns"
        className={`relative group px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
          cooldowns.shield || disabled
            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            : 'bg-purple-950/80 hover:bg-purple-900 border border-purple-400/50 text-purple-300 shadow-md shadow-purple-500/20 active:scale-95'
        }`}
      >
        <Shield className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
        <span>SHIELD</span>
      </button>

      {/* Double Score */}
      <button
        onClick={() => trigger('doubleScore')}
        disabled={disabled || cooldowns.doubleScore}
        title="Double Score: 2x line progress multiplier"
        className={`relative group px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
          cooldowns.doubleScore || disabled
            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            : 'bg-amber-950/80 hover:bg-amber-900 border border-amber-400/50 text-amber-300 shadow-md shadow-amber-500/20 active:scale-95'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:animate-spin" />
        <span>2x XP</span>
      </button>
    </div>
  );
};
