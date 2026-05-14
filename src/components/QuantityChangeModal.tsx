'use client';

import { useState } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '@/lib/useEscapeKey';
import { effectivePriceInOre, vatLabel } from '@/lib/pricing';
import { formatNok } from '@/lib/formatUtils';
import type { Subscription } from '@/services/subscriptionService';

export interface QuantityChangeModalProps {
    subscription: Subscription;
    vatEnabled: boolean;
    submitting: boolean;
    onConfirm: (qty: number) => void;
    onCancel: () => void;
}

export default function QuantityChangeModal({
    subscription,
    vatEnabled,
    submitting,
    onConfirm,
    onCancel,
}: QuantityChangeModalProps) {
    const [qty, setQty] = useState(subscription.quantity);

    useEscapeKey(!submitting, onCancel);

    const unitPrice = effectivePriceInOre(subscription.priceInOre, vatEnabled);
    const newTotal = unitPrice * qty;
    const intervalLabel = subscription.interval === 'Monthly' ? 'month' : 'year';
    const changed = qty !== subscription.quantity;

    function clamp(n: number) {
        return Math.max(1, Math.min(50, n));
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qty-change-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div className="absolute inset-0" aria-hidden onClick={() => { if (!submitting) onCancel(); }} />
            <div className="relative bg-gray-900 border border-gray-700/60 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
                <div>
                    <p id="qty-change-title" className="text-sm font-semibold text-gray-100">Change quantity</p>
                    <p className="text-xs text-gray-500 mt-1">{subscription.productName} — currently × {subscription.quantity}</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setQty(clamp(qty - 1))}
                        disabled={qty <= 1 || submitting}
                        aria-label="Decrease quantity"
                        className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/40 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="text-2xl font-bold text-gray-100 w-12 text-center tabular-nums">{qty}</span>
                    <button
                        onClick={() => setQty(clamp(qty + 1))}
                        disabled={qty >= 50 || submitting}
                        aria-label="Increase quantity"
                        className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/40 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">New price</span>
                    <span className="text-sky-400 font-semibold tabular-nums">
                        {formatNok(newTotal)} / {intervalLabel}
                        <span className="text-gray-600 font-normal ml-1">{vatLabel(vatEnabled)}</span>
                    </span>
                </div>

                <p className="text-[11px] text-amber-400">
                    You will need to confirm the new price in your Vipps app before it takes effect.
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={() => onConfirm(qty)}
                        disabled={!changed || submitting}
                        className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {submitting ? 'Updating…' : 'Update quantity'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
