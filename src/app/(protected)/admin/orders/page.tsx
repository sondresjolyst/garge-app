'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import ConfirmModal from '@/components/ConfirmModal';
import TestPill from '@/components/TestPill';
import { toast } from 'sonner';
import ShopService, { AdminOrder } from '@/services/shopService';
import { formatNok } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import { statusColor } from '@/lib/statusUtils';
import { formatApiError } from '@/lib/errorMessages';

const RESERVATION_DAYS = 7;

function reservationCountdown(createdAt: string): { days: number; expired: boolean } {
    const created = new Date(createdAt).getTime();
    const expiry = created + RESERVATION_DAYS * 24 * 60 * 60 * 1000;
    const remainingMs = expiry - Date.now();
    const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return { days, expired: remainingMs <= 0 };
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const [captureTarget, setCaptureTarget] = useState<AdminOrder | null>(null);
    const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);
    const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setOrders(await ShopService.getAllOrders());
            } catch (err) {
                toast.error(formatApiError(err, 'Failed to load orders'));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function runOrderAction(
        target: AdminOrder | null,
        clear: () => void,
        call: (id: number) => Promise<void>,
        newStatus: AdminOrder['status'],
        successMsg: string,
        errorMsg: string,
    ) {
        if (!target) return;
        try {
            await call(target.id);
            toast.success(successMsg);
            setOrders(prev => prev.map(o => o.id === target.id ? { ...o, status: newStatus } : o));
            clear();
        } catch (err) {
            toast.error(formatApiError(err, errorMsg));
        }
    }

    const handleCapture = () => runOrderAction(captureTarget, () => setCaptureTarget(null),
        ShopService.captureOrder, 'Paid', `Order #${captureTarget?.id} charged & shipped`, 'Failed to capture order');

    const handleCancel = () => runOrderAction(cancelTarget, () => setCancelTarget(null),
        ShopService.cancelOrder, 'Cancelled', `Order #${cancelTarget?.id} cancelled`, 'Failed to cancel order');

    const handleRefund = () => runOrderAction(refundTarget, () => setRefundTarget(null),
        ShopService.refundOrder, 'Refunded', `Order #${refundTarget?.id} refunded`, 'Failed to refund order');

    async function handleDownloadInvoice(orderId: number) {
        try {
            await ShopService.downloadInvoice(orderId);
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
                <h1 className="text-xl font-display font-bold text-gray-100">Orders</h1>
            </div>

            {loading ? (
                <LoadingDots height="h-32" />
            ) : (
                <Section title={`All orders (${orders.length})`}>
                    {orders.length === 0 ? (
                        <p className="text-sm text-gray-500">No orders yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {orders.map(order => {
                                const reserved = order.status === 'Reserved';
                                const countdown = reserved ? reservationCountdown(order.createdAt) : null;
                                return (
                                    <li key={order.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-100">Order #{order.id}</p>
                                                    <TestPill visible={order.isTest} />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 break-words">
                                                    {order.userName} · {order.userEmail}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <span className={`px-2 py-0.5 border rounded text-xs font-medium ${statusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                <span className="text-xs font-medium text-gray-300">{formatNok(order.totalInOre)}</span>
                                            </div>
                                        </div>

                                        {countdown && (
                                            <p className={`text-xs ${countdown.expired ? 'text-red-400' : countdown.days <= 2 ? 'text-red-400' : countdown.days <= 4 ? 'text-amber-400' : 'text-gray-500'}`}>
                                                {countdown.expired
                                                    ? 'Reservation expired — capture before Vipps releases the hold.'
                                                    : `Reservation expires in ${countdown.days} day${countdown.days === 1 ? '' : 's'}.`}
                                            </p>
                                        )}

                                        <ul className="space-y-0.5">
                                            {order.items.map(oi => (
                                                <li key={oi.id} className="text-xs text-gray-400 flex justify-between">
                                                    <span>{oi.shopItemName} × {oi.quantity}</span>
                                                    <span>{formatNok(oi.priceAtPurchaseInOre * oi.quantity)}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {order.shippingAddress && (
                                            <div className="pt-2 border-t border-gray-700/30">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-500">Ship to</p>
                                                <p className="text-xs text-gray-300 whitespace-pre-wrap">{order.shippingAddress}</p>
                                            </div>
                                        )}

                                        {reserved && (
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => setCaptureTarget(order)}
                                                    className="px-3 py-1.5 bg-green-600/80 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                                                >
                                                    Charge &amp; ship
                                                </button>
                                                <button
                                                    onClick={() => setCancelTarget(order)}
                                                    className="px-3 py-1.5 bg-gray-700/60 hover:bg-red-900/40 border border-gray-600/40 hover:border-red-700/50 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all"
                                                >
                                                    Cancel order
                                                </button>
                                            </div>
                                        )}

                                        {order.status === 'Paid' && (
                                            <div className="flex pt-1">
                                                <button
                                                    onClick={() => setRefundTarget(order)}
                                                    className="px-3 py-1.5 bg-gray-700/60 hover:bg-amber-900/40 border border-gray-600/40 hover:border-amber-700/50 text-gray-400 hover:text-amber-400 text-xs rounded-lg transition-all"
                                                >
                                                    Refund order
                                                </button>
                                            </div>
                                        )}

                                        {order.hasInvoice && (
                                            <div className="flex pt-1">
                                                <button
                                                    onClick={() => handleDownloadInvoice(order.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50 text-gray-300 text-xs rounded-lg transition-colors"
                                                >
                                                    <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden />
                                                    Download invoice
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Section>
            )}

            {captureTarget && (
                <ConfirmModal
                    title="Charge & ship"
                    message={`Charge ${formatNok(captureTarget.totalInOre)} for order #${captureTarget.id} from ${captureTarget.userName} and mark it shipped now?`}
                    confirmLabel="Charge & ship"
                    onConfirm={handleCapture}
                    onCancel={() => setCaptureTarget(null)}
                />
            )}

            {cancelTarget && (
                <ConfirmModal
                    title="Cancel order"
                    message={`Cancel order #${cancelTarget.id} and release the reserved payment of ${formatNok(cancelTarget.totalInOre)}?`}
                    confirmLabel="Cancel order"
                    onConfirm={handleCancel}
                    onCancel={() => setCancelTarget(null)}
                />
            )}

            {refundTarget && (
                <ConfirmModal
                    title="Refund order"
                    message={`Refund ${formatNok(refundTarget.totalInOre)} to ${refundTarget.userName} for order #${refundTarget.id}? This cannot be undone.`}
                    confirmLabel="Refund"
                    onConfirm={handleRefund}
                    onCancel={() => setRefundTarget(null)}
                />
            )}
        </div>
    );
}
