import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Subscription } from '@/services/subscriptionService'
import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'

const { getMySubscriptions } = vi.hoisted(() => ({ getMySubscriptions: vi.fn() }))

vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/services/subscriptionService', () => ({ default: { getMySubscriptions: () => getMySubscriptions() } }))
vi.mock('@/services/shopService', () => ({ default: { getMyOrders: () => Promise.resolve([]) } }))
vi.mock('@/services/adminService', () => ({
    default: { getAppSettings: () => Promise.resolve({ cookieBannerEnabled: false, vatEnabled: false, vippsTestMode: false }) },
}))

import BillingPage from '@/app/(protected)/profile/billing/page'

const sub = (over: Partial<Subscription> = {}): Subscription => ({
    id: 1, userId: 'u', productId: 2, productName: 'Garge Extra Sensor', productType: 'AddOn',
    priceInOre: 4900, upcomingPriceInOre: null, upcomingPriceFrom: null, quantity: 3, interval: 'Monthly',
    vippsAgreementId: 'agr', status: 'Active', isTest: false, startDate: '2026-09-01T00:00:00Z',
    nextChargeDate: '2026-11-01T00:00:00Z', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', ...over,
})

beforeEach(resetTestMocks)

describe('Billing page price change notice', () => {
    beforeEach(() => getMySubscriptions.mockReset())

    it('shows the new total, the date and the right to cancel at no cost', async () => {
        getMySubscriptions.mockResolvedValue([sub({ upcomingPriceInOre: 5900, upcomingPriceFrom: '2026-12-01T00:00:00Z' })])
        render(<BillingPage />)

        const notice = await screen.findByText(/The price changes to/)
        expect(notice).toHaveTextContent('177,00')
        expect(notice).toHaveTextContent('/ month')
        expect(notice).toHaveTextContent('01.12.2026')
        expect(notice).toHaveTextContent('You can cancel at no cost, also after that date.')
        // The current total stays on the card until the new price takes effect.
        expect(screen.getByText(/147,00/)).toBeInTheDocument()
    })

    it.each([
        ['no increase is coming', sub()],
        ['the subscription is stopped', sub({ status: 'Stopped', upcomingPriceInOre: 5900, upcomingPriceFrom: '2026-12-01T00:00:00Z' })],
    ])('shows no notice when %s', async (_, s) => {
        getMySubscriptions.mockResolvedValue([s])
        render(<BillingPage />)

        await screen.findByText('Garge Extra Sensor')
        expect(screen.queryByText(/The price changes to/)).not.toBeInTheDocument()
    })
})
