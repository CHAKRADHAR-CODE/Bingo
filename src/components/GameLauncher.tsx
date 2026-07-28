import React, { useState } from 'react';
import { Bot, Users, Zap, Trophy, Settings, Sparkles, Play, PlusCircle, LogIn, ArrowRight } from 'lucide-react';
import { AVATARS, PlayerStats, GameMode } from '../types';
import { sound } from '../services/soundEngine';

interface GameLauncherProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  avatar: string;
  onAvatarChange: (avatar: string) => void;
  stats: PlayerStats;
  onStartSingleplayer: (mode: "classic" | "arcade") => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
  socketConnected: boolean;
}

export const GameLauncher: React.FC<GameLauncherProps> = ({
  playerName,
  onPlayerNameChange,
  avatar,
  onAvatarChange,
  stats,
  onStartSingleplayer,
  onCreateRoom,
  onJoinRoom,
  onOpenAchievements,
  onOpenSettings,
  socketConnected,
}) => {
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleAvatarSelect = (av: string) => {
    sound.playClick();
    onAvatarChange(av);
    setShowAvatarPicker(false);
  };

  const getRankTitle = (lvl: number) => {
    if (lvl >= 10) return "CYBER GOD";
    if (lvl >= 7) return "GRANDMASTER";
    if (lvl >= 5) return "PRIME STRATEGIST";
    if (lvl >= 3) return "BINGO VETERAN";
    return "NOVICE PILOT";
  };

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Player Profile & XP Bar */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 md:p-6 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Avatar & Info */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-950 border-2 border-cyan-400 p-1 shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform overflow-hidden">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                Edit
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => onPlayerNameChange(e.target.value)}
                  placeholder="Enter Player Call-sign"
                  className="bg-transparent font-extrabold text-lg md:text-xl text-white outline-none focus:border-b border-cyan-400 max-w-[180px] md:max-w-[220px]"
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-black tracking-wider text-amber-400 uppercase bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded">
                  LVL {stats.level}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {getRankTitle(stats.level)}
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full md:w-64 bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">XP PROGRESS</span>
              <span className="text-cyan-400">{stats.xp} / {stats.xpToNextLevel} XP</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.xp / stats.xpToNextLevel) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Avatar Selection Dropdown */}
        {showAvatarPicker && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-4 sm:grid-cols-8 gap-3">
            {AVATARS.map((avUrl, i) => (
              <button
                key={i}
                onClick={() => handleAvatarSelect(avUrl)}
                className={`p-1.5 rounded-xl border transition-all ${
                  avatar === avUrl
                    ? 'border-cyan-400 bg-cyan-950/60 scale-105 shadow-md shadow-cyan-500/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <img src={avUrl} alt={`Avatar option ${i}`} className="w-12 h-12 rounded-lg" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Game Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full mb-8">
        {/* Mode 1: Vs AI Singleplayer */}
        <div
          onClick={() => {
            sound.playClick();
            onStartSingleplayer('classic');
          }}
          className="group relative bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bot className="w-32 h-32 text-cyan-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-4 shadow-md">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">
                SOLO VS AI BOTS
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Instant offline singleplayer action. Challenge smart AI bots across 3x3, 4x4, or 5x5 board grids.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-cyan-400 font-extrabold text-sm group-hover:translate-x-1 transition-transform">
              <span>LAUNCH SINGLEPLAYER</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Mode 2: Arcade Power-Up Mode */}
        <div
          onClick={() => {
            sound.playClick();
            onStartSingleplayer('arcade');
          }}
          className="group relative bg-slate-900/90 hover:bg-slate-850 border border-purple-500/40 hover:border-purple-400 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-32 h-32 text-purple-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 mb-4 shadow-md">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-300 transition-colors">
                ACTION ARCADE BINGO
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Play with tactical abilities! Freeze opponents, auto-mark numbers, deploy shields, and gain 2x XP.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-purple-400 font-extrabold text-sm group-hover:translate-x-1 transition-transform">
              <span>LAUNCH ARCADE</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Mode 3: Online Multiplayer */}
        <div
          onClick={() => {
            sound.playClick();
            setShowMultiplayerModal(true);
          }}
          className="group relative bg-slate-900/90 hover:bg-slate-850 border border-pink-500/40 hover:border-pink-400 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-32 h-32 text-pink-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-pink-950/80 border border-pink-500/40 text-pink-400 mb-4 shadow-md">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-black text-white group-hover:text-pink-300 transition-colors">
                  ONLINE MULTIPLAYER
                </h3>
                <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Create a private room or enter a code to duel real-time against friends and rivals online.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-pink-400 font-extrabold text-sm group-hover:translate-x-1 transition-transform">
              <span>MULTIPLAYER LOBBY</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Mode 4: Achievements & Career */}
        <div
          onClick={() => {
            sound.playClick();
            onOpenAchievements();
          }}
          className="group relative bg-slate-900/90 hover:bg-slate-850 border border-amber-500/40 hover:border-amber-400 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy className="w-32 h-32 text-amber-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 mb-4 shadow-md">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-amber-300 transition-colors">
                CAREER & BADGES
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                View your career stats, win streak records, total bingos, and unlockable achievement badges.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-amber-400 font-extrabold text-sm group-hover:translate-x-1 transition-transform">
              <span>VIEW ACHIEVEMENTS</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Multiplayer Room Modal */}
      {showMultiplayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-pink-500/40 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-white mb-4">Multiplayer Room Hub</h3>

            <div className="space-y-4">
              {/* Create Room */}
              <button
                onClick={() => {
                  sound.playClick();
                  setShowMultiplayerModal(false);
                  onCreateRoom();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-98 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                <span>CREATE NEW ROOM</span>
              </button>

              <div className="flex items-center gap-3 my-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span>OR JOIN ROOM</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              {/* Join Room Code Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit Code"
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-pink-400 rounded-xl px-4 py-3 text-white font-mono text-center font-extrabold tracking-widest outline-none text-lg uppercase"
                />
                <button
                  onClick={() => {
                    if (roomCodeInput.length === 6) {
                      sound.playClick();
                      setShowMultiplayerModal(false);
                      onJoinRoom(roomCodeInput);
                    }
                  }}
                  disabled={roomCodeInput.length !== 6}
                  className="px-5 py-3 rounded-xl bg-pink-950 border border-pink-500/40 text-pink-300 font-extrabold hover:bg-pink-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  JOIN
                </button>
              </div>

              <button
                onClick={() => setShowMultiplayerModal(false)}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
