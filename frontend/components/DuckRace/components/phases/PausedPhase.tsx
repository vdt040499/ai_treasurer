import React from 'react';
import { DUCK_COLORS } from '../../constants';
import RaceBackground from '../RaceBackground';
import DuckLane from '../DuckLane';
import { TitleBar } from './RacingPhase';

interface PausedPhaseProps {
  /** Danh sách món ăn */
  foods: string[];
  /** Vị trí hiện tại của mỗi duck */
  duckPositions: number[];
  /** Callback khi nhấn tiếp tục */
  onResume: () => void;
  /** Callback khi nhấn quay lại */
  onReset: () => void;
}

/**
 * Component hiển thị màn hình tạm dừng
 * Background mờ, ducks đứng yên, dialog overlay
 */
const PausedPhase: React.FC<PausedPhaseProps> = ({
  foods,
  duckPositions,
  onResume,
  onReset,
}) => {
  return (
    <div className="relative">
      <div
        className="relative h-[450px] overflow-hidden rounded-t-2xl"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 25%',
        }}
      >
        {/* Dimmed background (không có animation) */}
        <RaceBackground dimmed animated={false} />

        {/* Frozen ducks */}
        {foods.map((food, index) => (
          <DuckLane
            key={index}
            label={food}
            color={DUCK_COLORS[index % DUCK_COLORS.length]}
            index={index}
            totalDucks={foods.length}
            raceProgress={duckPositions[index] || 0}
            isAnimating={false}
            opacity={0.4}
          />
        ))}

        {/* Pause dialog overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-md mx-4 border border-white/50">
            <div className="text-7xl">⏸️</div>
            <h3 className="text-2xl font-bold text-slate-800">Tạm dừng</h3>
            <p className="text-slate-500">Cuộc đua đang tạm dừng</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onResume}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                ▶️ Tiếp tục đua
              </button>
              <button
                onClick={onReset}
                className="w-full py-4 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl font-bold text-lg hover:from-slate-600 hover:to-slate-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                🔙 Quay lại chọn món
              </button>
            </div>
          </div>
        </div>
      </div>

      <TitleBar opacity={0.7} />
    </div>
  );
};

export default PausedPhase;
