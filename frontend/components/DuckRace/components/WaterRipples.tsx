import React from 'react';
import { calculateRipplePosition } from '../utils';

interface WaterRipplesProps {
  /** Số lượng duck (mỗi duck có 1 ripple) */
  duckCount: number;
  /** Tiến độ đua của từng duck */
  duckPositions: number[];
}

/**
 * SVG layer cho water ripple effects
 * Mỗi duck có 2 vòng ripple với animation
 */
const WaterRipples: React.FC<WaterRipplesProps> = ({
  duckCount,
  duckPositions,
}) => {
  return (
    <svg
      className="absolute top-24 left-0 right-0 bottom-0 pointer-events-none overflow-visible"
      style={{ width: '100%', height: 'calc(100% - 96px)' }}
    >
      {Array.from({ length: duckCount }).map((_, index) => {
        const progress = duckPositions[index] || 0;
        const { cx, cy } = calculateRipplePosition(index, duckCount, progress);

        return (
          <g key={`ripple-${index}`}>
            {/* Outer ripple ring */}
            <ellipse
              cx={`${cx}%`}
              cy={`${cy}%`}
              rx="25"
              ry="8"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
            >
              <animate attributeName="rx" values="20;40;55" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="ry" values="6;12;16" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.2;0" dur="1.2s" repeatCount="indefinite" />
            </ellipse>

            {/* Inner ripple ring (delayed) */}
            <ellipse
              cx={`${cx}%`}
              cy={`${cy}%`}
              rx="15"
              ry="5"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
            >
              <animate attributeName="rx" values="15;30;45" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              <animate attributeName="ry" values="5;10;14" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.3;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
            </ellipse>
          </g>
        );
      })}
    </svg>
  );
};

export default WaterRipples;
