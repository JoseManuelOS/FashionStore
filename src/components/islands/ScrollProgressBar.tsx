/**
 * ScrollProgressBar - Standalone scroll progress indicator
 * Shows visual progress of page scroll with gradient
 */

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/animations/gsap-config';

interface ScrollProgressBarProps {
  color?: string;
  height?: number;
  position?: 'top' | 'bottom';
}

export default function ScrollProgressBar({ 
  color = 'linear-gradient(90deg, #06b6d4, #d946ef)',
  height = 3,
  position = 'top'
}: ScrollProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!progressRef.current) return;

    gsap.to(progressRef.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === document.documentElement) {
          st.kill();
        }
      });
    };
  }, []);

  const positionStyles = position === 'top' 
    ? { top: 0 } 
    : { bottom: 0 };

  return (
    <div
      ref={progressRef}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        height: `${height}px`,
        background: color,
        transformOrigin: 'left',
        transform: 'scaleX(0)',
        zIndex: 9999,
        pointerEvents: 'none',
        ...positionStyles
      }}
    />
  );
}
