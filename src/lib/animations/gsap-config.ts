/**
 * GSAP Configuration for FashionStore
 * Configures GSAP globally with ScrollTrigger and accessibility support
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins
gsap.registerPlugin(ScrollTrigger);

// Global defaults
gsap.defaults({
  ease: 'power3.out',
  duration: 0.8
});

// ScrollTrigger configuration
ScrollTrigger.config({
  limitCallbacks: true,
  ignoreMobileResize: true
});

/**
 * Initialize GSAP with accessibility configuration
 */
export function initGSAP(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Respect reduced motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    gsap.globalTimeline.timeScale(10); // Nearly instant animations
    console.log('[GSAP] Reduced motion mode enabled');
    return false;
  }
  
  // Refresh ScrollTrigger on resize (debounced)
  let resizeTimer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
  });
  
  return true;
}

/**
 * Animation presets for scroll reveal
 */
export const animationPresets = {
  'fade-up': { y: 60, opacity: 0 },
  'fade-down': { y: -60, opacity: 0 },
  'fade-left': { x: -60, opacity: 0 },
  'fade-right': { x: 60, opacity: 0 },
  'scale-up': { scale: 0.8, opacity: 0 },
  'scale-down': { scale: 1.2, opacity: 0 },
  'rotate-in': { rotation: -10, opacity: 0 },
  'blur-in': { filter: 'blur(10px)', opacity: 0 }
} as const;

/**
 * Recommended durations
 */
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
  slowest: 1.2
} as const;

/**
 * Custom easings
 */
export const easings = {
  smooth: 'power3.out',
  bounce: 'back.out(1.7)',
  elastic: 'elastic.out(1, 0.5)',
  snap: 'power4.out'
} as const;

export { gsap, ScrollTrigger };
