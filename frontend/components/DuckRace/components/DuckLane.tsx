import React from 'react';
import { DuckColor } from '../types';
import { calculateDuckPosition, getLabelCounterScale } from '../utils';
import DuckSVG from './DuckSVG';

interface DuckLaneProps {
  /** Tên hiển thị (món ăn) */
  label: string;
  /** Màu sắc của duck */
  color: DuckColor;
  /** Index của lane (0 = lane trên cùng) */
  index: number;
  /** Tổng số duck tham gia */
  totalDucks: number;
  /** Tiến độ đua (0-100) */
  raceProgress?: number;
  /** Duck đang bơi (có animation) */
  isAnimating?: boolean;
  /** Hiển thị reflection dưới nước */
  showReflection?: boolean;
  /** Opacity của toàn bộ lane */
  opacity?: number;
}

/**
 * Component render một con duck trên đường đua
 * Tự động tính toán vị trí 2.5D dựa trên index và totalDucks
 */
const DuckLane: React.FC<DuckLaneProps> = ({
  label,
  color,
  index,
  totalDucks,
  raceProgress = 0,
  isAnimating = false,
  showReflection = false,
  opacity = 1,
}) => {
  const position = calculateDuckPosition(index, totalDucks, raceProgress);
  const labelCounterScale = getLabelCounterScale(position.depthScale);

  return (
    <div
      className={`absolute transition-all duration-100 ease-linear`}
      style={{
        left: `calc(${position.horizontalPercent}%)`,
        top: `${position.verticalPercent}%`,
        zIndex: position.zIndex,
        transform: `scale(${position.depthScale})`,
        transformOrigin: 'center bottom',
        opacity,
      }}
    >
      {/* Food label floating above duck */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        style={{
          zIndex: position.zIndex + 1,
          transform: `scale(${labelCounterScale})`,
        }}
      >
        <span
          className={`px-3 py-1.5 ${color.label} text-white rounded-lg text-xs font-bold shadow-lg border border-white/30 backdrop-blur-sm`}
        >
          {label}
        </span>
      </div>

      {/* Duck with optional bob animation */}
      <div className={isAnimating ? 'animate-duck-bob' : ''}>
        <DuckSVG color={color} size={55} isAnimating={isAnimating} />
      </div>

      {/* Duck reflection in water */}
      {showReflection && (
        <div
          className="absolute top-full left-0 opacity-25 blur-[2px] pointer-events-none"
          style={{
            transform: 'scaleY(-0.4) translateY(-10px)',
            filter: 'blur(2px) brightness(0.8)',
          }}
        >
          <DuckSVG color={color} size={55} isAnimating={false} />
        </div>
      )}
    </div>
  );
};

export default DuckLane;
