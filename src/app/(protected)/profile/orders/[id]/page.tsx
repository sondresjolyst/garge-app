'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon, CheckCircleIcon, ClockIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Section from '@/components/Section';
import LoadingDots from '@/components/LoadingDots';
import TestPill from '@/components/TestPill';
import { toast } from 'sonner';
import ShopService, { Order } from '@/services/shopService';
import { formatNok } from '@/lib/formatUtils';
import { formatDate } from '@/lib/dateUtils';
import { statusColor } from '@/lib/statusUtils';
import { formatApiError } from '@/lib/errorMessages';

interface TimelineEntry {
    label: string;
    timestamp: string | null;
    icon: typeof CheckCircleIcon;
    active: boolean;
}

function buildTimeline(order: Order): TimelineEntry[] {
    const reachedReserved = ['Reserved', 'Paid', 'Refunded'].includes(order.status);
    const reachedPaid = ['Paid', 'Refunded'].includes(order.status);
    const reachedShipped = order.shippedAt != null;
    const failed = ['Failed', 'Cancelled'].includes(order.status);

    return [
        { label: 'Order placed',     timestamp: order.createdAt, icon: ClockIcon,        active: true },
        { label: 'Payment reserved', timestamp: reachedReserved ? order.updatedAt : null, icon: CheckCircleIcon, active: reachedReserved && !failed },
        { label: 'Payment captured', timestamp: reachedPaid ? order.updatedAt : null,    icon: CheckCircleIcon, active: reachedPaid && !failed },
        { label: 'Shipped',          timestamp: order.shippedAt,                          icon: TruckIcon,       active: reachedShipped && !failed },
        ...(failed ? [{ label: order.status, timestamp: order.updatedAt, icon: XCircleIcon, active: true }] : []),
    ];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const orderId = parseInt(id, 10);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (isNaN(orderId)) { setLoading(false); return; }
        ShopService.getMyOrders()
            .then(orders => setOrder(orders.find(o => o.id === orderId) ?? null))
            .catch(err => toast.error(formatApiError(err, 'Failed to load order')))
            .finally(() => setLoading(false));
    }, [orderId]);

    async function downloadInvoice() {
        if (!order) return;
        setDownloading(true);
        try {
            await ShopService.downloadInvoice(order.id);
        } catch (err) {
            toast.error(formatApiError(err, 'Failed to download invoice'));
        } finally {
            setDownloading(false);
        }
    }

    if (loading) return <LoadingDots height="h-64" />;

    if (!order) {
        return (
            <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4 pb-32">
                <p className="text-sm text-gray-400">Order not found.</p>
                <Link href="/profile/billing" className="text-sky-400 text-sm hover:text-sky-300">Back to billing</Link>
            </div>
        );
    }

    const timeline = buildTimeline(order);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32">
            <div className="flex items-center gap-3">
                <Link href="/profile/billing" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all" aria-label="Back to billing">
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                </Link>
                <h1 className="text-xl font-display font-bold text-gray-100">Order #{order.id}</h1>
                <TestPill visible={order.isTest} />
                <span className={`ml-auto px-2 py-0.5 border rounded text-xs font-medium ${statusColor(order.status)}`}>
                    {order.status}
                </span>
            </div>

            <Section title="Items">
                <ul className="space-y-1">
                    {order.items.map(oi => (
                        <li key={oi.id} className="flex justify-between text-sm text-gray-300">
                            <span>{oi.shopItemName} × {oi.quantity}</span>
                            <span className="tabular-nums">{formatNok(oi.priceAtPurchaseInOre * oi.quantity)}</span>
                        </li>
                    ))}
                </ul>
                <div className="border-t border-gray-700/40 mt-3 pt-3 flex justify-between text-sm font-semibold text-gray-100">
                    <span>Total</span>
                    <span className="tabular-nums">{formatNok(order.totalInOre)}</span>
                </div>
            </Section>

            <Section title="Timeline">
                <ol className="space-y-3">
                    {timeline.map((entry, i) => {
                        const Icon = entry.icon;
                        return (
                            <li key={i} className="flex items-start gap-3">
                                <Icon className={`h-5 w-5 shrink-0 ${entry.active ? 'text-green-400' : 'text-gray-700'}`} aria-hidden />
                                <div>
                                    <p className={`text-sm font-medium ${entry.active ? 'text-gray-100' : 'text-gray-500'}`}>{entry.label}</p>
                                    {entry.timestamp && (
                                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(entry.timestamp)}</p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </Section>

            {order.shippingAddress && (
                <Section title="Shipping">
                    <p className="text-sm text-gray-300">{order.shippingAddress}</p>
                </Section>
            )}

            {order.vippsOrderId && (
                <Section title="Payment reference">
                    <p className="text-xs text-gray-500 break-all">{order.vippsOrderId}</p>
                </Section>
            )}

            {order.status === 'Paid' && (
                <button
                    onClick={downloadInvoice}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
                    {downloading ? 'Downloading…' : 'Download invoice'}
                </button>
            )}
        </div>
    );
}
