import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCanClaimDevice } from '@/hooks/useCanClaimDevice'

vi.mock('@/services/sensorService', () => ({
    default: {
        getAllSensors: vi.fn(),
    },
}))

vi.mock('@/services/subscriptionService', () => ({
    default: {
        getMySubscriptions: vi.fn(),
    },
}))

import SensorService from '@/services/sensorService'
import SubscriptionService from '@/services/subscriptionService'

const mockedSensors = SensorService.getAllSensors as ReturnType<typeof vi.fn>
const mockedSubs = SubscriptionService.getMySubscriptions as ReturnType<typeof vi.fn>

beforeEach(() => {
    mockedSensors.mockReset()
    mockedSubs.mockReset()
})

describe('useCanClaimDevice', () => {
    it('blocks claim when the user has no subscription at all', async () => {
        mockedSensors.mockResolvedValue([])
        mockedSubs.mockResolvedValue([])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.capacity).toBe(0)
        expect(result.current.primaryActive).toBe(false)
    })

    it('allows claim when an active Primary covers the first sensor', async () => {
        mockedSensors.mockResolvedValue([])
        mockedSubs.mockResolvedValue([{ id: 1, status: 'Active', productType: 'Primary', quantity: 1 }])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(true)
        expect(result.current.capacity).toBe(1)
        expect(result.current.primaryActive).toBe(true)
    })

    it('blocks claim once owned sensors reach Primary capacity', async () => {
        mockedSensors.mockResolvedValue([{ id: 1 }])
        mockedSubs.mockResolvedValue([{ id: 1, status: 'Active', productType: 'Primary', quantity: 1 }])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.capacity).toBe(1)
    })

    it('extends capacity by each active AddOn quantity', async () => {
        mockedSensors.mockResolvedValue([{ id: 1 }, { id: 2 }])
        mockedSubs.mockResolvedValue([
            { id: 1, status: 'Active', productType: 'Primary', quantity: 1 },
            { id: 2, status: 'Active', productType: 'AddOn',   quantity: 2 },
        ])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.capacity).toBe(3)
        expect(result.current.canClaim).toBe(true)
    })

    it('blocks claim when AddOn is active but Primary is not', async () => {
        mockedSensors.mockResolvedValue([])
        mockedSubs.mockResolvedValue([{ id: 1, status: 'Active', productType: 'AddOn', quantity: 5 }])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.capacity).toBe(0)
        expect(result.current.primaryActive).toBe(false)
    })

    it('ignores non-active subscriptions', async () => {
        mockedSensors.mockResolvedValue([])
        mockedSubs.mockResolvedValue([
            { id: 1, status: 'Pending', productType: 'Primary', quantity: 1 },
            { id: 2, status: 'Stopped', productType: 'AddOn',   quantity: 5 },
            { id: 3, status: 'Expired', productType: 'Primary', quantity: 1 },
        ])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.capacity).toBe(0)
    })

    it('treats failed service calls as empty lists and blocks claim', async () => {
        mockedSensors.mockRejectedValue(new Error('boom'))
        mockedSubs.mockRejectedValue(new Error('boom'))

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.capacity).toBe(0)
    })

    it('refresh re-runs the queries and updates state', async () => {
        mockedSensors.mockResolvedValueOnce([])
        mockedSubs.mockResolvedValueOnce([])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.canClaim).toBe(false)

        mockedSensors.mockResolvedValueOnce([])
        mockedSubs.mockResolvedValueOnce([{ id: 1, status: 'Active', productType: 'Primary', quantity: 1 }])

        await act(async () => {
            await result.current.refresh()
        })

        expect(result.current.canClaim).toBe(true)
        expect(result.current.capacity).toBe(1)
    })
})
