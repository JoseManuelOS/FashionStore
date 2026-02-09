/**
 * Animation Presets - Reusable animation configurations
 * These can be customized via admin panel
 */

import { gsap, ScrollTrigger } from './gsap-config';

export interface AnimationConfig {
  enabled: boolean;
  respectReducedMotion: boolean;
  hero: {
    entrance: string;
    parallax: boolean;
    parallaxIntensity: number;
    duration: number;
    easing: string;
  };
  products: {
    scrollReveal: boolean;
    revealType: string;
    hoverEffect: string;
    staggerDelay: number;
    duration: number;
  };
  categories: {
    scrollReveal: boolean;
    hoverZoom: boolean;
    duration: number;
  };
  buttons: {
    ripple: boolean;
    ctaPulse: boolean;
    hoverScale: number;
    pulseDuration: number;
  };
  cart: {
    slideAnimation: boolean;
    itemsStagger: boolean;
    duration: number;
  };
  badges: {
    pulse: boolean;
    pulseDuration: number;
  };
  scrollProgress: {
    enabled: boolean;
    color: string;
    height: number;
  };
  pageTransitions: {
    enabled: boolean;
    type: string;
    duration: number;
  };
}

// Default configuration (fallback if DB config not available)
export const defaultAnimationConfig: AnimationConfig = {
  enabled: false,
  respectReducedMotion: true,
  hero: {
    entrance: 'zoom-fade',
    parallax: true,
    parallaxIntensity: 0.3,
    duration: 1.5,
    easing: 'power3.out'
  },
  products: {
    scrollReveal: true,
    revealType: 'stagger-up',
    hoverEffect: 'lift-glow',
    staggerDelay: 0.1,
    duration: 0.8
  },
  categories: {
    scrollReveal: true,
    hoverZoom: true,
    duration: 0.6
  },
  buttons: {
    ripple: true,
    ctaPulse: true,
    hoverScale: 1.02,
    pulseDuration: 2.5
  },
  cart: {
    slideAnimation: true,
    itemsStagger: true,
    duration: 0.4
  },
  badges: {
    pulse: true,
    pulseDuration: 1.8
  },
  scrollProgress: {
    enabled: true,
    color: 'gradient',
    height: 3
  },
  pageTransitions: {
    enabled: true,
    type: 'smooth-fade',
    duration: 0.3
  }
};

/**
 * Hero entrance animations
 */
export function animateHeroEntrance(config: AnimationConfig['hero']) {
  const heroSection = document.querySelector('.hero-carousel, .hero-section');
  if (!heroSection) return;

  const tl = gsap.timeline({ 
    defaults: { ease: config.easing, duration: config.duration },
    delay: 0.2
  });

  const heroImage = heroSection.querySelector('.hero-slide.active img, .hero-image');
  const heroSubtitle = heroSection.querySelector('.hero-subtitle');
  const heroTitle = heroSection.querySelector('.hero-title');
  const heroDescription = heroSection.querySelector('.hero-description');
  const heroCTA = heroSection.querySelector('.hero-btn, .hero-cta, [class*="cta"]');

  // Image zoom-out effect
  if (heroImage && config.entrance.includes('zoom')) {
    gsap.from(heroImage, {
      scale: 1.2,
      duration: config.duration * 1.3,
      ease: 'power2.out'
    });
  }

  // Text animations
  if (heroSubtitle) {
    tl.from(heroSubtitle, { y: 30, opacity: 0, duration: 0.6 }, 0);
  }
  if (heroTitle) {
    tl.from(heroTitle, { y: 60, opacity: 0, duration: 0.8 }, 0.15);
  }
  if (heroDescription) {
    tl.from(heroDescription, { y: 40, opacity: 0, duration: 0.6 }, 0.3);
  }
  if (heroCTA) {
    tl.from(heroCTA, { y: 30, opacity: 0, scale: 0.9, ease: 'back.out(1.7)' }, 0.4);
  }

  // Parallax on scroll
  if (config.parallax && heroImage) {
    gsap.to(heroImage, {
      y: 100 * config.parallaxIntensity,
      ease: 'none',
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }
}

/**
 * Products scroll reveal with stagger
 */
export function animateProductsReveal(config: AnimationConfig['products']) {
  if (!config.scrollReveal) return;

  const productCards = document.querySelectorAll('.product-card, .product-card-new');
  
  productCards.forEach((card, index) => {
    const col = index % 4;
    const delay = col * config.staggerDelay;

    gsap.from(card, {
      y: 80,
      opacity: 0,
      duration: config.duration,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top bottom-=50',
        toggleActions: 'play none none reverse'
      }
    });

    // Hover effects
    if (config.hoverEffect === 'lift-glow') {
      const image = card.querySelector('img');
      
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { 
          y: -12, 
          duration: 0.3, 
          ease: 'power2.out',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 50px rgba(6, 182, 212, 0.15)'
        });
        if (image) {
          gsap.to(image, { scale: 1.1, duration: 0.5, ease: 'power2.out' });
        }
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.3, boxShadow: 'none' });
        if (image) {
          gsap.to(image, { scale: 1, duration: 0.5 });
        }
      });
    }
  });
}

