import React, { useState, useCallback } from 'react';
import { Shuffle, CheckCircle2, Play, Copy, Check, ArrowLeft, Clock, Crown } from 'lucide-react';
import { Room, ThemeMode } from '../types';

interface LobbyScreenProps {
  theme: ThemeMode;
  room: Room;
  myPlayerId: string;
  isHost: boolean;
  myBoard: number[][] | null;
  onShuffleBoard: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  theme, room, myPlayerId, isHost, myBoard,
  onShuffleBoard, onToggleReady, onStartGame, onLeaveRoom,
}) => {
  const dark = theme === 'dark';
  const me = room.players.find(p => p.id === myPlayerId);
  const isReady = me?.ready || false;
  const readyCount = room.players.filter(p => p.ready).length;
  const canStart = isHost && room.players.length >= 2 && room.players.every(p => p.ready);
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(() => {
    const code = room.code;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        fallbackCopy(code);
      });
    } else {
      fallbackCopy(code);
    }
  }, [room.code]);

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this room code:', text);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onLeaveRoom}
          className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
            dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Leave Lobby
        </button>

        <button
          onClick={copyCode}
          title="Click to copy room code"
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono font-black text-base tracking-widest transition-all duration-200 ${
            copied
              ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-400'
              : dark
                ? 'bg-[#0f1623] border-white/10 text-white hover:bg-[#141b2d]'
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 shadow-sm'
          }`}
        >
          {room.code}
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-40" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Board Preview */}
        <div className={`lg:col-span-3 rounded-2xl border p-6 flex flex-col ${
          dark ? 'bg-[#0f1623] border-white/8' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base">Your Board</h3>
            <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isReady ? 'Locked in ✓' : 'Shuffle before readying up'}
            </span>
          </div>
          <p className={`text-xs mb-5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            Arrange your board numbers by shuffling. You cannot shuffle once ready.
          </p>

          {myBoard && (
            <div className={`grid grid-cols-5 gap-1.5 p-4 rounded-xl border mb-5 ${
              dark ? 'bg-[#090d16] border-white/6' : 'bg-slate-50 border-slate-200'
            }`}>
              {myBoard.map((row, r) =>
                row.map((num, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                      dark
                        ? `bg-[#141b2d] text-slate-300 border border-white/6 ${isReady ? 'opacity-60' : ''}`
                        : `bg-white text-slate-700 border border-slate-200 shadow-sm ${isReady ? 'opacity-60' : ''}`
                    }`}
                  >
                    {num}
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex gap-3 mt-auto">
            <button
              onClick={onShuffleBoard}
              disabled={isReady}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all duration-200 ${
                isReady
                  ? dark ? 'opacity-30 cursor-not-allowed bg-white/3 border-white/6 text-slate-500' : 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                  : dark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              Shuffle Board
            </button>

            <button
              onClick={onToggleReady}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isReady ? 'Ready!' : 'Set Ready'}
            </button>
          </div>
        </div>

        {/* Right: Players & Controls */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 flex flex-col ${
          dark ? 'bg-[#0f1623] border-white/8' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">Players</h3>
            <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              {readyCount}/{room.players.length} ready
            </span>
          </div>

          <div className={`w-full h-1.5 rounded-full mb-5 overflow-hidden ${dark ? 'bg-white/6' : 'bg-slate-100'}`}>
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${room.players.length > 0 ? (readyCount / room.players.length) * 100 : 0}%` }}
            />
          </div>

          <div className="space-y-2 flex-1">
            {room.players.map(p => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  p.ready
                    ? dark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                    : dark ? 'bg-white/3 border-white/6' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <img src={p.avatar} alt="" className="w-8 h-8 rounded-lg shrink-0 bg-slate-900" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {p.name}
                    </span>
                    {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    {p.id === myPlayerId && (
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        dark ? 'bg-white/8 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>You</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                  p.ready
                    ? 'text-emerald-400'
                    : dark ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {p.ready ? 'Ready' : 'Waiting'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-600/20"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Match
              </button>
            ) : (
              <div className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-semibold ${
                dark ? 'bg-white/3 border-white/6 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                Waiting for host to start...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
