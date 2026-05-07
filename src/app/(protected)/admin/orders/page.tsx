'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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

    async function handleCapture() {
        if (!captureTarget) return;
        try {
            await ShopService.captureOrder(captureTarget.id);
            toast.success(`Order #${captureTarget.id} captured`);
            setOrders(prev => prev.map(o => o.id === captureTarget.id ? { ...o, status: 'Paid' as const } : o));
            setCaptureTarget(null);
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to capture order'));
        }
    }

    async function handleCancel() {
        if (!cancelTarget) return;
        try {
            await ShopService.cancelOrder(cancelTarget.id);
            toast.success(`Order #${cancelTarget.id} cancelled`);
            setOrders(prev => prev.map(o => o.id === cancelTarget.id ? { ...o, status: 'Cancelled' as const } : o));
            setCancelTarget(null);
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to cancel order'));
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 pb-32">
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
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-100">Order #{order.id}</p>
                                                    <TestPill visible={order.isTest} />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {order.userName} · {order.userEmail}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
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
                                                    Capture payment
                                                </button>
                                                <button
                                                    onClick={() => setCancelTarget(order)}
                                                    className="px-3 py-1.5 bg-gray-700/60 hover:bg-red-900/40 border border-gray-600/40 hover:border-red-700/50 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all"
                                                >
                                                    Cancel order
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
                    title="Capture payment"
                    message={`Capture ${formatNok(captureTarget.totalInOre)} for order #${captureTarget.id} from ${captureTarget.userName}? Only do this when the order has been shipped.`}
                    confirmLabel="Capture"
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
        </div>
    );
}
