'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@sjolystinnovation/app-kit/toast';
import { formatNok, kroner } from '@sjolystinnovation/app-kit/payments';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import VatService, { VatThreshold } from '@/services/vatService';
import { FieldValidationError } from '@/lib/errors';
import {
    OUTSIDE_SALES_MONTHS_BACK, currentMonth, monthsBefore, outsideAmountSchema, outsideMonthSchema,
} from '@/lib/validation/outsideSalesSchema';

// Twenty segments of 5 % each. The 80 % and 90 % warning levels fall on segment edges.
const SEGMENTS = 20;

const fieldClass = 'w-full bg-gray-900/60 border border-gray-700/60 rounded-lg py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60';

type OutsideErrors = { month?: string; amount?: string };

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Europe/Oslo', year: 'numeric', month: 'short', day: 'numeric' });
}

function invoiceNumber(id: number): string {
    return `#${String(id).padStart(4, '0')}`;
}

/** A yyyy-MM month as "Oct 2026". It is a calendar month already, so no time zone applies. */
function monthName(month: string): string {
    const [year, number] = month.split('-').map(Number);
    return new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString('en-GB', { timeZone: 'UTC', year: 'numeric', month: 'short' });
}

/** The stored sales outside Garge for the month as the amount field shows them, empty when none. */
function storedAmount(status: VatThreshold, month: string): string {
    const stored = status.months.find(m => m.month === month)?.outsideInOre ?? 0;
    return stored > 0 ? (stored / 100).toFixed(2) : '';
}

/**
 * Turnover over the last 12 months against the 50 000 kr VAT registration threshold, with the sales
 * in and outside Garge per month. After it is passed, lists the sales that owe VAT from before
 * registration. Once VAT is on, each of them gets a credit note for its VAT-free invoice and a new
 * invoice with VAT included in the same price.
 */
