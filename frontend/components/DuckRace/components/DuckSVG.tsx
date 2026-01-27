import React from 'react';
import { DuckColor } from '../types';

interface DuckSVGProps {
  /** Màu sắc của duck */
  color: DuckColor;
  /** Kích thước (width = height) */
  size?: number;
  /** Bật animation bơi */
  isAnimating?: boolean;
}

/**
 * SVG Component vẽ con vịt
 * Có animation khi isAnimating=true: lắc body, head bob, water splash
 */
const DuckSVG: React.FC<DuckSVGProps> = ({
  color,
  size = 60,
  isAnimating = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
    {/* Water splash behind duck */}
    <ellipse cx="50" cy="85" rx="40" ry="12" fill="white" opacity="0.6">
      {isAnimating && (
        <animate attributeName="rx" values="35;45;35" dur="0.3s" repeatCount="indefinite" />
      )}
    </ellipse>
    <ellipse cx="50" cy="85" rx="30" ry="8" fill="white" opacity="0.8" />

    {/* Duck body - wobble animation */}
    <ellipse cx="50" cy="60" rx="35" ry="28" fill={color.body}>
      {isAnimating && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-3 50 60;3 50 60;-3 50 60"
          dur="0.3s"
          repeatCount="indefinite"
        />
      )}
    </ellipse>

    {/* Wing */}
    <ellipse cx="55" cy="55" rx="18" ry="15" fill={color.wing} />

    {/* Head - bob animation */}
    <circle cx="75" cy="35" r="22" fill={color.body}>
      {isAnimating && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0;2 -2;0 0"
          dur="0.3s"
          repeatCount="indefinite"
        />
      )}
    </circle>

    {/* Beak */}
    <ellipse cx="95" cy="38" rx="12" ry="6" fill={color.beak} />

    {/* Eye */}
    <circle cx="82" cy="30" r="5" fill="white" />
    <circle cx="83" cy="30" r="3" fill="black" />
    <circle cx="84" cy="29" r="1" fill="white" />

    {/* Tail feathers */}
    <path d="M 15 50 Q 5 45 10 40 Q 15 42 20 50 Z" fill={color.wing} />
    <path d="M 15 55 Q 0 50 8 45 Q 12 48 18 55 Z" fill={color.body} />
  </svg>
);

export default DuckSVG;
