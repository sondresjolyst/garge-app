'use client';

import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export interface CartFabProps {
    count: number;
    onClick: () => void;
}

export default function CartFab({ count, onClick }: CartFabProps) {
    if (count <= 0) return null;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Open cart (${count} item${count === 1 ? '' : 's'})`}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 transition-colors"
        >
            <ShoppingCartIcon className="h-6 w-6" />
            <span
                aria-hidden
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums"
            >
                {count > 99 ? '99+' : count}
            </span>
        </button>
    );
}
