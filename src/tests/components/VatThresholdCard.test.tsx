import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { VatThreshold } from '@/services/vatService'

const { getThreshold, setOtherTurnover, makeCorrections, toastError } = vi.hoisted(() => ({
    getThreshold: vi.fn(),
    setOtherTurnover: vi.fn(),
    makeCorrections: vi.fn(),
    toastError: vi.fn(),
}))

vi.mock('@sjolystinnovation/app-kit/toast', () => ({ toast: { success: vi.fn(), error: toastError } }))
vi.mock('@/services/vatService', () => ({
    default: {
        getThreshold: () => getThreshold(),
        setOtherTurnover: (v: number) => setOtherTurnover(v),
        makeCorrections: () => makeCorrections(),
        downloadDocument: vi.fn(),
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
        { invoiceId: 42, issuedAt: '2026-09-01T10:00:00Z', amountInOre: 200_000, vatInOre: 40_000, correctedAt: null, creditNoteId: null, replacementInvoiceId: null },
        { invoiceId: 43, issuedAt: '2026-09-02T10:00:00Z', amountInOre: 20_000, vatInOre: 4_000, correctedAt: null, creditNoteId: null, replacementInvoiceId: null },
    ],
}

describe('VatThresholdCard', () => {
    beforeEach(() => {
        getThreshold.mockReset()
        setOtherTurnover.mockReset()
        makeCorrections.mockReset()
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
        expect(screen.getAllByText(/Not corrected/)).toHaveLength(2)
    })

    it('only makes credit notes and new invoices once VAT is on', async () => {
        getThreshold.mockResolvedValue(crossed)
        const { unmount } = render(<VatThresholdCard />)
        expect(await screen.findByRole('button', { name: /Make credit notes and new invoices \(2\)/ })).toBeDisabled()
        expect(screen.getByText(/Turn VAT on after registration to make the credit notes and new invoices/)).toBeInTheDocument()
        unmount()

        getThreshold.mockResolvedValue({ ...crossed, vatEnabled: true })
        makeCorrections.mockResolvedValue(2)
        render(<VatThresholdCard />)
        const button = await screen.findByRole('button', { name: /Make credit notes and new invoices \(2\)/ })
        expect(button).toBeEnabled()
        expect(screen.queryByText(/Register for VAT/)).not.toBeInTheDocument()
        fireEvent.click(button)
        await waitFor(() => expect(makeCorrections).toHaveBeenCalledTimes(1))
    })

    it('offers the credit note and the new invoice of each corrected sale', async () => {
        getThreshold.mockResolvedValue({
            ...crossed, vatEnabled: true,
            owed: [{ ...crossed.owed[0], correctedAt: '2026-10-01T10:00:00Z', creditNoteId: 50, replacementInvoiceId: 51 }],
        })
        render(<VatThresholdCard />)
        expect(await screen.findByRole('button', { name: 'Download credit note #0050 for invoice #0042' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Download invoice #0051 with VAT for invoice #0042' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Make credit notes/ })).not.toBeInTheDocument()
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
