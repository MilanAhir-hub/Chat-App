import { memo } from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  light?: boolean;
  fullScreen?: boolean;
}

export const Loader = memo(function Loader({
  size = 'md',
  className = '',
  light = false,
  fullScreen = false,
}: LoaderProps) {
  // Dimension definitions
  const dimensions = {
    sm: { width: 22, height: 22, stroke: 1.5 },
    md: { width: 48, height: 48, stroke: 2 },
    lg: { width: 76, height: 76, stroke: 2.5 },
    xl: { width: 104, height: 104, stroke: 3 },
  }[size];

  // Theme-aware color variables (dynamically inherits active theme tokens)
  const triangleColor = light ? '#FFFFFF' : 'var(--color-primary, #1A73E8)';
  const squareColor = light ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-message-outgoing, var(--color-accent, #F9AB00))';
  const circleColor = light ? 'rgba(255, 255, 255, 0.7)' : 'var(--color-primary-container, var(--color-accent, #34A853))';
  const trackColor = light ? 'rgba(255, 255, 255, 0.25)' : 'var(--color-border, currentColor)';

  const loaderSvg = (
    <div
      className={`relative flex items-center justify-center select-none ${
        size === 'sm'
          ? 'h-5 w-5'
          : size === 'md'
            ? 'h-12 w-12'
            : size === 'lg'
              ? 'h-20 w-20'
              : 'h-28 w-28'
      } ${className}`}
      role="status"
      aria-label="Loading"
    >
      {/* Ambient background blur glow matching active theme */}
      {size !== 'sm' && (
        <div
          className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity pointer-events-none ${
            light ? 'bg-white/40' : 'bg-[var(--color-primary)]'
          }`}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        width={dimensions.width}
        height={dimensions.height}
        className="shape-loader-svg will-change-transform"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="loader-ambient-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={triangleColor} stopOpacity="0.5" />
            <stop offset="70%" stopColor={squareColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={circleColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central Breathing Ambient Core */}
        {size !== 'sm' && (
          <circle
            cx="50"
            cy="50"
            r="17"
            fill="url(#loader-ambient-core)"
            className="shape-core-pulse pointer-events-none"
          />
        )}

        {/* Outer Geometric Orbit Track (Dashed Circle) */}
        {size !== 'sm' && (
          <circle
            cx="50"
            cy="50"
            r="26"
            stroke={trackColor}
            strokeWidth={dimensions.stroke}
            strokeDasharray="4 6"
            strokeOpacity="0.3"
            className="shape-loader-track-circ pointer-events-none"
          />
        )}

        {/* Inner Geometric Constellation Guide (Equilateral Triangle Path) */}
        {size !== 'sm' && (
          <polygon
            points="50,20 76,66 24,66"
            stroke={trackColor}
            strokeWidth={dimensions.stroke * 0.75}
            strokeDasharray="3 5"
            strokeOpacity="0.2"
            className="shape-loader-track-poly pointer-events-none"
          />
        )}

        {/* 1. TRIANGLE SHAPE (Theme Primary) */}
        <g className="shape-node-triangle">
          <polygon
            points="0,-8 7.5,6 -7.5,6"
            fill={triangleColor}
            strokeLinejoin="round"
            stroke={triangleColor}
            strokeWidth="1.5"
            style={{
              filter: size !== 'sm' ? 'drop-shadow(0 0 6px var(--color-primary, rgba(26, 115, 232, 0.6)))' : undefined,
            }}
          />
        </g>

        {/* 2. SQUARE SHAPE (Theme Outgoing / Accent) */}
        <g className="shape-node-square">
          <rect
            x="-6.5"
            y="-6.5"
            width="13"
            height="13"
            rx="3"
            fill={squareColor}
            style={{
              filter: size !== 'sm' ? 'drop-shadow(0 0 6px var(--color-message-outgoing, rgba(249, 171, 0, 0.6)))' : undefined,
            }}
          />
        </g>

        {/* 3. CIRCLE SHAPE (Theme Container / Accent) */}
        <g className="shape-node-circle">
          <circle
            cx="0"
            cy="0"
            r="6.5"
            fill={circleColor}
            style={{
              filter: size !== 'sm' ? 'drop-shadow(0 0 6px var(--color-primary-container, rgba(52, 168, 83, 0.6)))' : undefined,
            }}
          />
        </g>
      </svg>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[var(--color-background)] text-[var(--color-text-primary)] transition-colors duration-300 relative overflow-hidden px-4">
        {/* Subtle ambient gradient backdrop orb matching active theme */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[var(--color-primary)] opacity-15 blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10">
          {loaderSvg}
        </div>
      </div>
    );
  }

  return loaderSvg;
});
