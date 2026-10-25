import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { VatThreshold } from '@/services/vatService'
import { toastSpies, resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { FieldValidationError } from '@/lib/errors'

const { getThreshold, setOutsideSales, makeCorrections } = vi.hoisted(() => ({
    getThreshold: vi.fn(),
    setOutsideSales: vi.fn(),
    makeCorrections: vi.fn(),
}))

vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/services/vatService', () => ({
    default: {
        getThreshold: () => getThreshold(),
        setOutsideSales: (month: string, amountInOre: number) => setOutsideSales(month, amountInOre),
        makeCorrections: () => makeCorrections(),
        downloadDocument: vi.fn(),
        downloadOwedCsv: vi.fn(),
    },
}))

import VatThresholdCard from '@/components/admin/VatThresholdCard'

// Pinned in October 2026, so the current month in the form and the month range are fixed.
const NOW = new Date('2026-10-15T12:00:00Z')

const months = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(Date.UTC(2025, 9 + i, 1))
    return { month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, salesInOre: 300_000, outsideInOre: 0 }
})

const base: VatThreshold = {
    turnoverInOre: 4_100_000,
    thresholdInOre: 5_000_000,
    vatEnabled: false,
    crossingInvoiceId: null,
    crossedAt: null,
    owedVatInOre: 0,
    owed: [],
    months: months.map(m => m.month === '2026-09' ? { ...m, outsideInOre: 250_000 } : m),
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

beforeEach(() => {
    resetTestMocks()
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
})
afterEach(() => { vi.useRealTimers() })

describe('VatThresholdCard', () => {
    beforeEach(() => {
        getThreshold.mockReset()
        setOutsideSales.mockReset()
        makeCorrections.mockReset()
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

    it('counts the threshold as passed by crossedAt, not by a crossing invoice', async () => {
        getThreshold.mockResolvedValue({ ...base, turnoverInOre: 5_100_000, crossingInvoiceId: null, crossedAt: '2026-09-30T10:00:00Z' })
        render(<VatThresholdCard />)
        expect(await screen.findByText(/Register for VAT, then turn VAT on/)).toBeInTheDocument()
        expect(screen.getByRole('progressbar').firstElementChild).toHaveClass('bg-red-500')
    })

    it('shows a crossing by sales outside Garge alone without an invoice number', async () => {
        getThreshold.mockResolvedValue({ ...base, turnoverInOre: 5_100_000, crossingInvoiceId: null, crossedAt: '2026-09-30T10:00:00Z' })
        render(<VatThresholdCard />)
        const notice = await screen.findByText(/Turnover passed 50 000 kr with sales outside Garge on 30 Sept? 2026/)
        expect(notice.textContent).not.toMatch(/#\d{4}/)
    })

    it('lists sales in and outside Garge per month, oldest first', async () => {
        getThreshold.mockResolvedValue(base)
        render(<VatThresholdCard />)
        const table = await screen.findByRole('table')
        const rows = within(table).getAllByRole('row').slice(1)
        expect(rows).toHaveLength(13)
        expect(within(rows[0]).getByRole('rowheader')).toHaveTextContent('Oct 2025')
        expect(within(rows[12]).getByRole('rowheader')).toHaveTextContent('Oct 2026')
        expect(rows[11]).toHaveTextContent('NOK 3000,00')
        expect(rows[11]).toHaveTextContent('NOK 2500,00')
    })

    it('edits a month from the table and puts the month and the amount in øre', async () => {
        getThreshold.mockResolvedValue(base)
        const saved = { ...base, months: base.months.map(m => m.month === '2026-09' ? { ...m, outsideInOre: 1_250_050 } : m) }
        setOutsideSales.mockResolvedValue(saved)
        render(<VatThresholdCard />)

        fireEvent.click(await screen.findByRole('button', { name: /^Edit sales outside Garge for Sept? 2026$/ }))
        expect(screen.getByLabelText('Month')).toHaveValue('2026-09')
        const amount = screen.getByLabelText('Sales outside Garge')
        expect(amount).toHaveValue('2500.00')
        expect(amount).toHaveFocus()

        fireEvent.change(amount, { target: { value: '12500.50' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))
        await waitFor(() => expect(setOutsideSales).toHaveBeenCalledWith('2026-09', 1_250_050))
        expect(await screen.findByText('NOK 12500,50')).toBeInTheDocument()
        expect(toastSpies.success).toHaveBeenCalledWith(expect.stringMatching(/^Sales outside Garge saved for Sept? 2026$/))
    })

    it('starts on the current month and takes a month that is not in the table', async () => {
        getThreshold.mockResolvedValue(base)
        setOutsideSales.mockResolvedValue(base)
        render(<VatThresholdCard />)
        const month = await screen.findByLabelText('Month')
        expect(month).toHaveValue('2026-10')
        expect(month).toHaveAttribute('max', '2026-10')
        expect(month).toHaveAttribute('min', '2023-10')

        fireEvent.change(month, { target: { value: '2024-03' } })
        expect(screen.getByLabelText('Sales outside Garge')).toHaveValue('')
        fireEvent.change(screen.getByLabelText('Sales outside Garge'), { target: { value: '0' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))
        await waitFor(() => expect(setOutsideSales).toHaveBeenCalledWith('2024-03', 0))
        expect(toastSpies.success).toHaveBeenCalledWith('Sales outside Garge removed for Mar 2024')
    })

    it('refuses a bad amount and a month that has not started before calling the API', async () => {
        getThreshold.mockResolvedValue(base)
        render(<VatThresholdCard />)
        fireEvent.change(await screen.findByLabelText('Month'), { target: { value: '2026-11' } })
        fireEvent.change(screen.getByLabelText('Sales outside Garge'), { target: { value: '-5' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))

        expect(await screen.findByText('Choose a month that has started.')).toBeInTheDocument()
        expect(screen.getByText(/Enter an amount in kroner/)).toBeInTheDocument()
        expect(screen.getByLabelText('Month')).toHaveAttribute('aria-invalid', 'true')
        expect(setOutsideSales).not.toHaveBeenCalled()
    })

    it('shows the field errors of a refused save under their fields', async () => {
        getThreshold.mockResolvedValue(base)
        setOutsideSales.mockRejectedValue(new FieldValidationError({
            month: ['The month must have started and be at most 36 months back.'],
            amountInOre: ['The amount must be between 0 and 1000000000 øre.'],
        }))
        render(<VatThresholdCard />)
        fireEvent.change(await screen.findByLabelText('Sales outside Garge'), { target: { value: '100' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))

        expect(await screen.findByText('The month must have started and be at most 36 months back.')).toBeInTheDocument()
        expect(screen.getByText('The amount must be between 0 and 1000000000 øre.')).toBeInTheDocument()
        expect(screen.getByLabelText('Sales outside Garge')).toHaveAttribute('aria-describedby', 'vat-outside-amount-error')
        expect(toastSpies.error).not.toHaveBeenCalled()
    })

    it('shows the API month error for a month more than 36 months back', async () => {
        getThreshold.mockResolvedValue(base)
        setOutsideSales.mockRejectedValue(new FieldValidationError({ month: ['The month is more than 36 months back.'] }))
        render(<VatThresholdCard />)
        fireEvent.change(await screen.findByLabelText('Sales outside Garge'), { target: { value: '100' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))
        expect(await screen.findByText('The month is more than 36 months back.')).toBeInTheDocument()
        expect(screen.getByLabelText('Month')).toHaveAttribute('aria-describedby', 'vat-outside-month-error')
    })

    it('renders from the answer of each save, so an outside-only crossing can clear again', async () => {
        const crossedOutside = {
            ...base, turnoverInOre: 5_100_000, crossingInvoiceId: null, crossedAt: '2026-09-30T10:00:00Z',
            months: base.months.map(m => m.month === '2026-09' ? { ...m, outsideInOre: 1_250_000 } : m),
        }
        getThreshold.mockResolvedValue(crossedOutside)
        setOutsideSales.mockResolvedValue({ ...base, months: base.months.map(m => m.month === '2026-09' ? { ...m, outsideInOre: 0 } : m) })
        render(<VatThresholdCard />)
        expect(await screen.findByText(/with sales outside Garge on/)).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /^Edit sales outside Garge for Sept? 2026$/ }))
        fireEvent.change(screen.getByLabelText('Sales outside Garge'), { target: { value: '0' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))

        await waitFor(() => expect(screen.queryByText(/Register for VAT/)).not.toBeInTheDocument())
        expect(screen.getByText(/82 % of the VAT registration threshold/)).toBeInTheDocument()
        expect(getThreshold).toHaveBeenCalledTimes(1)
    })

    it('shows other refused saves in a toast', async () => {
        getThreshold.mockResolvedValue(base)
        setOutsideSales.mockRejectedValue(new Error('Not authorized.'))
        render(<VatThresholdCard />)
        fireEvent.change(await screen.findByLabelText('Sales outside Garge'), { target: { value: '100' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save sales outside Garge' }))
        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Not authorized.'))
    })
})