export default function VatThresholdCard() {
    const [status, setStatus] = useState<VatThreshold | null>(null);
    const [month, setMonth] = useState(() => currentMonth(new Date()));
    const [amount, setAmount] = useState('');
    const [outsideErrors, setOutsideErrors] = useState<OutsideErrors>({});
    const [busy, setBusy] = useState(false);
    const [version, setVersion] = useState(0);
    const amountRef = useRef<HTMLInputElement>(null);
    // The chosen month for the first load, which runs once and must not restart when the month changes.
    const monthRef = useRef(month);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const s = await VatService.getThreshold();
                if (!active) return;
                setStatus(s);
                // The first load fills the amount for the chosen month. Later loads keep what is typed.
                if (version === 0) setAmount(storedAmount(s, monthRef.current));
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
    // Sales outside Garge alone can pass the threshold, and then there is no crossing invoice.
    const passed = status.crossedAt !== null;
    const barColor = passed ? 'bg-red-500' : percent >= 90 ? 'bg-amber-500' : percent >= 80 ? 'bg-yellow-500' : 'bg-sky-500';
    const uncorrected = status.owed.filter(o => o.correctedAt === null).length;

    const filled = Math.floor((percent * SEGMENTS) / 100);
    const latestMonth = currentMonth(new Date());

    const chooseMonth = (chosen: string) => {
        // The amount field shows what is stored for the chosen month, so the admin edits rather than adds.
        setMonth(chosen);
        monthRef.current = chosen;
        setAmount(storedAmount(status, chosen));
        setOutsideErrors({});
    };

    const editMonth = (chosen: string) => {
        chooseMonth(chosen);
        amountRef.current?.focus();
    };

    const saveOutside = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsedMonth = outsideMonthSchema(new Date()).safeParse(month);
        const parsedAmount = outsideAmountSchema.safeParse(amount);
        setOutsideErrors({
            month: parsedMonth.success ? undefined : parsedMonth.error.issues[0]?.message,
            amount: parsedAmount.success ? undefined : parsedAmount.error.issues[0]?.message,
        });
        if (!parsedMonth.success || !parsedAmount.success) return;

        setBusy(true);
        try {
            const saved = await VatService.setOutsideSales(parsedMonth.data, parsedAmount.data);
            setStatus(saved);
            setAmount(storedAmount(saved, parsedMonth.data));
            toast.success(parsedAmount.data === 0
                ? `Sales outside Garge removed for ${monthName(parsedMonth.data)}`
                : `Sales outside Garge saved for ${monthName(parsedMonth.data)}`);
        } catch (err) {
            if (err instanceof FieldValidationError) {
                const { month: monthErrors, amountInOre: amountErrors, ...other } = err.fieldErrors;
                setOutsideErrors({ month: monthErrors?.[0], amount: amountErrors?.[0] });
                // A field error without a field on screen shows its own message, never "Validation failed".
                const otherMessage = Object.values(other).flat()[0];
                if (otherMessage) toast.error(otherMessage);
                else if (!monthErrors?.length && !amountErrors?.length) toast.error('Failed to save the sales outside Garge');
            } else {
                toast.error(err instanceof Error ? err.message : 'Something went wrong');
            }
        } finally {
            setBusy(false);
        }
    };

    const makeCorrections = () => run(async () => {
        const made = await VatService.makeCorrections();
        toast.success(made === 1 ? 'Corrected 1 sale' : `Corrected ${made} sales`);
    });

    return (
        <div className="space-y-4 bg-gray-900/50 border border-gray-700/40 rounded-xl p-4">
            <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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
                    {status.crossingInvoiceId !== null ? (
                        <>
                            Turnover passed 50 000 kr with invoice {invoiceNumber(status.crossingInvoiceId)} on {formatDate(status.crossedAt!)}.
                            Register for VAT, then turn VAT on. VAT is owed on that sale and every sale after it, taken out of the price paid.
                        </>
                    ) : (
                        <>
                            Turnover passed 50 000 kr with sales outside Garge on {formatDate(status.crossedAt!)}.
                            Register for VAT, then turn VAT on. VAT is owed on every sale in Garge from that day, taken out of the price paid.
                        </>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-gray-200">Sales per month</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Sales outside Garge count toward the threshold too. Enter them per month, up to {OUTSIDE_SALES_MONTHS_BACK} months back. Enter 0 to remove a month.
                    </p>
                </div>

                <form
                    onSubmit={saveOutside}
                    noValidate
                    aria-label="Sales outside Garge for one month"
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-start"
                >
                    <div>
                        <label htmlFor="vat-outside-month" className="block text-xs text-gray-400">Month</label>
                        <input
                            id="vat-outside-month"
                            type="month"
                            value={month}
                            min={monthsBefore(latestMonth, OUTSIDE_SALES_MONTHS_BACK)}
                            max={latestMonth}
                            onChange={e => chooseMonth(e.target.value)}
                            aria-invalid={outsideErrors.month ? true : undefined}
                            aria-describedby={outsideErrors.month ? 'vat-outside-month-error' : undefined}
                            className={`${fieldClass} mt-1 px-3 [color-scheme:dark]`}
                        />
                        {outsideErrors.month && <p id="vat-outside-month-error" className="text-xs text-red-400 mt-1">{outsideErrors.month}</p>}
                    </div>
                    <div>
                        <label htmlFor="vat-outside-amount" className="block text-xs text-gray-400">Sales outside Garge</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none" aria-hidden="true">NOK</span>
                            <input
                                id="vat-outside-amount"
                                ref={amountRef}
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                aria-invalid={outsideErrors.amount ? true : undefined}
                                aria-describedby={outsideErrors.amount ? 'vat-outside-amount-error' : undefined}
                                className={`${fieldClass} pl-11 pr-3`}
                            />
                        </div>
                        {outsideErrors.amount && <p id="vat-outside-amount-error" className="text-xs text-red-400 mt-1">{outsideErrors.amount}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={busy}
                        aria-label="Save sales outside Garge"
                        className="sm:mt-5 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-sm text-gray-100 rounded-lg transition-colors"
                    >
                        Save
                    </button>
                </form>

                {/* The month is the edit button and a phone drops the NOK prefix from the cells, so all columns fit at 390px. */}
                <table className="w-full text-xs">
                    <caption className="sr-only">Sales in and outside Garge per month, oldest first. Choose a month to edit its sales outside Garge.</caption>
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th scope="col" className="py-1.5 pr-2 font-medium">Month</th>
                            <th scope="col" className="py-1.5 pr-2 text-right font-medium">In Garge<span className="sm:hidden">, NOK</span></th>
                            <th scope="col" className="py-1.5 text-right font-medium">Outside Garge<span className="sm:hidden">, NOK</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {status.months.map(m => (
                            <tr key={m.month} className={m.month === month ? 'bg-gray-800/40' : undefined}>
                                <th scope="row" className="py-1.5 pr-2 text-left font-normal whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => editMonth(m.month)}
                                        disabled={busy}
                                        aria-label={`Edit sales outside Garge for ${monthName(m.month)}`}
                                        className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 disabled:opacity-50"
                                    >
                                        {monthName(m.month)}
                                        <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                </th>
                                <td className="py-1.5 pr-2 text-right tabular-nums text-gray-400 whitespace-nowrap">
                                    <span className="max-sm:sr-only">NOK </span>{kroner(m.salesInOre)}
                                </td>
                                <td className="py-1.5 text-right tabular-nums text-gray-400 whitespace-nowrap">
                                    <span className="max-sm:sr-only">NOK </span>{kroner(m.outsideInOre)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                                {o.creditNoteId && o.replacementInvoiceId ? (
                                    <span className="flex gap-2">
                                        <button
                                            onClick={() => run(() => VatService.downloadDocument(o.creditNoteId!, 'credit-note'))}
                                            disabled={busy}
                                            aria-label={`Download credit note ${invoiceNumber(o.creditNoteId)} for invoice ${invoiceNumber(o.invoiceId)}`}
                                            className="text-sky-400 hover:text-sky-300 disabled:opacity-50"
                                        >
                                            Credit {invoiceNumber(o.creditNoteId)}
                                        </button>
                                        <button
                                            onClick={() => run(() => VatService.downloadDocument(o.replacementInvoiceId!, 'invoice'))}
                                            disabled={busy}
                                            aria-label={`Download invoice ${invoiceNumber(o.replacementInvoiceId)} with VAT for invoice ${invoiceNumber(o.invoiceId)}`}
                                            className="text-sky-400 hover:text-sky-300 disabled:opacity-50"
                                        >
                                            Invoice {invoiceNumber(o.replacementInvoiceId)}
                                        </button>
                                    </span>
                                ) : (
                                    <span className="text-gray-400">Not corrected</span>
                                )}
                            </li>
                        ))}
                    </ul>
                    {uncorrected > 0 && (
                        <div className="space-y-1">
                            <button
                                onClick={makeCorrections}
                                disabled={busy || !status.vatEnabled}
                                aria-describedby="vat-correction-help"
                                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                            >
                                Make credit notes and new invoices ({uncorrected})
                            </button>
                            <p id="vat-correction-help" className="text-xs text-gray-400">
                                {status.vatEnabled
                                    ? 'Each sale gets a credit note for its invoice without VAT and a new invoice with VAT included in the same price. Both are emailed to the customer, who pays nothing more.'
                                    : 'Turn VAT on after registration to make the credit notes and new invoices.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
