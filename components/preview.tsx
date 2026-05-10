'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';

type BuildMode = 'static' | 'draw' | 'draw-fill' | 'fill' | 'trace' | 'pulse';
type BuildEffect = 'none' | 'glow' | 'soft-glow' | 'shadow' | 'blur';

type LogoColors = {
  base?: string;
  outline?: string;
  stroke?: string;
  gradientStart?: string;
  gradientEnd?: string;
};

type AnimatedBuildingLogoProps = {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  mode?: BuildMode;
  effect?: BuildEffect;
  speed?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  loop?: boolean;
  play?: boolean;
  strokeWidth?: number;
  traceOpacity?: number;
  colors?: LogoColors;
  title?: string;
};

type CssVars = React.CSSProperties & Record<`--${string}`, string | number>;

const PATHS: Array<{
  d: string;
  fill: 'base' | 'g1' | 'g2';
  outline?: boolean;
}> = [
  {
    fill: 'g1',
    d: 'M362.15 251.69c.04 5.41-3.17 10.59-6.47 13.43l-26.65 25.18-72.65 71.1c-4.11 1.53-8.34.99-11.46-2.04l-106.2-103.17-.23-127.16c0-1.72.91-5.25 1.75-5.13 1.22.16 4.19.97 5.58 2.33l98.93 96.81c3.48 3.4 8.34 5.91 12.12 2.23l104.22-101.5 1.04 127.93Z',
  },
  {
    fill: 'g2',
    d: 'M191.48 381.76h115.68v112.09H191.48z',
  },
  {
    fill: 'base',
    outline: true,
    d: 'M126.46 273.57c.04 2.2-4.99 6.18-7.21 6.18l-99.72.04c-4.47 0-7.97-3.24-7.97-8.83l.04-257.38c0-3.07 1.39-5.81 2.2-6.64 1.08-1.11 6.08-1.02 7.39.24l101.46 98.09.07 125.85c0 5.32 1.09 10.07 3.2 15.25l.55 27.2Z',
  },
  {
    fill: 'base',
    d: 'M119.21 493.8l-99.71.05c-3.65 0-6.95-3.12-7.94-6.74v-97.95c0-4.01 3.86-7.44 7.92-7.44l99.67.11c3.5 0 7.31 3.98 7.3 7.49v97.72c-.01 3.51-3.93 6.77-7.24 6.77Z',
  },
  {
    fill: 'base',
    d: 'M11.51 300.8h114.92v60.19H11.51z',
  },
  {
    fill: 'base',
    d: 'M381.24 336.95c-4.66 0-8.18-4.54-8.17-8.12l.09-77.64c1.34-3.56 3.33-8.88 3.33-12.51l.06-130.46L478.44 8.19c1.44-1.41 4.88-2.27 6.01-1.98 1.51.39 3.76 3.92 3.77 6.01l.02 316.3c0 5.19-3.64 8.56-8.21 8.56l-98.78-.13Z',
  },
  {
    fill: 'base',
    d: 'M361.82 481.74c1.6 4.16 16.73-.42 18.63 4.38.54 1.36.64 5.89-.76 6.29-6.65 1.86-21.57 3.42-27.3-5.48-3.1-4.81-2.85-16.42-1.26-21.51.43-1.37 5.16-3.09 6.28-2.2 6.22 4.91 1.09 9.88 4.42 18.53Z',
  },
  {
    fill: 'base',
    d: 'M460.74 493.48c-1.97.02-4.88-4.07-4.16-5.45 4.33-8.26 9.82-1.56 20.57-5.85l1.2-12.25c.13-1.37 1.21-4.49 1.78-5.7.71-1.51 6.44-.53 6.92 1.07 1.18 3.93 1.55 12.69.53 17.55-1.15 5.49-8.13 10.49-13.19 10.53l-13.66.11Z',
  },
  {
    fill: 'base',
    d: 'M362.36 368.9c-4.47 2.13 1.15 12.65-4.76 18.84-1.12 1.17-6.75-.99-7.04-2.62-1.62-9.06-.8-26.16 9.4-27.22 5.44-.57 14.02-.52 18.11-.1 1.57.16 3.8 5.38 2.69 6.46-6.8 6.57-9.55.43-18.4 4.64Z',
  },
  {
    fill: 'base',
    d: 'M485.38 363.64c4.23 5.75 4.98 26.36-2.84 24.54-1.92-.45-4.03-3.74-4.25-6l-1.32-13.85-14.07-1.07c-2.15-.16-6.02-2.82-6.16-4.81-.49-6.96 21.77-8.16 28.63 1.18Z',
  },
  {
    fill: 'base',
    d: 'M431.67 493.63l-25.53-.23c-1.7-.02-4.69-2.65-5.03-4.27s2.94-5.27 4.65-5.29l24.74-.28c2.02-.02 5.64 2.26 6.19 4.04s-3.04 6.04-5.02 6.03Z',
  },
  {
    fill: 'base',
    d: 'M431.39 367.36l-25.46-.08c-1.7 0-4.97-3.39-4.94-5.08s3.26-4.79 5.18-4.8l25.69-.13c1.62 0 4.71 3.49 4.87 5.07s-3.48 5.02-5.35 5.02Z',
  },
  {
    fill: 'base',
    d: 'M360.77 436.99c.03 2.1-3.36 5.79-5.25 5.86s-5.44-3.58-5.45-5.64l-.04-23.64c0-1.62 2.52-4.43 3.88-5.11 1.7-.86 6.46 2.68 6.49 4.74l.36 23.8Z',
  },
  {
    fill: 'base',
    d: 'M488.28 436.86c0 2.14-3.9 6.32-5.75 6.06s-4.45-3.62-4.45-5.51l-.03-22.67c0-2.26 2.93-5.81 4.86-5.99s5.37 3.63 5.37 5.69v22.43Z',
  },
];

