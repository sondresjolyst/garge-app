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
    it('allows claim when the user owns zero sensors', async () => {
        mockedSensors.mockResolvedValue([])
        mockedSubs.mockResolvedValue([])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(true)
        expect(result.current.ownedSensorCount).toBe(0)
        expect(result.current.activeSubscriptionCount).toBe(0)
    })

    it('blocks claim when owned sensors exceed active subscriptions', async () => {
        mockedSensors.mockResolvedValue([{ id: 1 }, { id: 2 }])
        mockedSubs.mockResolvedValue([{ id: 10, status: 'Active' }])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.ownedSensorCount).toBe(2)
        expect(result.current.activeSubscriptionCount).toBe(1)
    })

    it('allows claim when active subscriptions match owned sensors', async () => {
        mockedSensors.mockResolvedValue([{ id: 1 }, { id: 2 }])
        mockedSubs.mockResolvedValue([
            { id: 10, status: 'Active' },
            { id: 11, status: 'Active' },
        ])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(true)
    })

    it('ignores non-active subscriptions', async () => {
        mockedSensors.mockResolvedValue([{ id: 1 }])
        mockedSubs.mockResolvedValue([
            { id: 10, status: 'Pending' },
            { id: 11, status: 'Stopped' },
            { id: 12, status: 'Expired' },
        ])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(false)
        expect(result.current.activeSubscriptionCount).toBe(0)
    })

    it('treats failed service calls as empty lists so a user with no sensors is still allowed through', async () => {
        mockedSensors.mockRejectedValue(new Error('boom'))
        mockedSubs.mockRejectedValue(new Error('boom'))

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.canClaim).toBe(true)
        expect(result.current.ownedSensorCount).toBe(0)
        expect(result.current.activeSubscriptionCount).toBe(0)
    })

    it('refresh re-runs the queries and updates state', async () => {
        mockedSensors.mockResolvedValueOnce([{ id: 1 }])
        mockedSubs.mockResolvedValueOnce([])

        const { result } = renderHook(() => useCanClaimDevice())
        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.canClaim).toBe(false)

        mockedSensors.mockResolvedValueOnce([{ id: 1 }])
        mockedSubs.mockResolvedValueOnce([{ id: 10, status: 'Active' }])

        await act(async () => {
            await result.current.refresh()
        })

        expect(result.current.canClaim).toBe(true)
        expect(result.current.activeSubscriptionCount).toBe(1)
    })
})
