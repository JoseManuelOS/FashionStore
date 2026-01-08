/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // FashionMarket Brand Colors
                brand: {
                    navy: {
                        50: '#e6eaef',
                        100: '#b3c2d4',
                        200: '#809ab8',
                        300: '#4d729d',
                        400: '#264b7e',
                        500: '#1e3a5f', // Primary navy
                        600: '#1a3252',
                        700: '#152944',
                        800: '#102037',
                        900: '#0b172a'
                    },
                    charcoal: {
                        50: '#f5f5f6',
                        100: '#e0e2e4',
                        200: '#c1c5c9',
                        300: '#a2a8ae',
                        400: '#6b7280',
                        500: '#374151', // Primary charcoal
                        600: '#2f3845',
                        700: '#272f3a',
                        800: '#1f252e',
                        900: '#171c23'
                    }
                },
                cream: {
                    50: '#fffefb',
                    100: '#fdfcf8',
                    200: '#faf8f5', // Primary off-white/cream
                    300: '#f5f2ed',
                    400: '#ebe7df',
                    500: '#ddd8cd'
                },
                accent: {
                    leather: '#b08d57', // Matte gold/leather accent
                    'leather-light': '#c4a574',
                    'leather-dark': '#8d7046'
                }
            },
            fontFamily: {
                serif: ['Playfair Display', 'Georgia', 'serif'],
                sans: ['Inter', 'system-ui', 'sans-serif']
            },
            boxShadow: {
                'elegant': '0 4px 20px -4px rgba(30, 58, 95, 0.15)',
                'elegant-lg': '0 8px 40px -8px rgba(30, 58, 95, 0.2)'
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out'
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                }
            }
        }
    },
    plugins: []
};
