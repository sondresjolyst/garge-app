import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { PriceChange, Product } from '@/services/productService'

const { getPriceChanges, schedulePriceChange, cancelPriceChange, toastError, toastSuccess } = vi.hoisted(() => ({
    getPriceChanges: vi.fn(),
    schedulePriceChange: vi.fn(),
    cancelPriceChange: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
}))

vi.mock('@sjolystinnovation/app-kit/toast', () => ({ toast: { success: toastSuccess, error: toastError } }))
vi.mock('@/services/productService', () => ({
    default: {
        getPriceChanges: (id: number) => getPriceChanges(id),
        schedulePriceChange: (id: number, price: number, date: string) => schedulePriceChange(id, price, date),
        cancelPriceChange: (id: number, changeId: number) => cancelPriceChange(id, changeId),
    },
}))

import PriceChangePanel from '@/components/admin/PriceChangePanel'

const product: Product = {
    id: 7, name: 'Garge Basic', description: null, priceInOre: 4900, interval: 'Monthly',
    type: 'Primary', isActive: true, createdAt: '2026-01-01T00:00:00Z',
}

const change = (over: Partial<PriceChange> = {}): PriceChange => ({
    id: 3, productId: 7, oldPriceInOre: 4900, newPriceInOre: 5900, effectiveFrom: '2026-11-10T00:00:00Z',
    createdAt: '2026-10-11T09:00:00Z', cancelledAt: null, appliedAt: null,
    noticeCount: 4, notifiedCount: 3, appliedCount: 0, ...over,
})

describe('PriceChangePanel', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-10-11T09:00:00Z'))
        for (const m of [getPriceChanges, schedulePriceChange, cancelPriceChange, toastError, toastSuccess]) m.mockReset()
    })
    afterEach(() => vi.useRealTimers())

    it('lists changes with how far their notices got', async () => {
        getPriceChanges.mockResolvedValue([change(), change({ id: 2, cancelledAt: '2026-10-01T00:00:00Z', newPriceInOre: 5500 })])
        render(<PriceChangePanel product={product} />)

        expect(await screen.findByText('3 of 4 notified, 0 paying')).toBeInTheDocument()
        expect(screen.getByText('Scheduled')).toBeInTheDocument()
        expect(screen.getByText('Cancelled')).toBeInTheDocument()
        expect(getPriceChanges).toHaveBeenCalledWith(7)
    })

    it('offers the form with the earliest date when nothing is pending', async () => {
        getPriceChanges.mockResolvedValue([change({ appliedAt: '2026-11-10T01:00:00Z', appliedCount: 4 })])
        render(<PriceChangePanel product={product} />)

        const date = await screen.findByLabelText('Takes effect')
        expect(date).toHaveValue('2026-11-10')
        expect(date).toHaveAttribute('min', '2026-11-10')
        expect(screen.getByText('In effect')).toBeInTheDocument()
        // A change in effect can no longer be cancelled.
        expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    })

    it('hides the form while a change is pending, so only one is scheduled at a time', async () => {
        getPriceChanges.mockResolvedValue([change()])
        render(<PriceChangePanel product={product} />)

        await screen.findByText('Scheduled')
        expect(screen.queryByLabelText(/^New price/)).not.toBeInTheDocument()
    })

    it('schedules an increase in øre with the picked date, then reloads', async () => {
        getPriceChanges.mockResolvedValueOnce([]).mockResolvedValueOnce([change()])
        schedulePriceChange.mockResolvedValue(change())
        render(<PriceChangePanel product={product} />)

        fireEvent.change(await screen.findByLabelText(/^New price/), { target: { value: '59,50' } })
        fireEvent.change(screen.getByLabelText('Takes effect'), { target: { value: '2026-12-01' } })
        fireEvent.click(screen.getByRole('button', { name: 'Schedule increase' }))

        await waitFor(() => expect(schedulePriceChange).toHaveBeenCalledWith(7, 5950, '2026-12-01'))
        expect(await screen.findByText('Scheduled')).toBeInTheDocument()
        expect(toastSuccess).toHaveBeenCalled()
    })

    it.each([
        ['49', '2026-11-10', 'must be higher'],
        ['59', '2026-11-09', '2026-11-10 or later'],
    ])('refuses %s kr from %s without calling the API', async (price, date, message) => {
        getPriceChanges.mockResolvedValue([])
        render(<PriceChangePanel product={product} />)

        fireEvent.change(await screen.findByLabelText(/^New price/), { target: { value: price } })
        fireEvent.change(screen.getByLabelText('Takes effect'), { target: { value: date } })
        fireEvent.click(screen.getByRole('button', { name: 'Schedule increase' }))

        await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining(message)))
        expect(schedulePriceChange).not.toHaveBeenCalled()
    })

    it('shows the API refusal', async () => {
        getPriceChanges.mockResolvedValue([])
        schedulePriceChange.mockRejectedValue(new Error("At this price a subscriber's total would be above the 20 000 kr a Vipps agreement allows."))
        render(<PriceChangePanel product={product} />)

        fireEvent.change(await screen.findByLabelText(/^New price/), { target: { value: '500' } })
        fireEvent.click(screen.getByRole('button', { name: 'Schedule increase' }))

        await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('20 000 kr')))
    })

    it('cancels a scheduled change after confirmation', async () => {
        getPriceChanges.mockResolvedValueOnce([change()]).mockResolvedValueOnce([change({ cancelledAt: '2026-10-11T09:05:00Z' })])
        cancelPriceChange.mockResolvedValue(undefined)
        render(<PriceChangePanel product={product} />)

        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel change' }))

        await waitFor(() => expect(cancelPriceChange).toHaveBeenCalledWith(7, 3))
        expect(await screen.findByText('Cancelled')).toBeInTheDocument()
    })
})
