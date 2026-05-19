import { describe, it, expect, vi, beforeEach } from 'vitest'
import ElectricityService from '@/services/electricityService'

vi.mock('@/services/axiosInstance', () => ({
    default: { get: vi.fn() },
}))

import axiosInstance from '@/services/axiosInstance'

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.clearAllMocks()
})

describe('ElectricityService.getElectricityData', () => {
    it('passes through API value as price without client-side VAT', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                areas: {
                    NO2: {
                        vatRate: 0.25,
                        values: [
                            {
                                start: '2026-05-18T17:45:00Z',
                                end: '2026-05-18T18:00:00Z',
                                value: 3.38,
                                spotValue: 2.704,
                            },
                        ],
                    },
                },
            },
        })

        const result = await ElectricityService.getElectricityData(
            'HOURLY', 'NO2', '2026-05-18T22:00:00Z'
        )

        // No client-side multiplication — the server already returned gross.
        expect(result).toEqual([
            {
                price: 3.38,
                spotPrice: 2.704,
                start: '2026-05-18T17:45:00Z',
                end: '2026-05-18T18:00:00Z',
                area: 'NO2',
                currency: 'NOK',
            },
        ])
    })

    it('preserves spot for NO4 where the server VAT rate is 0', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                areas: {
                    NO4: {
                        vatRate: 0,
                        values: [
                            {
                                start: '2026-05-18T17:00:00Z',
                                end: '2026-05-18T18:00:00Z',
                                value: 1.20,
                                spotValue: 1.20,
                            },
                        ],
                    },
                },
            },
        })

        const result = await ElectricityService.getElectricityData(
            'HOURLY', 'NO4', '2026-05-18T22:00:00Z'
        )

        expect(result[0].price).toBe(1.20)
        expect(result[0].spotPrice).toBe(1.20)
    })
})
