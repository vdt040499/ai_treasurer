import React from 'react';

interface RaceBackgroundProps {
  /** Làm mờ background (dùng cho paused state) */
  dimmed?: boolean;
  /** Hiển thị animation (clouds, water shimmer) */
  animated?: boolean;
  /** Custom className cho container */
  className?: string;
}

/**
 * Background 2.5D cho đường đua
 * Bao gồm: Sky, Clouds, Grass, Water, Finish Line
 */
const RaceBackground: React.FC<RaceBackgroundProps> = ({
  dimmed = false,
  animated = true,
  className = '',
}) => {
  const opacityClass = dimmed ? 'opacity-60' : '';

  return (
    <>
      {/* Sky gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-cyan-500 ${opacityClass}`} />

      {/* Animated Clouds - Layer 1 (Back) */}
      {animated && (
        <>
          <div
            className="absolute top-2 w-40 h-14 bg-white/50 rounded-full blur-md animate-cloud-drift-slow"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute top-6 w-28 h-10 bg-white/40 rounded-full blur-md animate-cloud-drift-slow"
            style={{ animationDelay: '-10s' }}
          />
          <div
            className="absolute top-4 w-36 h-12 bg-white/45 rounded-full blur-md animate-cloud-drift"
            style={{ animationDelay: '-5s' }}
          />
          {/* Layer 2 (Front) */}
          <div
            className="absolute top-8 w-24 h-8 bg-white/60 rounded-full blur-sm animate-cloud-drift"
            style={{ animationDelay: '-15s' }}
          />
          <div
            className="absolute top-3 w-20 h-7 bg-white/55 rounded-full blur-sm animate-cloud-drift"
            style={{ animationDelay: '-20s' }}
          />
        </>
      )}

      {/* Grass/Vegetation at top */}
      <div className={`absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-green-700 via-green-600 to-green-500/90 ${opacityClass}`}>
        {/* Grass texture lines */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,100,0,0.3) 8px, rgba(0,100,0,0.3) 10px)',
          }}
        />
      </div>

      {/* Grass reflection in water */}
      <div className={`absolute top-16 left-0 right-0 h-12 bg-gradient-to-b from-green-500/50 via-green-400/30 to-transparent ${opacityClass}`} />

      {/* Water Surface */}
      <div
        className={`absolute top-24 left-0 right-0 bottom-0 ${dimmed ? 'opacity-50' : ''}`}
        style={{
          background: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 30%, #0284c7 60%, #0369a1 100%)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Water shimmer animation */}
        {animated && (
          <div
            className="absolute inset-0 opacity-25 animate-water-shimmer"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,255,255,0.4) 15px, rgba(255,255,255,0.4) 17px)',
            }}
          />
        )}

        {/* Water depth gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/20 to-blue-800/40" />

        {/* Caustic light patterns */}
        {animated && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 60px 30px at 20% 40%, rgba(255,255,255,0.6) 0%, transparent 70%),
                radial-gradient(ellipse 80px 40px at 60% 60%, rgba(255,255,255,0.5) 0%, transparent 70%),
                radial-gradient(ellipse 50px 25px at 80% 30%, rgba(255,255,255,0.4) 0%, transparent 70%)
              `,
            }}
          />
        )}
      </div>

      {/* Checkered Finish Line */}
      <div
        className={`absolute top-20 right-8 bottom-0 w-12 overflow-hidden shadow-xl ${dimmed ? 'opacity-40' : ''}`}
        style={{
          transform: 'skewX(-20deg) perspective(500px) rotateY(-5deg)',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, white 0px, white 18px, #1a1a1a 18px, #1a1a1a 36px)',
            backgroundSize: '100% 36px',
          }}
        />
        {/* Finish line highlight */}
        <div className="absolute inset-y-0 left-0 w-1 bg-white/50" />
      </div>
    </>
  );
};

export default RaceBackground;
