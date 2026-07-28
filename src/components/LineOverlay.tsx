import React from 'react';
import { LinePosition } from '../services/aiBot';

interface LineOverlayProps {
  lines: LinePosition[];
  boardSize: number;
}

export const LineOverlay: React.FC<LineOverlayProps> = ({ lines, boardSize }) => {
  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox={`0 0 ${boardSize} ${boardSize}`}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.08" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {lines.map((line, idx) => {
        const first = line.cells[0];
        const last = line.cells[line.cells.length - 1];
        const pad = 0.35;
        let x1 = first.c + 0.5;
        let y1 = first.r + 0.5;
        let x2 = last.c + 0.5;
        let y2 = last.r + 0.5;

        if (line.type === 'row') { x1 = pad; x2 = boardSize - pad; }
        else if (line.type === 'col') { y1 = pad; y2 = boardSize - pad; }
        else if (line.type === 'diag1') { x1 = pad; y1 = pad; x2 = boardSize - pad; y2 = boardSize - pad; }
        else { x1 = boardSize - pad; y1 = pad; x2 = pad; y2 = boardSize - pad; }

        return (
          <g key={`${line.type}-${line.index}-${idx}`}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#22c55e"
              strokeWidth="0.18"
              strokeLinecap="round"
              filter="url(#line-glow)"
              className="line-strike"
            />
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#4ade80"
              strokeWidth="0.3"
              strokeLinecap="round"
              opacity="0.2"
              className="line-glow"
            />
          </g>
        );
      })}
    </svg>
  );
};