/**
 * Categories scroll reveal
 */
export function animateCategoriesReveal(config: AnimationConfig['categories']) {
  if (!config.scrollReveal) return;

  const categoryCards = document.querySelectorAll('.category-card');
  
  categoryCards.forEach((card, index) => {
    gsap.from(card, {
      y: 60,
      opacity: 0,
      duration: config.duration,
      delay: index * 0.15,
      scrollTrigger: {
        trigger: card,
        start: 'top bottom-=100'
      }
    });

    if (config.hoverZoom) {
      const image = card.querySelector('img');
      const arrow = card.querySelector('.category-link svg, .category-arrow');
      
      card.addEventListener('mouseenter', () => {
        if (image) gsap.to(image, { scale: 1.15, duration: 0.6 });
        if (arrow) gsap.to(arrow, { x: 8, duration: 0.3 });
      });

      card.addEventListener('mouseleave', () => {
        if (image) gsap.to(image, { scale: 1, duration: 0.6 });
        if (arrow) gsap.to(arrow, { x: 0, duration: 0.3 });
      });
    }
  });
}

/**
 * Section headers animation
 */
export function animateSectionHeaders() {
  const headers = document.querySelectorAll('.section-header');
  
  headers.forEach(header => {
    gsap.from(header, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: header,
        start: 'top bottom-=100'
      }
    });
  });
}

/**
 * Button ripple effect
 */
export function initButtonRipple() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .hero-btn, .cta-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const button = btn as HTMLElement;
      
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple-effect';
      
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = mouseEvent.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = mouseEvent.clientY - rect.top - size / 2 + 'px';
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      gsap.fromTo(ripple, 
        { scale: 0, opacity: 0.5 },
        { 
          scale: 4, 
          opacity: 0, 
          duration: 0.6, 
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    });
  });
}

/**
 * Features section animation
 */
export function animateFeaturesSection() {
  const features = document.querySelectorAll('.feature-item');
  
  gsap.from(features, {
    y: 40,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.features-section, .features-grid',
      start: 'top bottom-=100'
    }
  });
}

/**
 * CTA Banner animation
 */
export function animateCTABanner() {
  const ctaBanner = document.querySelector('.cta-banner');
  if (!ctaBanner) return;

  const content = ctaBanner.querySelector('.cta-content');
  const image = ctaBanner.querySelector('img');

  if (content) {
    gsap.from(content, {
      scale: 0.9,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: ctaBanner,
        start: 'top bottom-=100'
      }
    });
  }

  // Parallax on banner image
  if (image) {
    gsap.to(image, {
      y: 50,
      ease: 'none',
      scrollTrigger: {
        trigger: ctaBanner,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  }
}
