import { useEffect } from 'react';
import gsap from 'gsap';

// Helper para verificar si hay elementos antes de animar
function animateIfExists(selector: string, fromVars: gsap.TweenVars, toVars: gsap.TweenVars) {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    gsap.fromTo(selector, fromVars, toVars);
  }
}

export default function AdminAnimations() {
  useEffect(() => {
    // Verificar preferencia de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Contexto GSAP para cleanup
    const ctx = gsap.context(() => {
      
      // Animar header
      animateIfExists(
        'header',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );

      // Animar título de página
      animateIfExists(
        'header h1',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: 'power2.out' }
      );

      // Animar stat cards con stagger
      animateIfExists(
        '.stat-card',
        { y: 30, opacity: 0, scale: 0.95 },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1,
          duration: 0.5, 
          stagger: 0.08,
          delay: 0.3,
          ease: 'back.out(1.2)'
        }
      );

      // Animar tarjetas de contenido principal (con selectores más específicos)
      animateIfExists(
        'main > .space-y-6 > div, main > .grid > div',
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.5, 
          stagger: 0.05,
          delay: 0.4,
          ease: 'power2.out'
        }
      );

      // Animar tablas si existen
      animateIfExists(
        'table',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.5 }
      );

      animateIfExists(
        'tbody tr',
        { x: -20, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.3, 
          stagger: 0.03,
          delay: 0.6,
          ease: 'power2.out'
        }
      );

      // Animar botones con hover effect
      const buttons = document.querySelectorAll('button:not(#logout-btn), a[class*="bg-gradient"], a[class*="bg-cyan"]');
      buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { scale: 1.02, duration: 0.2, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
        });
      });

      // Animar gráficos/charts si existen
      animateIfExists(
        '.recharts-wrapper',
        { opacity: 0, scale: 0.9 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.6, 
          delay: 0.7,
          ease: 'power2.out'
        }
      );

      // Animar iconos en la sidebar (sutilmente)
      animateIfExists(
        'aside nav a svg',
        { rotate: -10, opacity: 0.5 },
        { 
          rotate: 0, 
          opacity: 1, 
          duration: 0.3, 
          stagger: 0.03,
          delay: 0.2,
          ease: 'power2.out'
        }
      );

      // Efecto de número contando para estadísticas
      const statValues = document.querySelectorAll('.stat-value');
      statValues.forEach(el => {
        const text = el.textContent || '';
        const number = parseInt(text.replace(/[^0-9]/g, ''));
        
        if (!isNaN(number) && number > 0 && number < 100000) {
          const prefix = text.match(/^[^0-9]*/)?.[0] || '';
          const suffix = text.match(/[^0-9]*$/)?.[0] || '';
          
          gsap.fromTo(
            { val: 0 },
            { val: number },
            {
              duration: 1.5,
              delay: 0.5,
              ease: 'power2.out',
              onUpdate: function() {
                const current = Math.round(this.targets()[0].val);
                el.textContent = prefix + current.toLocaleString() + suffix;
              }
            }
          );
        }
      });

    });

    // Cleanup
    return () => ctx.revert();
  }, []);

  return null;
}
