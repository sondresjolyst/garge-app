import { describe, it, expect, vi } from 'vitest'
import { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import type { Order } from '@/services/shopService'

const { getMyOrders } = vi.hoisted(() => ({ getMyOrders: vi.fn() }))

vi.mock('@sjolystinnovation/app-kit/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/services/shopService', () => ({ default: { getMyOrders: () => getMyOrders(), downloadInvoice: vi.fn() } }))
vi.mock('@/services/subscriptionService', () => ({ default: { getMySubscriptions: () => Promise.resolve([]) } }))
vi.mock('@/services/adminService', () => ({
    default: { getAppSettings: () => Promise.resolve({ cookieBannerEnabled: false, vatEnabled: false, vippsTestMode: false }) },
}))

import BillingPage from '@/app/(protected)/profile/billing/page'
import OrderDetailPage from '@/app/(protected)/profile/orders/[id]/page'

const order = (over: Partial<Order>): Order => ({
    id: 5, userId: 'u', vippsOrderId: 'garge-order-000005', status: 'Paid', totalInOre: 10000,
    capturedInOre: 10000, refundedInOre: 2500, shippingAddress: null, shippedAt: null, hasInvoice: true, isTest: false,
    items: [], createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-02T10:00:00Z', ...over,
})

describe('Customer orders, partly refunded', () => {
    it('shows the partial refund on the billing page', async () => {
        getMyOrders.mockResolvedValue([order({})])
        render(<BillingPage />)

        expect(await screen.findByText('Partly refunded: NOK 25,00 of NOK 100,00.')).toBeInTheDocument()
    })

    it('shows the partial refund on the order page, without the admin hint', async () => {
        getMyOrders.mockResolvedValue([order({})])
        // React reads a promise marked fulfilled without suspending, as it does for route params.
        const params = Object.assign(Promise.resolve({ id: '5' }), { status: 'fulfilled', value: { id: '5' } })
        render(<Suspense><OrderDetailPage params={params} /></Suspense>)

        expect(await screen.findByText('Partly refunded: NOK 25,00 of NOK 100,00.')).toBeInTheDocument()
        expect(screen.queryByText(/captures the rest/)).not.toBeInTheDocument()
    })
})
