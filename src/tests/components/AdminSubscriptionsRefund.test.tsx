import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { toastSpies, resetTestMocks } from '@sjolystinnovation/app-kit/testing'

const { getAllSubscriptions, getSubscriptionInvoices, refundCharge } = vi.hoisted(() => ({
    getAllSubscriptions: vi.fn(),
    getSubscriptionInvoices: vi.fn(),
    refundCharge: vi.fn(),
}))

vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/services/subscriptionService', () => ({
    default: {
        getAllSubscriptions: () => getAllSubscriptions(),
        getSubscriptionInvoices: (id: number) => getSubscriptionInvoices(id),
        refundCharge: (id: number, amount?: number) => refundCharge(id, amount),
        downloadSubscriptionInvoice: vi.fn(),
    },
}))

import AdminSubscriptionsPage from '@/app/(protected)/admin/subscriptions/page'

const sub = {
    id: 3, userId: 'u1', userEmail: 'ada@example.com', userName: 'Ada', productName: 'Garge Basic', productType: 'Primary',
    priceInOre: 29900, quantity: 1, interval: 'Monthly', status: 'Active', isTest: false, startDate: null, nextChargeDate: null,
    invoiceCount: 3, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
}
const invoices = [
    { id: 41, issuedAt: '2026-10-01T00:00:00Z', amountInOre: 29900, refundedInOre: 9900, vippsChargeId: 'chr-41' },
    { id: 40, issuedAt: '2026-09-01T00:00:00Z', amountInOre: 29900, refundedInOre: 29900, vippsChargeId: 'chr-40' },
    { id: 39, issuedAt: '2026-08-01T00:00:00Z', amountInOre: 29900, refundedInOre: 0, vippsChargeId: null },
]

const row = (id: number) => screen.getByText(new RegExp(`#00${id} ·`)).closest('li')!

async function openInvoices() {
    render(<AdminSubscriptionsPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Invoices \(3\)/ }))
    await screen.findByText(/#0041/)
}

beforeEach(resetTestMocks)
beforeEach(() => {
    vi.clearAllMocks()
    getAllSubscriptions.mockResolvedValue([sub])
    getSubscriptionInvoices.mockResolvedValue(invoices.map(i => ({ ...i })))
})

describe('AdminSubscriptionsPage refunds', () => {
    it('shows what was refunded and offers a refund only where something is left and Vipps has the charge', async () => {
        await openInvoices()

        expect(within(row(41)).getByText(/NOK 99,00 refunded/)).toBeInTheDocument()
        expect(within(row(41)).getByRole('button', { name: 'Refund' })).toBeInTheDocument()
        expect(within(row(40)).getByText(/· refunded/)).toBeInTheDocument()
        expect(within(row(40)).queryByRole('button', { name: 'Refund' })).not.toBeInTheDocument()
        expect(within(row(39)).queryByRole('button', { name: 'Refund' })).not.toBeInTheDocument()
    })

    it('refunds what is left by default and shows the new total', async () => {
        refundCharge.mockResolvedValue({ id: 41, amountInOre: 29900, refundedInOre: 29900, creditNoteId: 77 })
        await openInvoices()
        fireEvent.click(within(row(41)).getByRole('button', { name: 'Refund' }))

        const dialog = await screen.findByRole('alertdialog')
        expect(within(dialog).getByLabelText('Amount in NOK')).toHaveValue('200.00')
        fireEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

        await waitFor(() => expect(refundCharge).toHaveBeenCalledWith(41, 20000))
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
        expect(within(row(41)).getByText(/· refunded/)).toBeInTheDocument()
        expect(toastSpies.success).toHaveBeenCalledWith(expect.stringContaining('credit note'))
    })

    it('refunds a part, written with a comma', async () => {
        refundCharge.mockResolvedValue({ id: 41, amountInOre: 29900, refundedInOre: 14950, creditNoteId: 78 })
        await openInvoices()
        fireEvent.click(within(row(41)).getByRole('button', { name: 'Refund' }))
        const dialog = await screen.findByRole('alertdialog')

        fireEvent.change(within(dialog).getByLabelText('Amount in NOK'), { target: { value: '50,50' } })
        fireEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

        await waitFor(() => expect(refundCharge).toHaveBeenCalledWith(41, 5050))
        await waitFor(() => expect(within(row(41)).getByText(/NOK 149,50 refunded/)).toBeInTheDocument())
    })

    it.each(['0', '200.01', 'abc'])('refuses %s without calling the API', async (value) => {
        await openInvoices()
        fireEvent.click(within(row(41)).getByRole('button', { name: 'Refund' }))
        const dialog = await screen.findByRole('alertdialog')

        fireEvent.change(within(dialog).getByLabelText('Amount in NOK'), { target: { value } })
        fireEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalled())
        expect(refundCharge).not.toHaveBeenCalled()
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('keeps the dialog open and shows why when the refund fails', async () => {
        refundCharge.mockRejectedValue(new Error('Vipps did not accept the refund.'))
        await openInvoices()
        fireEvent.click(within(row(41)).getByRole('button', { name: 'Refund' }))
        const dialog = await screen.findByRole('alertdialog')

        fireEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Vipps did not accept the refund.'))
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(within(row(41)).getByText(/NOK 99,00 refunded/)).toBeInTheDocument()
    })
})
