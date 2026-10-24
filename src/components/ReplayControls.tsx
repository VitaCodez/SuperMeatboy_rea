// Replay Playback Overlay Controls
import React from 'react';

interface ReplayControlsProps {
  attemptCount: number;
  winTime: number;
  parTime: number;
  onRestartReplay: () => void;
  onNextLevel: () => void;
  onLevelSelect: () => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  attemptCount,
  winTime,
  parTime,
  onRestartReplay,
  onNextLevel,
  onLevelSelect
}) => {
  const isAPlus = winTime <= parTime;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(20, 12, 12, 0.92)',
        border: '3px solid #8f1919',
        borderRadius: '8px',
        padding: '16px 24px',
        boxShadow: '0 0 25px rgba(0, 0, 0, 0.8)',
        zIndex: 40,
        textShadow: '1px 1px 0 #000'
      }}
    >
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <span style={{ fontSize: '15px', color: '#ffaaaa' }}>
          TIME: <strong style={{ color: isAPlus ? '#4ade80' : '#fff' }}>{winTime.toFixed(2)}s</strong>
        </span>
        <span style={{ fontSize: '15px', color: '#ffaaaa' }}>
          GRADE: <strong style={{ color: isAPlus ? '#4ade80' : '#facc15' }}>{isAPlus ? 'A+' : 'PASS'}</strong>
        </span>
        <span style={{ fontSize: '15px', color: '#ffaaaa' }}>
          TOTAL GHOSTS: <strong style={{ color: '#fff' }}>{attemptCount}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onRestartReplay}
          style={{
            background: '#3d1616',
            border: '2px solid #732222',
            color: '#fff',
            padding: '8px 16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          ↺ REWATCH REPLAY
        </button>

        <button
          onClick={onNextLevel}
          style={{
            background: '#9e1a1a',
            border: '2px solid #e03131',
            color: '#fff',
            padding: '8px 20px',
            fontWeight: '900',
            cursor: 'pointer',
            borderRadius: '4px',
            letterSpacing: '1px'
          }}
        >
          NEXT LEVEL ➔
        </button>

        <button
          onClick={onLevelSelect}
          style={{
            background: '#261717',
            border: '2px solid #4a2121',
            color: '#ccc',
            padding: '8px 16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          LEVEL SELECT
        </button>
      </div>
    </div>
  );
};