export default function AnimatedBuildingLogo({
  className,
  style,
  size = 180,
  mode = 'draw-fill',
  effect = 'glow',
  speed = 1,
  duration,
  delay = 0,
  stagger = 0.045,
  loop = false,
  play = true,
  strokeWidth = 4,
  traceOpacity = 0.12,
  title = 'Animated building logo',
  colors,
}: AnimatedBuildingLogoProps) {
  const reactId = useId().replace(/:/g, '');
  const g1 = `markGradientA-${reactId}`;
  const g2 = `markGradientB-${reactId}`;

  const safeSpeed = Math.max(0.1, speed);
  const safeDuration = duration ?? 2 / safeSpeed;
  const finalDelay = delay + safeDuration + stagger * Math.max(0, PATHS.length - 1);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!loop || mode === 'trace' || mode === 'pulse' || mode === 'static') return;

    const total = Math.max(0.8, finalDelay + 0.8);
    const id = window.setInterval(() => setCycle((v) => v + 1), total * 1000);

    return () => window.clearInterval(id);
  }, [loop, mode, finalDelay]);

  const rootStyle = useMemo<CssVars>(
    () => ({
      '--logo-size': typeof size === 'number' ? `${size}px` : size,
      '--duration': `${safeDuration}s`,
      '--final-delay': `${finalDelay}s`,
      '--stroke-width': strokeWidth,
      '--draw-color': colors?.stroke ?? '#39a89e',
      '--base-color': colors?.base ?? '#00352f',
      '--outline-color': colors?.outline ?? '#00443e',
      '--gradient-start': colors?.gradientStart ?? '#39a89e',
      '--gradient-end': colors?.gradientEnd ?? '#004048',
      '--trace-opacity': traceOpacity,
      ...style,
    }),
    [size, safeDuration, finalDelay, strokeWidth, colors, traceOpacity, style]
  );

  const getFill = (fill: 'base' | 'g1' | 'g2') => {
    if (fill === 'g1') return `url(#${g1})`;
    if (fill === 'g2') return `url(#${g2})`;
    return 'var(--base-color)';
  };

  return (
    <svg
      key={cycle}
      className={[
        'animated-building-logo',
        `mode-${mode}`,
        `effect-${effect}`,
        loop ? 'is-loop' : '',
        play ? 'is-playing' : 'is-paused',
        className ?? '',
      ].join(' ')}
      style={rootStyle}
      viewBox="0 0 500 500"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      <defs>
        <linearGradient id={g1} x1="250.33" y1="243.76" x2="250.33" y2="346.08" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--gradient-start)" />
          <stop offset="1" stopColor="var(--gradient-end)" />
        </linearGradient>

        <linearGradient id={g2} x1="192.01" y1="363.56" x2="288.46" y2="488.51" gradientUnits="userSpaceOnUse">
          <stop offset=".23" stopColor="var(--gradient-start)" />
          <stop offset=".75" stopColor="var(--gradient-end)" />
        </linearGradient>
      </defs>

      <g className="final-layer">
        {PATHS.map((path, index) => (
          <path
            key={`final-${index}`}
            d={path.d}
            fill={getFill(path.fill)}
            stroke={path.outline ? 'var(--outline-color)' : 'none'}
            strokeWidth={path.outline ? 0.75 : 0}
            strokeMiterlimit={10}
          />
        ))}
      </g>

      <g className="draw-layer">
        {PATHS.map((path, index) => (
          <path
            key={`draw-${index}`}
            className="draw-path"
            d={path.d}
            pathLength={1}
            fill="none"
            stroke="var(--draw-color)"
            strokeWidth="var(--stroke-width)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ '--path-delay': `${delay + index * stagger}s` } as CssVars}
          />
        ))}
      </g>

      <style>{`
        .animated-building-logo {
          width: var(--logo-size);
          height: auto;
          display: block;
          overflow: visible;
        }

        .animated-building-logo * {
          vector-effect: non-scaling-stroke;
          transform-box: fill-box;
          transform-origin: center;
        }

        .draw-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation-play-state: running;
        }

        .is-paused,
        .is-paused * {
          animation-play-state: paused !important;
        }

        .mode-static .draw-layer {
          display: none;
        }

        .mode-static .final-layer {
          opacity: 1;
        }

        .mode-fill .draw-layer {
          display: none;
        }

        .mode-fill .final-layer {
          opacity: 0;
          animation: logoFadeIn var(--duration) ease var(--final-delay) forwards;
        }

        .mode-draw .final-layer {
          display: none;
        }

        .mode-draw .draw-path {
          animation: logoDraw var(--duration) cubic-bezier(.65, 0, .35, 1) var(--path-delay) forwards;
        }

        .mode-draw-fill .final-layer {
          opacity: 0;
          animation: logoFadeIn .45s ease var(--final-delay) forwards;
        }

        .mode-draw-fill .draw-layer {
          animation: logoDrawLayerOut .45s ease var(--final-delay) forwards;
        }

        .mode-draw-fill .draw-path {
          animation: logoDraw var(--duration) cubic-bezier(.65, 0, .35, 1) var(--path-delay) forwards;
        }

        .mode-trace .final-layer {
          opacity: var(--trace-opacity);
        }

        .mode-trace .draw-path {
          stroke-dasharray: .12 .88;
          stroke-dashoffset: 1;
          animation: logoTrace var(--duration) linear var(--path-delay) infinite;
        }

        .mode-pulse .draw-layer {
          display: none;
        }

        .mode-pulse .final-layer {
          animation: logoPulse var(--duration) ease-in-out infinite;
        }

        .effect-none {
          filter: none;
        }

        .effect-glow .draw-layer {
          filter: drop-shadow(0 0 8px var(--draw-color));
        }

        .effect-soft-glow .draw-layer {
          filter: drop-shadow(0 0 4px var(--draw-color));
        }

        .effect-shadow .final-layer {
          filter: drop-shadow(0 12px 18px rgba(0, 0, 0, .22));
        }

        .effect-blur .draw-layer {
          filter: blur(.25px) drop-shadow(0 0 10px var(--draw-color));
        }

        @keyframes logoDraw {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes logoTrace {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes logoFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes logoDrawLayerOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes logoPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: .82;
            transform: scale(.985);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animated-building-logo *,
          .animated-building-logo {
            animation: none !important;
          }

          .animated-building-logo .draw-layer {
            display: none !important;
          }

          .animated-building-logo .final-layer {
            opacity: 1 !important;
          }
        }
      `}</style>
    </svg>
  );
}