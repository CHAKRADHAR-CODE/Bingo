import React from 'react';
import { Settings, Volume2, VolumeX, Mic, MicOff, Palette, Grid, Cpu, X } from 'lucide-react';
import { ThemeId, THEMES } from '../types';
import { sound } from '../services/soundEngine';

interface SettingsModalProps {
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  boardSize: number;
  onBoardSizeChange: (size: number) => void;
  aiDifficulty: "rookie" | "cyber" | "master";
  onAiDifficultyChange: (diff: "rookie" | "cyber" | "master") => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentTheme,
  onThemeChange,
  boardSize,
  onBoardSizeChange,
  aiDifficulty,
  onAiDifficultyChange,
  onClose,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());
  const [voiceOn, setVoiceOn] = React.useState(sound.getVoiceEnabled());

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
    sound.playClick();
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    sound.setVoiceEnabled(next);
    sound.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">System Settings</h2>
              <p className="text-xs text-slate-400">Customize your gaming preferences</p>
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

        <div className="space-y-6">
          {/* Theme Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Visual Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as ThemeId[]).map((tid) => (
                <button
                  key={tid}
                  onClick={() => {
                    sound.playClick();
                    onThemeChange(tid);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    currentTheme === tid
                      ? 'bg-slate-800 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{THEMES[tid].name}</span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: THEMES[tid].accent }}
                  ></div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio & Voice */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleSound}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                !isMuted
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {!isMuted ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
              <span>{isMuted ? 'Muted' : 'Audio On'}</span>
            </button>

            <button
              onClick={toggleVoice}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                voiceOn
                  ? 'bg-purple-950/80 border-purple-400 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {voiceOn ? <Mic className="w-4 h-4 text-purple-400" /> : <MicOff className="w-4 h-4 text-slate-500" />}
              <span>{voiceOn ? 'Voice On' : 'Voice Off'}</span>
            </button>
          </div>

          {/* Board Size */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" />
              <span>Grid Board Size</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 5].map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    sound.playClick();
                    onBoardSizeChange(sz);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    boardSize === sz
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {sz}x{sz} {sz === 3 ? '(Speed)' : sz === 5 ? '(Classic)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-pink-400" />
              <span>AI Bot Difficulty</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['rookie', 'cyber', 'master'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    sound.playClick();
                    onAiDifficultyChange(diff);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center uppercase tracking-wider transition-all ${
                    aiDifficulty === diff
                      ? 'bg-pink-950 border-pink-400 text-pink-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
