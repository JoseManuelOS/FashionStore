import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { $cartCount } from '../../stores/cart';

export default function CartIcon() {
    const count = useStore($cartCount);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('toggle-cart'));
    };

    return (
        <button
            onClick={handleClick}
            className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all group"
            aria-label="Abrir carrito"
        >
            <svg
                className="w-5 h-5 transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
            </svg>

            {isHydrated && count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-neon-cyan to-neon-fuchsia text-dark-600 text-xs font-bold rounded-full flex items-center justify-center animate-scale-in shadow-glow-cyan">
                    {count}
                </span>
            )}
        </button>
    );
}
