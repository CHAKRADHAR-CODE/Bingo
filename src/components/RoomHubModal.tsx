import React, { useState } from 'react';
import { PlusCircle, LogIn, ArrowLeft } from 'lucide-react';
import { ThemeMode } from '../types';

interface RoomHubModalProps {
  theme: ThemeMode;
  onBack: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}

export const RoomHubModal: React.FC<RoomHubModalProps> = ({ theme, onBack, onCreateRoom, onJoinRoom }) => {
  const [joinCode, setJoinCode] = useState('');
  const dark = theme === 'dark';

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) onJoinRoom(joinCode.trim().toUpperCase());
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-10 flex flex-col">
      {/* Back */}
      <button
        onClick={onBack}
        className={`mb-8 self-start flex items-center gap-2 text-xs font-semibold transition-colors ${
          dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-black mb-1">Multiplayer Room</h2>
      <p className={`text-xs mb-8 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
        Host a new room or enter a code to join someone else's game.
      </p>

      <div className="space-y-6">
        {/* Create Room */}
        <button
          onClick={onCreateRoom}
          className="w-full py-4 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm flex items-center gap-3 transition-all duration-200 shadow-lg shadow-blue-600/20"
        >
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="font-bold">Create Room</div>
            <div className="text-xs text-blue-200 font-normal">Generate a code & invite friends</div>
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className={`flex-1 h-px ${dark ? 'bg-white/6' : 'bg-slate-200'}`}></div>
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-600' : 'text-slate-400'}`}>or</span>
          <div className={`flex-1 h-px ${dark ? 'bg-white/6' : 'bg-slate-200'}`}></div>
        </div>

        {/* Join Room */}
        <form onSubmit={handleJoin} className="space-y-3">
          <div>
            <label className={`text-xs font-semibold block mb-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Room Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Enter 6-digit code"
              className={`w-full px-4 py-3.5 rounded-xl border text-center font-mono font-bold text-xl tracking-[0.3em] outline-none transition-all duration-200 ${
                dark
                  ? 'bg-[#0f1623] border-white/10 text-white placeholder:text-slate-700 focus:border-blue-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-blue-400'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={joinCode.length !== 6}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 border ${
              dark
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};
