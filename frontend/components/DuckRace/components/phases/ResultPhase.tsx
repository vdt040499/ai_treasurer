import React from 'react';
import { DUCK_COLORS } from '../../constants';
import { formatTime } from '../../utils';
import { DuckSVG } from '../';

interface ResultPhaseProps {
  /** Tên món ăn chiến thắng */
  winner: string;
  /** Index của duck chiến thắng */
  winnerIndex: number;
  /** Thời gian đua (ms) */
  raceTime: number;
  /** Callback khi nhấn đua lại */
  onRaceAgain: () => void;
  /** Callback khi nhấn chọn món khác */
  onReset: () => void;
}

/**
 * Component hiển thị kết quả sau khi đua xong
 * Confetti, winner announcement, action buttons
 */
const ResultPhase: React.FC<ResultPhaseProps> = ({
  winner,
  winnerIndex,
  raceTime,
  onRaceAgain,
  onReset,
}) => {
  const winnerColor = DUCK_COLORS[winnerIndex >= 0 ? winnerIndex % DUCK_COLORS.length : 0];

  return (
    <div className="text-center space-y-6 py-4 bg-white/90 rounded-2xl p-6 backdrop-blur">
      {/* Confetti animation */}
      <div className="flex justify-center gap-4 text-5xl">
        <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎉</span>
        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</span>
        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
      </div>

      {/* Winner announcement */}
      <div>
        <p className="text-slate-500 mb-2 text-lg">Món ăn chiến thắng là:</p>
        <h3
          className="text-5xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent py-2"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
        >
          {winner}
        </h3>
      </div>

      {/* Winner duck (lớn và animate) */}
      <div className="flex justify-center">
        <div className="transform scale-150">
          <DuckSVG color={winnerColor} size={80} isAnimating />
        </div>
      </div>

      {/* Trophy */}
      <div className="text-4xl">🏆</div>

      {/* Race time */}
      <p className="text-slate-400">
        Thời gian:{' '}
        <span className="font-mono font-bold text-slate-600">
          {formatTime(raceTime)}
        </span>
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center pt-4">
        <button
          onClick={onRaceAgain}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          🔄 Đua lại
        </button>
        <button
          onClick={onReset}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          📝 Chọn món khác
        </button>
      </div>
    </div>
  );
};

export default ResultPhase;
