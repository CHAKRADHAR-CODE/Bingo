import React from 'react';
import { Award, Trophy, Star, ShieldCheck, Zap, X } from 'lucide-react';
import { PlayerStats } from '../types';
import { sound } from '../services/soundEngine';

interface AchievementsModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ stats, onClose }) => {
  const achievements = [
    {
      id: "first_win",
      title: "First Victory",
      description: "Win your first Bingo match against AI or human players.",
      icon: "🏆",
      unlocked: stats.wins >= 1,
    },
    {
      id: "streak_3",
      title: "Hot Streak",
      description: "Achieve a 3-game winning streak.",
      icon: "🔥",
      unlocked: stats.bestStreak >= 3,
    },
    {
      id: "lines_10",
      title: "Line Master",
      description: "Complete 10 total Bingo lines.",
      icon: "⚡",
      unlocked: stats.totalLinesCompleted >= 10,
    },
    {
      id: "power_user",
      title: "Power Surge",
      description: "Use 5 Arcade Power-ups during matches.",
      icon: "🌀",
      unlocked: stats.powerupsUsed >= 5,
    },
    {
      id: "grandmaster",
      title: "Grandmaster",
      description: "Reach Player Level 5.",
      icon: "👑",
      unlocked: stats.level >= 5,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Career Achievements</h2>
              <p className="text-xs text-slate-400">Unlock badges & track your gaming rank</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Level</span>
            <span className="text-2xl font-black text-cyan-400">{stats.level}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Wins</span>
            <span className="text-2xl font-black text-amber-400">{stats.wins}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Best Streak</span>
            <span className="text-2xl font-black text-purple-400">{stats.bestStreak} 🔥</span>
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all ${
                item.unlocked
                  ? 'bg-slate-950/80 border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/30 border-slate-800 opacity-60'
              }`}
            >
              <div className="text-2xl p-2 rounded-lg bg-slate-900 border border-slate-800">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  {item.unlocked ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
