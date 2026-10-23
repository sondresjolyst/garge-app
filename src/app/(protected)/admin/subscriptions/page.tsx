'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import TestPill from '@/components/TestPill';
import { toast } from '@sjolystinnovation/app-kit/toast';
import SubscriptionService, { AdminSubscription, SubscriptionInvoice } from '@/services/subscriptionService';
import { formatNok, parseKroner } from '@sjolystinnovation/app-kit/payments';
import { formatDate } from '@/lib/dateUtils';
import { statusColor } from '@/lib/statusUtils';
import { formatApiError } from '@/lib/errorMessages';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminSubscriptionsPage() {
    const [subs, setSubs] = useState<AdminSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [openInvoicesFor, setOpenInvoicesFor] = useState<number | null>(null);
    const [invoicesById, setInvoicesById] = useState<Record<number, SubscriptionInvoice[]>>({});
    const [invoicesLoading, setInvoicesLoading] = useState<number | null>(null);
    const [refundTarget, setRefundTarget] = useState<{ subId: number; invoice: SubscriptionInvoice } | null>(null);
    const [refundNok, setRefundNok] = useState('');

    useEffect(() => {
        async function load() {
            try {
                setSubs(await SubscriptionService.getAllSubscriptions());
            } catch (err) {
                toast.error(formatApiError(err, 'Failed to load subscriptions'));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function toggleInvoices(sub: AdminSubscription) {
        if (openInvoicesFor === sub.id) {
            setOpenInvoicesFor(null);
            return;
        }
        setOpenInvoicesFor(sub.id);
        if (invoicesById[sub.id]) return;
        setInvoicesLoading(sub.id);
        try {
            const list = await SubscriptionService.getSubscriptionInvoices(sub.id);
            setInvoicesById(prev => ({ ...prev, [sub.id]: list }));
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to load invoices'));
        } finally {
            setInvoicesLoading(null);
        }
    }

    function openRefund(subId: number, invoice: SubscriptionInvoice) {
        setRefundTarget({ subId, invoice });
        setRefundNok(((invoice.amountInOre - invoice.refundedInOre) / 100).toFixed(2));
    }

    async function handleRefund() {
        if (!refundTarget) return;
        const { subId, invoice } = refundTarget;
        const left = invoice.amountInOre - invoice.refundedInOre;
        const amountInOre = parseKroner(refundNok);
        if (amountInOre === null || amountInOre < 1 || amountInOre > left) {
            toast.error(`Enter an amount between ${formatNok(1)} and ${formatNok(left)}.`);
            return;
        }
        try {
            const result = await SubscriptionService.refundCharge(invoice.id, amountInOre);
            setInvoicesById(prev => ({
                ...prev,
                [subId]: prev[subId].map(i => i.id === invoice.id ? { ...i, refundedInOre: result.refundedInOre } : i),
            }));
            toast.success(`Refunded ${formatNok(amountInOre)}. The customer gets a credit note by email.`);
            setRefundTarget(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to refund the charge');
        }
    }

    async function handleDownload(invoiceId: number) {
        try {
            await SubscriptionService.downloadSubscriptionInvoice(invoiceId);
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to download invoice'));
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 pb-32">
            <div className="flex items-center gap-3">
                <Link href="/admin" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all" aria-label="Back to admin">
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                </Link>
                <h1 className="text-xl font-bold text-gray-100">Subscriptions</h1>
            </div>

            {loading ? (
                <LoadingDots height="h-32" />
            ) : (
                <Section title={`All subscriptions (${subs.length})`}>
                    {subs.length === 0 ? (
                        <p className="text-sm text-gray-500">No subscriptions yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {subs.map(sub => {
                                const isOpen = openInvoicesFor === sub.id;
                                const invoices = invoicesById[sub.id];
                                return (
                                    <li key={sub.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-100">Subscription #{sub.id}</p>
                                                    <TestPill visible={sub.isTest} />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 break-words">
                                                    {sub.userName} · {sub.userEmail}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">{sub.productName} · {sub.productType} · {sub.interval}</p>
                                                <p className="text-xs text-gray-600 mt-0.5">Created {formatDate(sub.createdAt)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <span className={`px-2 py-0.5 border rounded text-xs font-medium ${statusColor(sub.status)}`}>
                                                    {sub.status}
                                                </span>
                                                <span className="text-xs font-medium text-gray-300">{formatNok(sub.priceInOre)}</span>
                                            </div>
                                        </div>

                                        {sub.nextChargeDate && (
                                            <p className="text-xs text-gray-500">Next charge: {formatDate(sub.nextChargeDate)}</p>
                                        )}

                                        <div className="flex pt-1">
                                            <button
                                                onClick={() => toggleInvoices(sub)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50 text-gray-300 text-xs rounded-lg transition-colors"
                                            >
                                                {isOpen ? (
                                                    <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden />
                                                ) : (
                                                    <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
                                                )}
                                                Invoices ({sub.invoiceCount})
                                            </button>
                                        </div>

                                        {isOpen && (
                                            <div className="pt-2 border-t border-gray-700/30">
                                                {invoicesLoading === sub.id ? (
                                                    <LoadingDots height="h-8" />
                                                ) : invoices && invoices.length > 0 ? (
                                                    <ul className="space-y-1.5">
                                                        {invoices.map(inv => (
                                                            <li key={inv.id} className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-400">
                                                                    #{inv.id.toString().padStart(4, '0')} · {formatDate(inv.issuedAt)} · {formatNok(inv.amountInOre)}
                                                                    {inv.refundedInOre > 0 && (
                                                                        <span className="text-amber-400"> · {inv.refundedInOre >= inv.amountInOre ? 'refunded' : `${formatNok(inv.refundedInOre)} refunded`}</span>
                                                                    )}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    {inv.vippsChargeId && inv.refundedInOre < inv.amountInOre && (
                                                                        <button
                                                                            onClick={() => openRefund(sub.id, inv)}
                                                                            className="px-2 py-1 text-gray-400 hover:text-amber-400 hover:bg-amber-900/30 rounded transition-colors"
                                                                        >
                                                                            Refund
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleDownload(inv.id)}
                                                                        className="inline-flex items-center gap-1 px-2 py-1 text-gray-300 hover:text-white hover:bg-gray-700/60 rounded transition-colors"
                                                                    >
                                                                        <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden />
                                                                        PDF
                                                                    </button>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-500">No invoices yet.</p>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Section>
            )}
            {refundTarget && (
                <ConfirmModal
                    title="Refund charge"
                    message={
                        <div className="space-y-3">
                            <p>
                                Refund charge #{refundTarget.invoice.id.toString().padStart(4, '0')} of {formatDate(refundTarget.invoice.issuedAt)} through Vipps.
                                Up to {formatNok(refundTarget.invoice.amountInOre - refundTarget.invoice.refundedInOre)} is left to refund.
                                The customer is emailed a credit note.
                            </p>
                            <label className="block text-xs text-gray-400">
                                Amount in NOK
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={refundNok}
                                    onChange={e => setRefundNok(e.target.value)}
                                    className="mt-1 block w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                                />
                            </label>
                        </div>
                    }
                    confirmLabel="Refund"
                    onConfirm={handleRefund}
                    onCancel={() => setRefundTarget(null)}
                />
            )}
        </div>
    );
}
