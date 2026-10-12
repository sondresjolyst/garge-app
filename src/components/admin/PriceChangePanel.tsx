'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from '@sjolystinnovation/app-kit/toast';
import { formatNok } from '@sjolystinnovation/app-kit/payments';
import ConfirmModal from '@/components/ConfirmModal';
import ProductService, { PriceChange, Product } from '@/services/productService';
import { formatDate } from '@/lib/dateUtils';
import { earliestEffectiveFrom, MIN_NOTICE_DAYS, priceChangeSchema } from '@/lib/validation/priceChangeSchema';

function state(change: PriceChange): { label: string; className: string } {
    if (change.cancelledAt) return { label: 'Cancelled', className: 'bg-gray-700/50 border-gray-600/40 text-gray-500' };
    if (change.appliedAt) return { label: 'In effect', className: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-400' };
    return { label: 'Scheduled', className: 'bg-amber-900/30 border-amber-700/40 text-amber-400' };
}

interface PriceChangePanelProps {
    product: Product;
}

/**
 * Schedules and cancels price increases for one plan. Each subscriber is emailed a notice, may cancel
 * at no cost, and pays the new price from the effective date, or 30 days after their notice if that
 * is later (digitalytelsesloven § 28).
 */
export default function PriceChangePanel({ product }: PriceChangePanelProps) {
    const [changes, setChanges] = useState<PriceChange[] | null>(null);
    const [newPrice, setNewPrice] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState(() => earliestEffectiveFrom());
    const [busy, setBusy] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<PriceChange | null>(null);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const all = await ProductService.getPriceChanges(product.id);
                if (active) setChanges(all);
            } catch (e) {
                if (active) toast.error(e instanceof Error ? e.message : 'Failed to load price changes');
            }
        })();
        return () => { active = false; };
    }, [product.id, version]);

    const run = useCallback(async (action: () => Promise<void>) => {
        setBusy(true);
        try {
            await action();
            setVersion(v => v + 1);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setBusy(false);
        }
    }, []);

    const pending = changes?.find(c => !c.cancelledAt && !c.appliedAt) ?? null;
    const period = product.interval === 'Monthly' ? 'mo' : 'yr';

    const schedule = () => run(async () => {
        const parsed = priceChangeSchema(product.priceInOre).safeParse({ newPrice, effectiveFrom });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check the price and the date.');
        await ProductService.schedulePriceChange(product.id, parsed.data.newPrice, parsed.data.effectiveFrom);
        setNewPrice('');
        toast.success('Price change scheduled. Subscribers are emailed shortly.');
    });

    const cancel = async () => {
        if (!cancelTarget) return;
        const target = cancelTarget;
        await run(async () => {
            await ProductService.cancelPriceChange(product.id, target.id);
            toast.success('Price change cancelled');
        });
        setCancelTarget(null);
    };

    return (
        <div className="mt-3 space-y-3 border-t border-gray-700/30 pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price changes</p>

            {changes === null ? (
                <div className="h-10 bg-gray-800/40 rounded-lg animate-pulse" />
            ) : changes.length === 0 ? (
                <p className="text-xs text-gray-500">No price changes yet.</p>
            ) : (
                <ul className="space-y-1.5">
                    {changes.map(c => {
                        const s = state(c);
                        return (
                            <li key={c.id} className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="tabular-nums text-gray-300">
                                        {formatNok(c.oldPriceInOre)} → {formatNok(c.newPriceInOre)} / {period}
                                    </span>
                                    <span className="text-gray-500">from {formatDate(c.effectiveFrom)}</span>
                                    <span className={`px-1.5 py-0.5 border rounded font-medium ${s.className}`}>{s.label}</span>
                                    {!c.cancelledAt && (
                                        <span className="text-gray-500 tabular-nums">
                                            {c.notifiedCount} of {c.noticeCount} notified, {c.appliedCount} paying
                                        </span>
                                    )}
                                </div>
                                {s.label === 'Scheduled' && (
                                    <button
                                        onClick={() => setCancelTarget(c)}
                                        disabled={busy}
                                        className="shrink-0 px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {changes !== null && !pending && (
                <div className="space-y-2">
                    <div className="flex flex-wrap items-end gap-2">
                        <label className="flex-1 min-w-36 text-xs text-gray-400">
                            New price
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">NOK</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={newPrice}
                                    onChange={e => setNewPrice(e.target.value)}
                                    placeholder={(product.priceInOre / 100).toFixed(2)}
                                    className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg pl-11 pr-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                                />
                            </div>
                        </label>
                        <label className="text-xs text-gray-400">
                            Takes effect
                            <input
                                type="date"
                                value={effectiveFrom}
                                min={earliestEffectiveFrom()}
                                onChange={e => setEffectiveFrom(e.target.value)}
                                className="mt-1 block bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60 [color-scheme:dark]"
                            />
                        </label>
                        <button
                            onClick={schedule}
                            disabled={busy || newPrice.trim() === ''}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {busy ? 'Scheduling…' : 'Schedule increase'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">
                        Every subscriber is emailed a notice and may cancel at no cost. They pay the new price from this date,
                        or {MIN_NOTICE_DAYS} days after their notice if that is later. Lower a price by editing the plan, which applies at once.
                    </p>
                </div>
            )}

            {cancelTarget && (
                <ConfirmModal
                    title="Cancel price change"
                    subtitle="Subscribers keep their current price"
                    message={<>Cancel the change to <span className="font-medium text-gray-100">{formatNok(cancelTarget.newPriceInOre)}</span> from {formatDate(cancelTarget.effectiveFrom)}? Subscribers already notified are not emailed again.</>}
                    confirmLabel="Cancel change"
                    cancelLabel="Keep it"
                    onConfirm={cancel}
                    onCancel={() => setCancelTarget(null)}
                />
            )}
        </div>
    );
}
