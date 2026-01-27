import React from 'react';
import { DUCK_COLORS } from '../../constants';
import { formatTime } from '../../utils';
import RaceBackground from '../RaceBackground';
import DuckLane from '../DuckLane';
import WaterRipples from '../WaterRipples';

interface RacingPhaseProps {
  /** Danh sách món ăn (tên các duck) */
  foods: string[];
  /** Vị trí hiện tại của mỗi duck (0-100) */
  duckPositions: number[];
  /** Thời gian đã đua (ms) */
  raceTime: number;
  /** Âm thanh đang bật */
  soundEnabled: boolean;
  /** Callback khi nhấn pause */
  onPause: () => void;
  /** Callback khi toggle sound */
  onToggleSound: () => void;
}

/**
 * Component hiển thị màn hình đua chính
 * Bao gồm: background, ducks, ripples, và controls
 */
const RacingPhase: React.FC<RacingPhaseProps> = ({
  foods,
  duckPositions,
  raceTime,
  soundEnabled,
  onPause,
  onToggleSound,
}) => {
  return (
    <div className="relative">
      {/* 2.5D Race Track Container */}
      <div
        className="relative h-[450px] overflow-hidden rounded-t-2xl"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 25%',
        }}
      >
        {/* Shared background (sky, clouds, grass, water, finish line) */}
        <RaceBackground animated />

        {/* Water ripple effects for each duck */}
        <WaterRipples duckCount={foods.length} duckPositions={duckPositions} />

        {/* Ducks */}
        {foods.map((food, index) => (
          <DuckLane
            key={index}
            label={food}
            color={DUCK_COLORS[index % DUCK_COLORS.length]}
            index={index}
            totalDucks={foods.length}
            raceProgress={duckPositions[index] || 0}
            isAnimating
            showReflection
          />
        ))}

        {/* Top UI Bar - Glass morphism */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-50">
          {/* Pause button */}
          <button
            onClick={onPause}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"
            title="Tạm dừng"
          >
            <span className="text-white text-xl">⏸</span>
          </button>

          {/* Timer */}
          <div className="px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-white text-lg">⏱</span>
              <span className="text-white font-bold text-xl tabular-nums">
                {formatTime(raceTime)}
              </span>
            </div>
          </div>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            <span className="text-white text-xl">{soundEnabled ? '🔊' : '🔇'}</span>
          </button>
        </div>
      </div>

      {/* Bottom title bar */}
      <TitleBar />
    </div>
  );
};

/**
 * Bottom title bar component (shared across phases)
 */
const TitleBar: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    className="bg-gradient-to-r from-red-700 via-red-500 to-red-700 py-4 px-6 rounded-b-2xl shadow-inner"
    style={{ opacity }}
  >
    <h2
      className="text-4xl font-black text-white tracking-widest drop-shadow-lg text-center"
      style={{
        fontStyle: 'italic',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)',
      }}
    >
      ĐUA VỊT
    </h2>
  </div>
);

export { TitleBar };
export default RacingPhase;
