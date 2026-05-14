'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MinusIcon, PlusIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { CartLine, cartTotalInOre, removeLine, setLineQty } from '@/lib/cart';
import { ShopItem } from '@/services/shopService';
import { effectivePriceInOre, vatLabel } from '@/lib/pricing';
import { formatNok } from '@/lib/formatUtils';
import { normalizeNoPhone } from '@/lib/phone';
import { useEscapeKey } from '@/lib/useEscapeKey';

export interface CartDrawerProps {
    open: boolean;
    cart: CartLine[];
    items: ShopItem[];
    vatEnabled: boolean;
    initialPhone: string;
    submitting: boolean;
    onChange: (cart: CartLine[]) => void;
    onClose: () => void;
    onCheckout: (phoneMsisdn: string) => void;
}

interface ResolvedLine {
    line: CartLine;
    item: ShopItem | null;
}

export default function CartDrawer({
    open,
    cart,
    items,
    vatEnabled,
    initialPhone,
    submitting,
    onChange,
    onClose,
    onCheckout,
}: CartDrawerProps) {
    const [phone, setPhone] = useState(initialPhone);
    const phoneRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) setPhone(initialPhone);
    }, [open, initialPhone]);

    useEscapeKey(open && !submitting, onClose);

    if (!open) return null;

    const resolved: ResolvedLine[] = cart.map(line => ({
        line,
        item: items.find(i => i.id === line.shopItemId) ?? null,
    }));

    const priceableLines = resolved
        .filter(r => r.item && r.item.isActive)
        .map(r => ({ priceInOre: r.item!.priceInOre, quantity: r.line.quantity }));

    const total = cartTotalInOre(priceableLines, vatEnabled);

    const hasUnavailable = resolved.some(r => !r.item || !r.item.isActive || r.line.quantity > r.item.stockCount);
    const normalized = normalizeNoPhone(phone);
    const phoneValid = normalized !== null;
    const phoneTouched = phone.length > 0;
    const canSubmit = cart.length > 0 && !hasUnavailable && phoneValid && !submitting;

    function handleSubmit() {
        if (!canSubmit || !normalized) return;
        onCheckout(normalized);
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            className="fixed inset-0 z-50"
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                aria-hidden
                onClick={() => { if (!submitting) onClose(); }}
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-md bg-gray-900 border-l border-gray-700/60 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-700/60">
                    <h2 id="cart-drawer-title" className="text-base font-semibold text-gray-100">Cart</h2>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close cart"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">Your cart is empty.</p>
                    ) : (
                        resolved.map(({ line, item }) => {
                            if (!item || !item.isActive) {
                                return (
                                    <div key={line.shopItemId} className="flex items-center justify-between gap-3 p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl opacity-60">
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-300 truncate">Item no longer available</p>
                                            <p className="text-xs text-gray-500">Was id {line.shopItemId}</p>
                                        </div>
                                        <button
                                            onClick={() => onChange(removeLine(cart, line.shopItemId))}
                                            aria-label="Remove unavailable item"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            }
                            const overStock = line.quantity > item.stockCount;
                            const max = item.stockCount;
                            return (
                                <div key={line.shopItemId} className="flex flex-col gap-2 p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-100 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatNok(effectivePriceInOre(item.priceInOre, vatEnabled))} {vatLabel(vatEnabled)} each
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => onChange(removeLine(cart, line.shopItemId))}
                                            aria-label={`Remove ${item.name}`}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors flex-shrink-0"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 bg-gray-800/60 border border-gray-700/40 rounded-lg p-0.5">
                                            <button
                                                onClick={() => onChange(setLineQty(cart, line.shopItemId, line.quantity - 1, max))}
                                                aria-label="Decrease quantity"
                                                className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                                            >
                                                <MinusIcon className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="text-sm font-medium text-gray-100 w-6 text-center tabular-nums">{line.quantity}</span>
                                            <button
                                                onClick={() => onChange(setLineQty(cart, line.shopItemId, line.quantity + 1, max))}
                                                disabled={line.quantity >= max}
                                                aria-label="Increase quantity"
                                                className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <PlusIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-semibold text-sky-400 tabular-nums">
                                            {formatNok(effectivePriceInOre(item.priceInOre, vatEnabled) * line.quantity)}
                                        </p>
                                    </div>
                                    {overStock && (
                                        <p className="text-[11px] text-red-400">Only {item.stockCount} in stock — reduce quantity.</p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t border-gray-700/60 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Total</span>
                            <span className="text-lg font-bold text-sky-400 tabular-nums">
                                {formatNok(total)}
                                <span className="text-xs font-normal text-gray-500 ml-1">{vatLabel(vatEnabled)}</span>
                            </span>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider">Phone for Vipps</label>
                            <div className="relative">
                                <input
                                    ref={phoneRef}
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                                    placeholder="91 23 45 67"
                                    disabled={submitting}
                                    aria-invalid={phoneTouched && !phoneValid}
                                    className={`w-full bg-gray-800/60 border rounded-lg pl-3 pr-9 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-colors ${
                                        phoneTouched && !phoneValid
                                            ? 'border-red-600/60 focus:border-red-500'
                                            : phoneValid
                                                ? 'border-green-600/40 focus:border-green-500'
                                                : 'border-gray-700/60 focus:border-sky-500/60'
                                    }`}
                                />
                                {phoneValid && (
                                    <CheckIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-green-400" aria-hidden />
                                )}
                            </div>
                            {phoneTouched && !phoneValid && (
                                <p className="text-[11px] text-red-400">Enter a valid phone number.</p>
                            )}
                        </div>

                        {hasUnavailable && (
                            <p className="text-[11px] text-red-400">Fix unavailable lines before continuing.</p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {submitting ? 'Redirecting…' : 'Continue to Vipps'}
                        </button>
                        <p className="text-[11px] text-gray-600 text-center">
                            By continuing you accept our{' '}
                            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 transition-colors">Terms of Service</Link>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
