// Level Selection Component
import React from 'react';
import { CHAPTER_1_LEVELS } from '../engine/levelsData';

interface LevelSelectProps {
  currentLevelId: string;
  onSelectLevel: (levelId: string) => void;
  onClose: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  currentLevelId,
  onSelectLevel,
  onClose
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(10, 8, 8, 0.94)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '24px'
      }}
    >
      <div
        style={{
          border: '4px solid #8f1919',
          borderRadius: '8px',
          padding: '28px',
          maxWidth: '650px',
          width: '100%',
          backgroundColor: '#181111',
          boxShadow: '0 0 30px rgba(200, 20, 20, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '26px', color: '#ff3333', fontWeight: '900', letterSpacing: '2px' }}>
              CHAPTER 1: THE FOREST
            </h2>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Light World</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#3d1616',
              border: '2px solid #732222',
              color: '#fff',
              padding: '6px 14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            ✕ RESUME
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          {CHAPTER_1_LEVELS.map(level => {
            const isSelected = level.id === currentLevelId;
            return (
              <button
                key={level.id}
                onClick={() => {
                  onSelectLevel(level.id);
                  onClose();
                }}
                style={{
                  background: isSelected ? '#a81b1b' : '#261717',
                  border: isSelected ? '3px solid #ff4d4d' : '2px solid #4a2121',
                  borderRadius: '6px',
                  padding: '12px 8px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'transform 0.1s, background 0.1s'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1.0)')}
              >
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{level.id}</span>
                <span style={{ fontSize: '10px', color: '#ccc', textAlign: 'center', lineHeight: '1.2' }}>
                  {level.name.split(':')[1]?.trim() || level.name}
                </span>
                <span style={{ fontSize: '9px', color: '#4ade80' }}>A+: {level.parTime}s</span>
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
          Controls: [Arrow Keys / WASD] Move • [Space / Z] Jump • [Shift / X] Run • [R] Retry • [ESC] Menu
        </div>
      </div>
    </div>
  );
};
