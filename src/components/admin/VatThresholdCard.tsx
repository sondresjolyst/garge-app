'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from '@sjolystinnovation/app-kit/toast';
import { formatNok } from '@/lib/formatUtils';
import VatService, { VatThreshold } from '@/services/vatService';
import { otherTurnoverSchema } from '@/lib/validation/otherTurnoverSchema';

// Twenty segments of 5 % each. The 80 % and 90 % warning levels fall on segment edges.
const SEGMENTS = 20;

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Europe/Oslo', year: 'numeric', month: 'short', day: 'numeric' });
}

function invoiceNumber(id: number): string {
    return `#${String(id).padStart(4, '0')}`;
}

/**
 * Turnover over the last 12 months against the 50 000 kr VAT registration threshold. After it is
 * passed, lists the sales that owe VAT from before registration and makes their VAT supplements
 * once VAT is on.
 */
export default function VatThresholdCard() {
    const [status, setStatus] = useState<VatThreshold | null>(null);
    const [otherNok, setOtherNok] = useState('');
    const [busy, setBusy] = useState(false);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const s = await VatService.getThreshold();
                if (!active) return;
                setStatus(s);
                setOtherNok((s.otherTurnoverInOre / 100).toFixed(2));
            } catch (e) {
                if (active) toast.error(e instanceof Error ? e.message : 'Failed to load the VAT threshold');
            }
        })();
        return () => { active = false; };
    }, [version]);

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

    if (status === null) return <div className="h-24 bg-gray-800/40 rounded-xl animate-pulse" />;

    const percent = Math.min(100, Math.floor((status.turnoverInOre * 100) / status.thresholdInOre));
    const passed = status.crossingInvoiceId !== null;
    const barColor = passed ? 'bg-red-500' : percent >= 90 ? 'bg-amber-500' : percent >= 80 ? 'bg-yellow-500' : 'bg-sky-500';
    const missingSupplements = status.owed.filter(o => o.supplementIssuedAt === null).length;

    const filled = Math.floor((percent * SEGMENTS) / 100);

    const saveOther = () => run(async () => {
        const parsed = otherTurnoverSchema.safeParse(otherNok);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Enter a valid amount.');
        await VatService.setOtherTurnover(parsed.data);
        toast.success('Other turnover saved');
    });

    const makeSupplements = () => run(async () => {
        const made = await VatService.makeSupplements();
        toast.success(made === 1 ? 'Made 1 VAT supplement' : `Made ${made} VAT supplements`);
    });

    return (
        <div className="space-y-4 bg-gray-900/50 border border-gray-700/40 rounded-xl p-4">
            <div>
                <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm font-medium text-gray-200">Turnover, last 12 months</p>
                    <p className="text-sm tabular-nums text-gray-100">
                        {formatNok(status.turnoverInOre)} <span className="text-gray-500">of {formatNok(status.thresholdInOre)}</span>
                    </p>
                </div>
                <div
                    className="mt-2 flex items-center gap-0.5"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${percent} % of the VAT threshold`}
                    aria-label="Share of the VAT threshold"
                >
                    {Array.from({ length: SEGMENTS }).map((_, i) => (
                        <span
                            key={i}
                            className={`h-2 flex-1 rounded-sm ${i < filled ? barColor : 'bg-gray-800'} ${i === 16 || i === 18 ? 'ml-0.5' : ''}`}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {percent} % of the VAT registration threshold. Admins are told at 80 %, 90 % and when it is passed.
                </p>
            </div>

            {passed && !status.vatEnabled && (
                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    Turnover passed 50 000 kr with invoice {invoiceNumber(status.crossingInvoiceId!)}
                    {status.crossedAt && <> on {formatDate(status.crossedAt)}</>}. Register for VAT, then turn VAT on.
                    VAT is owed on that sale and every sale after it, taken out of the price paid.
                </div>
            )}

            <div className="flex items-end gap-2">
                <label className="flex-1 text-xs text-gray-400">
                    Sales outside Garge, last 12 months
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">NOK</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={otherNok}
                            onChange={e => setOtherNok(e.target.value)}
                            className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg pl-11 pr-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                        />
                    </div>
                </label>
                <button
                    onClick={saveOther}
                    disabled={busy}
                    aria-label="Save sales outside Garge"
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-sm text-gray-100 rounded-lg transition-colors"
                >
                    Save
                </button>
            </div>

            {status.owed.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-200">
                            VAT owed from before registration: {formatNok(status.owedVatInOre)}
                        </p>
                        <button
                            onClick={() => run(VatService.downloadOwedCsv)}
                            disabled={busy}
                            className="text-xs text-sky-400 hover:text-sky-300 disabled:opacity-50"
                        >
                            Download CSV
                        </button>
                    </div>
                    <ul className="divide-y divide-gray-800 text-xs">
                        {status.owed.map(o => (
                            <li key={o.invoiceId} className="flex items-center justify-between gap-2 py-1.5">
                                <span className="text-gray-300">{invoiceNumber(o.invoiceId)} · {formatDate(o.issuedAt)}</span>
                                <span className="tabular-nums text-gray-400">
                                    {formatNok(o.amountInOre)}, VAT {formatNok(o.vatInOre)}
                                </span>
                                {o.supplementIssuedAt && o.supplementNumber ? (
                                    <button
                                        onClick={() => run(() => VatService.downloadSupplement(o.invoiceId, o.supplementNumber!))}
                                        disabled={busy}
                                        aria-label={`Download VAT supplement ${o.supplementNumber} for invoice ${invoiceNumber(o.invoiceId)}`}
                                        className="text-sky-400 hover:text-sky-300 disabled:opacity-50"
                                    >
                                        {o.supplementNumber}
                                    </button>
                                ) : (
                                    <span className="text-gray-400">No supplement</span>
                                )}
                            </li>
                        ))}
                    </ul>
                    {missingSupplements > 0 && (
                        <div className="space-y-1">
                            <button
                                onClick={makeSupplements}
                                disabled={busy || !status.vatEnabled}
                                aria-describedby="vat-supplement-help"
                                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                            >
                                Make VAT supplements ({missingSupplements})
                            </button>
                            {!status.vatEnabled && (
                                <p id="vat-supplement-help" className="text-xs text-gray-400">
                                    Turn VAT on after registration to make the supplements.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
