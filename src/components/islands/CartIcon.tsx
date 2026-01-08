import { useStore } from '@nanostores/react';
import { $cartCount } from '../../stores/cart';

interface CartIconProps {
    onClick?: () => void;
}

export default function CartIcon({ onClick }: CartIconProps) {
    const count = useStore($cartCount);

    return (
        <button
            onClick={onClick}
            className="relative p-2 text-brand-charcoal-600 hover:text-brand-navy-500 transition-colors"
            aria-label="Abrir carrito"
        >
            <svg
                className="w-6 h-6"
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

            {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-accent-leather text-white text-xs font-bold rounded-full animate-fade-in">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );
}
