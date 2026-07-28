import React, { useEffect, useRef } from 'react';
import { ParticleEngine, ParticleMode } from '../services/particleEngine';

interface ParticleCanvasProps {
  mode: ParticleMode;
  colors?: string[];
  triggerExplosion?: boolean;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ mode, colors, triggerExplosion }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ParticleEngine | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new ParticleEngine(canvasRef.current);
      engineRef.current.setMode(mode, colors);
      engineRef.current.start();
    }

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMode(mode, colors);
    }
  }, [mode, colors]);

  useEffect(() => {
    if (triggerExplosion && engineRef.current) {
      engineRef.current.triggerFireworks();
    }
  }, [triggerExplosion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
