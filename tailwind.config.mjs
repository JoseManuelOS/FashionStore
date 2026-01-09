/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // Futuristic Dark Theme
                dark: {
                    50: '#f5f5f6',
                    100: '#2a2a35',
                    200: '#1f1f28',
                    300: '#18181f',
                    400: '#12121a',
                    500: '#0d0d14', // Primary dark
                    600: '#0a0a0f',
                    700: '#080810',
                    800: '#050508',
                    900: '#020204',
                    950: '#000000'
                },
                neon: {
                    cyan: '#06b6d4',
                    'cyan-light': '#22d3ee',
                    'cyan-dark': '#0891b2',
                    fuchsia: '#d946ef',
                    'fuchsia-light': '#e879f9',
                    'fuchsia-dark': '#a21caf',
                    blue: '#3b82f6',
                    purple: '#8b5cf6'
                },
                glass: {
                    light: 'rgba(255, 255, 255, 0.05)',
                    medium: 'rgba(255, 255, 255, 0.08)',
                    heavy: 'rgba(255, 255, 255, 0.12)'
                }
            },
            fontFamily: {
                display: ['Space Grotesk', 'system-ui', 'sans-serif'],
                sans: ['Inter', 'system-ui', 'sans-serif']
            },
            boxShadow: {
                'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
                'glow-cyan-lg': '0 0 40px rgba(6, 182, 212, 0.4)',
                'glow-fuchsia': '0 0 20px rgba(217, 70, 239, 0.3)',
                'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
                'card-hover': '0 20px 50px rgba(6, 182, 212, 0.15)'
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
                'gradient-mesh': 'linear-gradient(135deg, #0d0d14 0%, #1a1a2e 50%, #0d0d14 100%)',
                'gradient-hero': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 25%, #0f172a 50%, #0d0d14 100%)',
                'gradient-card': 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)'
            },
            animation: {
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out'
            },
            keyframes: {
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.5)' }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                }
            },
            transitionDuration: {
                '400': '400ms'
            },
            backdropBlur: {
                'xs': '2px'
            }
        }
    },
    plugins: []
};
