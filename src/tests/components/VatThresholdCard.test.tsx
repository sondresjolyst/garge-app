import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { VatThreshold } from '@/services/vatService'

const { getThreshold, setOtherTurnover, makeSupplements, toastError } = vi.hoisted(() => ({
    getThreshold: vi.fn(),
    setOtherTurnover: vi.fn(),
    makeSupplements: vi.fn(),
    toastError: vi.fn(),
}))

vi.mock('@sjolystinnovation/app-kit/toast', () => ({ toast: { success: vi.fn(), error: toastError } }))
vi.mock('@/services/vatService', () => ({
    default: {
        getThreshold: () => getThreshold(),
        setOtherTurnover: (v: number) => setOtherTurnover(v),
        makeSupplements: () => makeSupplements(),
        downloadSupplement: vi.fn(),
        downloadOwedCsv: vi.fn(),
    },
}))

import VatThresholdCard from '@/components/admin/VatThresholdCard'

const base: VatThreshold = {
    turnoverInOre: 4_100_000,
    otherTurnoverInOre: 0,
    thresholdInOre: 5_000_000,
    vatEnabled: false,
    crossingInvoiceId: null,
    crossedAt: null,
    owedVatInOre: 0,
    owed: [],
}

const crossed: VatThreshold = {
    ...base,
    turnoverInOre: 5_100_000,
    crossingInvoiceId: 42,
    crossedAt: '2026-09-01T10:00:00Z',
    owedVatInOre: 44_000,
    owed: [
        { invoiceId: 42, issuedAt: '2026-09-01T10:00:00Z', amountInOre: 200_000, vatInOre: 40_000, supplementNumber: null, supplementIssuedAt: null },
        { invoiceId: 43, issuedAt: '2026-09-02T10:00:00Z', amountInOre: 20_000, vatInOre: 4_000, supplementNumber: null, supplementIssuedAt: null },
    ],
}

describe('VatThresholdCard', () => {
    beforeEach(() => {
        getThreshold.mockReset()
        setOtherTurnover.mockReset()
        makeSupplements.mockReset()
        toastError.mockReset()
    })

    it('shows turnover as a share of the threshold', async () => {
        getThreshold.mockResolvedValue(base)
        render(<VatThresholdCard />)
        expect(await screen.findByText(/82 % of the VAT registration threshold/)).toBeInTheDocument()
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '82')
        expect(screen.queryByText(/Register for VAT/)).not.toBeInTheDocument()
    })

    it('after the threshold is passed, says to register and lists the VAT owed', async () => {
        getThreshold.mockResolvedValue(crossed)
        render(<VatThresholdCard />)
        expect(await screen.findByText(/Register for VAT, then turn VAT on/)).toBeInTheDocument()
        expect(screen.getByText(/#0042/, { selector: 'div' })).toBeInTheDocument()
        expect(screen.getByText(/VAT owed from before registration/)).toBeInTheDocument()
        expect(screen.getAllByText(/No supplement/)).toHaveLength(2)
    })

    it('only makes supplements once VAT is on', async () => {
        getThreshold.mockResolvedValue(crossed)
        const { unmount } = render(<VatThresholdCard />)
        expect(await screen.findByRole('button', { name: /Make VAT supplements \(2\)/ })).toBeDisabled()
        expect(screen.getByText(/Turn VAT on after registration to make the supplements/)).toBeInTheDocument()
        unmount()

        getThreshold.mockResolvedValue({ ...crossed, vatEnabled: true })
        makeSupplements.mockResolvedValue(2)
        render(<VatThresholdCard />)
        const button = await screen.findByRole('button', { name: /Make VAT supplements \(2\)/ })
        expect(button).toBeEnabled()
        expect(screen.queryByText(/Register for VAT/)).not.toBeInTheDocument()
        fireEvent.click(button)
        await waitFor(() => expect(makeSupplements).toHaveBeenCalledTimes(1))
    })

    it('offers each made supplement for download under its own number', async () => {
        getThreshold.mockResolvedValue({
            ...crossed, vatEnabled: true,
            owed: [{ ...crossed.owed[0], supplementNumber: 'MVA-0001', supplementIssuedAt: '2026-10-01T10:00:00Z' }],
        })
        render(<VatThresholdCard />)
        expect(await screen.findByRole('button', { name: 'Download VAT supplement MVA-0001 for invoice #0042' })).toHaveTextContent('MVA-0001')
        expect(screen.queryByRole('button', { name: /Make VAT supplements/ })).not.toBeInTheDocument()
    })

    it('saves other turnover in øre and refuses a bad amount', async () => {
        getThreshold.mockResolvedValue(base)
        setOtherTurnover.mockResolvedValue(undefined)
        render(<VatThresholdCard />)
        const input = await screen.findByLabelText(/Sales outside Garge/)

        fireEvent.change(input, { target: { value: '-5' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))
        await waitFor(() => expect(toastError).toHaveBeenCalled())
        expect(setOtherTurnover).not.toHaveBeenCalled()

        fireEvent.change(input, { target: { value: '12500.50' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))
        await waitFor(() => expect(setOtherTurnover).toHaveBeenCalledWith(1_250_050))
    })
})
