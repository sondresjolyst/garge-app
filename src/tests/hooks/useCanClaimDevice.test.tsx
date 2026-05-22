import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCanClaimDevice } from '@/hooks/useCanClaimDevice'

// Capacity is computed server-side now (GET /sensors/capacity); the hook just surfaces it.
vi.mock('@/services/sensorService', () => ({
    default: { getSensorCapacity: vi.fn() },
}))

import SensorService from '@/services/sensorService'

const mockedCapacity = SensorService.getSensorCapacity as ReturnType<typeof vi.fn>

beforeEach(() => {
    mockedCapacity.mockReset()
})

describe('useCanClaimDevice', () => {
    it('surfaces the backend capacity and claim eligibility', async () => {
        mockedCapacity.mockResolvedValue({ capacity: 3, used: 1, bypass: false, canClaim: true })

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(true)
        expect(result.current.capacity).toBe(3)
        expect(result.current.used).toBe(1)
        expect(result.current.bypass).toBe(false)
    })

    it('surfaces complimentary (bypass) access without a subscription', async () => {
        mockedCapacity.mockResolvedValue({ capacity: 0, used: 2, bypass: true, canClaim: true })

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.bypass).toBe(true)
        expect(result.current.canClaim).toBe(true)
    })

    it('treats a failed call as no capacity and blocks claim', async () => {
        mockedCapacity.mockRejectedValue(new Error('boom'))

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.capacity).toBe(0)
    })

    it('refresh re-fetches and updates state', async () => {
        mockedCapacity.mockResolvedValueOnce({ capacity: 0, used: 0, bypass: false, canClaim: false })

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.canClaim).toBe(false)

        mockedCapacity.mockResolvedValueOnce({ capacity: 1, used: 0, bypass: false, canClaim: true })
        await act(async () => {
            await result.current.refresh()
        })

        expect(result.current.canClaim).toBe(true)
        expect(result.current.capacity).toBe(1)
    })
})
