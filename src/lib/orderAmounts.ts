import { formatNok } from '@sjolystinnovation/app-kit/payments';
import type { Order } from '@/services/shopService';

/**
 * A line for an order Vipps has captured or refunded only part of, or null when the status says it
 * all. A partly captured order stays Reserved, and a partly refunded one stays Paid, as only a full
 * refund makes it Refunded.
 */
export function partialAmountNote(order: Pick<Order, 'status' | 'totalInOre' | 'capturedInOre' | 'refundedInOre'>): string | null {
    if (order.status === 'Reserved' && order.capturedInOre > 0 && order.capturedInOre < order.totalInOre)
        return `Partly captured: ${formatNok(order.capturedInOre)} of ${formatNok(order.totalInOre)}.`;
    if (order.refundedInOre > 0 && order.refundedInOre < order.totalInOre)
        return `Partly refunded: ${formatNok(order.refundedInOre)} of ${formatNok(order.totalInOre)}.`;
    return null;
}
