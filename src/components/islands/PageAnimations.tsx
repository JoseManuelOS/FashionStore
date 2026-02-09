/**
 * PageAnimations - Global animation controller component
 * Reads configuration and applies GSAP animations dynamically
 * This component is isolated and won't affect existing functionality
 */

import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, initGSAP } from '../../lib/animations/gsap-config';
import {
  type AnimationConfig,
  defaultAnimationConfig,
  animateHeroEntrance,
  animateProductsReveal,
  animateCategoriesReveal,
  animateSectionHeaders,
  initButtonRipple,
  animateFeaturesSection,
  animateCTABanner
} from '../../lib/animations/animation-presets';

interface PageAnimationsProps {
  config?: AnimationConfig;
}

export default function PageAnimations({ config }: PageAnimationsProps) {
  const initialized = useRef(false);
  const [animConfig, setAnimConfig] = useState<AnimationConfig>(config || defaultAnimationConfig);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Check if animations are enabled
    if (!animConfig.enabled) {
      console.log('[Animations] Disabled by configuration');
      return;
    }

    // Initialize GSAP (returns false if reduced motion is preferred)
    const canAnimate = initGSAP();
    if (!canAnimate && animConfig.respectReducedMotion) {
      console.log('[Animations] Respecting reduced motion preference');
      return;
    }

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      initializeAnimations();
    }, 100);

    return () => {
      clearTimeout(timeout);
      // Clean up ScrollTrigger instances
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [animConfig]);

  const initializeAnimations = () => {
    console.log('[Animations] Initializing with config:', animConfig);

    // Hero animations
    if (animConfig.hero) {
      animateHeroEntrance(animConfig.hero);
    }

    // Products scroll reveal
    if (animConfig.products) {
      animateProductsReveal(animConfig.products);
    }

    // Categories animations
    if (animConfig.categories) {
      animateCategoriesReveal(animConfig.categories);
    }

    // Section headers
    animateSectionHeaders();

    // Features section
    animateFeaturesSection();

    // CTA Banner
    animateCTABanner();

    // Button interactions
    if (animConfig.buttons?.ripple) {
      initButtonRipple();
    }

    // Scroll progress bar
    if (animConfig.scrollProgress?.enabled) {
      initScrollProgress(animConfig.scrollProgress);
    }
  };

  return null; // This component doesn't render anything
}

/**
 * Initialize scroll progress bar
 */
function initScrollProgress(config: AnimationConfig['scrollProgress']) {
  // Check if already exists
  if (document.querySelector('.scroll-progress-bar')) return;

  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: ${config.height}px;
    background: ${config.color === 'gradient' 
      ? 'linear-gradient(90deg, #06b6d4, #d946ef)' 
      : config.color};
    transform-origin: left;
    transform: scaleX(0);
    z-index: 9999;
    pointer-events: none;
  `;
  document.body.appendChild(progressBar);

  gsap.to(progressBar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3
    }
  });
}

/**
 * Export utility for manual toast notifications
 */
export function showToast(type: 'success' | 'error' | 'info', message: string) {
  const event = new CustomEvent('show-toast', {
    detail: { type, message }
  });
  window.dispatchEvent(event);
}
