import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import VatService from '@/services/vatService'
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock'
import { FieldValidationError } from '@/lib/errors'

const refusedWith = (status: number, data: unknown) =>
    new AxiosError('refused', String(status), undefined, undefined,
        { status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data })

beforeEach(resetAxiosSpies)

describe('VatService.setOutsideSales', () => {
    it('puts the month and the amount in øre and answers with the new threshold', async () => {
        const threshold = { turnoverInOre: 0, months: [] }
        axiosSpies.put.mockResolvedValueOnce({ data: threshold })

        expect(await VatService.setOutsideSales('2026-09', 1_250_050)).toEqual(threshold)
        expect(axiosSpies.put).toHaveBeenCalledWith('/admin/vat/outside-sales', { month: '2026-09', amountInOre: 1_250_050 })
    })

    it('gives an empty months list when an answer leaves it out', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: { turnoverInOre: 0 } })
        axiosSpies.put.mockResolvedValueOnce({ data: { turnoverInOre: 0, months: null } })

        expect((await VatService.getThreshold()).months).toEqual([])
        expect((await VatService.setOutsideSales('2026-09', 0)).months).toEqual([])
    })

    it('turns the field errors of a refused save into a FieldValidationError', async () => {
        axiosSpies.put.mockRejectedValueOnce(refusedWith(400, {
            errors: { Month: ['The month is more than 36 months back.'], AmountInOre: ['Too high.'] },
        }))

        const error = await VatService.setOutsideSales('2020-01', 1).catch((e: unknown) => e)

        expect(error).toBeInstanceOf(FieldValidationError)
        expect((error as FieldValidationError).fieldErrors).toEqual({
            month: ['The month is more than 36 months back.'],
            amountInOre: ['Too high.'],
        })
    })

    it('gives a plain error for a refusal without field errors', async () => {
        axiosSpies.put.mockRejectedValueOnce(refusedWith(500, {}))

        const error = await VatService.setOutsideSales('2026-09', 1).catch((e: unknown) => e)

        expect(error).not.toBeInstanceOf(FieldValidationError)
        expect(error).toBeInstanceOf(Error)
    })
})
