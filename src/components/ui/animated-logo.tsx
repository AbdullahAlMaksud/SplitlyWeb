"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/lib/utils";

export interface IAnimatedLogoProps {
  size?: number;
  className?: string;
  loop?: boolean;
}

export function AnimatedLogo({ size = 40, className, loop = false }: IAnimatedLogoProps) {
  const brandColor = "#008066"; // default brand color

  // Variants for drawing and filling
  const borderVariants = {
    hidden: { pathLength: 0, fillOpacity: 0 },
    visible: {
      pathLength: 1,
      fillOpacity: 1,
      transition: {
        pathLength: { type: "spring", duration: 1.2, bounce: 0 },
        fillOpacity: { delay: 0.6, duration: 0.4 },
        ...(loop ? {
          repeat: Infinity,
          repeatType: "reverse" as const,
          repeatDelay: 1,
        } : {}),
      },
    },
  };

  const barVariants = (delay: number) => ({
    hidden: { pathLength: 0, fillOpacity: 0, x: -5, opacity: 0 },
    visible: {
      pathLength: 1,
      fillOpacity: 1,
      x: 0,
      opacity: 1,
      transition: {
        pathLength: { delay, type: "spring", duration: 0.8, bounce: 0 },
        fillOpacity: { delay: delay + 0.3, duration: 0.3 },
        x: { delay, type: "spring", stiffness: 100, damping: 10 },
        opacity: { delay, duration: 0.3 },
        ...(loop ? {
          repeat: Infinity,
          repeatType: "reverse" as const,
          repeatDelay: 1 + (0.6 - delay),
        } : {}),
      },
    },
  });

  return (
    <div
      style={{ width: size, height: size }}
      className={cn("relative flex items-center justify-center select-none", className)}
    >
      <motion.svg
        viewBox="0 0 56 56"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={loop ? { rotate: 360 } : undefined}
        transition={loop ? { repeat: Infinity, duration: 6, ease: "linear" } : undefined}
      >
        {/* Outer Square Border */}
        <motion.path
          d="M 13.7851 49.5742 L 42.2382 49.5742 C 47.1366 49.5742 49.5743 47.1367 49.5743 42.3086 L 49.5743 13.6914 C 49.5743 8.8633 47.1366 6.4258 42.2382 6.4258 L 13.7851 6.4258 C 8.9101 6.4258 6.4257 8.8398 6.4257 13.6914 L 6.4257 42.3086 C 6.4257 47.1602 8.9101 49.5742 13.7851 49.5742 Z M 13.8554 45.8008 C 11.5117 45.8008 10.1992 44.5586 10.1992 42.1211 L 10.1992 13.8789 C 10.1992 11.4414 11.5117 10.1992 13.8554 10.1992 L 42.1679 10.1992 C 44.4882 10.1992 45.8007 11.4414 45.8007 13.8789 L 45.8007 42.1211 C 45.8007 44.5586 44.4882 45.8008 42.1679 45.8008 Z"
          fill={brandColor}
          stroke={brandColor}
          strokeWidth={0.5}
          variants={borderVariants}
          initial="hidden"
          animate="visible"
        />

        {/* Top Equal Sign Bar */}
        <motion.path
          d="M 19.1757 25.4571 L 36.8241 25.4571 C 38.0195 25.4571 38.8398 24.8711 38.8398 23.6758 C 38.8398 22.4805 38.0663 21.8711 36.8241 21.8711 L 19.1757 21.8711 C 17.9101 21.8711 17.1366 22.4805 17.1366 23.6758 C 17.1366 24.8711 17.9570 25.4571 19.1757 25.4571 Z"
          fill={brandColor}
          stroke={brandColor}
          strokeWidth={0.5}
          variants={barVariants(0.4)}
          initial="hidden"
          animate="visible"
        />

        {/* Bottom Equal Sign Bar */}
        <motion.path
          d="M 19.1757 34.1055 L 36.8241 34.1055 C 38.0195 34.1055 38.8398 33.5196 38.8398 32.3477 C 38.8398 31.1523 38.0663 30.5430 36.8241 30.5430 L 19.1757 30.5430 C 17.9101 30.5430 17.1366 31.1523 17.1366 32.3477 C 17.1366 33.5196 17.9570 34.1055 19.1757 34.1055 Z"
          fill={brandColor}
          stroke={brandColor}
          strokeWidth={0.5}
          variants={barVariants(0.6)}
          initial="hidden"
          animate="visible"
        />
      </motion.svg>
    </div>
  );
}
