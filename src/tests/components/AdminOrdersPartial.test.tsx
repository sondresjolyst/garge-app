import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AdminOrder } from '@/services/shopService'
import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'

const { getAllOrders } = vi.hoisted(() => ({ getAllOrders: vi.fn() }))

vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/services/shopService', () => ({ default: { getAllOrders: () => getAllOrders() } }))

import AdminOrdersPage from '@/app/(protected)/admin/orders/page'

const order = (over: Partial<AdminOrder>): AdminOrder => ({
    id: 1, userId: 'u', vippsOrderId: 'garge-order-000001', status: 'Reserved', totalInOre: 10000,
    capturedInOre: 0, refundedInOre: 0, shippingAddress: null, shippedAt: null, hasInvoice: false, isTest: false,
    items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    userEmail: 'ada@example.com', userName: 'Ada', ...over,
})

beforeEach(resetTestMocks)

describe('Admin orders, partly captured and refunded', () => {
    it('shows a partly captured order and that Charge & ship captures the rest', async () => {
        getAllOrders.mockResolvedValue([order({ capturedInOre: 4000 })])
        render(<AdminOrdersPage />)

        expect(await screen.findByText('Partly captured: NOK 40,00 of NOK 100,00. Charge & ship captures the rest.')).toBeInTheDocument()
    })

    it('shows a partly refunded order without the Vipps hint', async () => {
        getAllOrders.mockResolvedValue([order({ id: 2, status: 'Paid', capturedInOre: 10000, refundedInOre: 2500 })])
        render(<AdminOrdersPage />)

        expect(await screen.findByText('Partly refunded: NOK 25,00 of NOK 100,00.')).toBeInTheDocument()
    })

    it('shows nothing extra for an order in full', async () => {
        getAllOrders.mockResolvedValue([order({ id: 3, status: 'Paid', capturedInOre: 10000 })])
        render(<AdminOrdersPage />)

        await screen.findByText('Order #3')
        expect(screen.queryByText(/Partly/)).not.toBeInTheDocument()
    })
})
