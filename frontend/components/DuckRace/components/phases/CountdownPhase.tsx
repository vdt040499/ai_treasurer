import React from 'react';
import { DUCK_COLORS } from '../../constants';
import RaceBackground from '../RaceBackground';
import DuckLane from '../DuckLane';
import { TitleBar } from './RacingPhase';

interface CountdownPhaseProps {
  /** Danh sách món ăn */
  foods: string[];
  /** Số đếm ngược hiện tại (3, 2, 1) */
  countdown: number;
}

/**
 * Component hiển thị màn hình đếm ngược trước khi đua
 * Ducks đứng yên tại vạch xuất phát
 */
const CountdownPhase: React.FC<CountdownPhaseProps> = ({ foods, countdown }) => {
  const countdownText = countdown === 3
    ? 'Sẵn sàng...'
    : countdown === 2
      ? 'Chuẩn bị...'
      : 'XUẤT PHÁT!';

  return (
    <div className="relative">
      <div
        className="relative h-[450px] overflow-hidden rounded-t-2xl"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 25%',
        }}
      >
        {/* Background */}
        <RaceBackground animated />

        {/* Countdown number overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <div
              className="text-[180px] font-black text-white drop-shadow-2xl animate-pulse"
              style={{
                textShadow: '0 0 80px rgba(255,255,255,0.9), 0 0 120px rgba(255,255,255,0.5), 0 4px 20px rgba(0,0,0,0.3)',
                WebkitTextStroke: '4px rgba(0,0,0,0.15)',
              }}
            >
              {countdown}
            </div>
            <p className="text-white text-3xl font-bold drop-shadow-lg animate-bounce mt-2">
              {countdownText}
            </p>
          </div>
        </div>

        {/* Ducks at start line (không animate, opacity thấp) */}
        {foods.map((food, index) => (
          <DuckLane
            key={index}
            label={food}
            color={DUCK_COLORS[index % DUCK_COLORS.length]}
            index={index}
            totalDucks={foods.length}
            raceProgress={0} // Tại vạch xuất phát
            isAnimating={false}
            opacity={0.7}
          />
        ))}
      </div>

      <TitleBar />
    </div>
  );
};

export default CountdownPhase;
