import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

const { useSession, getUserProfile } = vi.hoisted(() => ({
    useSession: vi.fn(),
    getUserProfile: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ useSession }))
vi.mock('@/services/userService', () => ({ default: { getUserProfile } }))

import { useFeature } from '@/hooks/useFeature'

function signInAs(id: string) {
    useSession.mockReturnValue({ data: { user: { id } }, status: 'authenticated' })
}

function profileWith(features: string[]) {
    return { email: 'rider@example.com', firstName: 'Kari', lastName: 'Nordmann', features }
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('useFeature', () => {
    it('is true when the profile lists the feature', async () => {
        signInAs('user-a')
        getUserProfile.mockResolvedValue(profileWith(['GargeSecurity']))

        const { result } = renderHook(() => useFeature('GargeSecurity'))

        await waitFor(() => expect(result.current).toBe(true))
    })

    it('is false when the profile does not list the feature', async () => {
        signInAs('user-b')
        getUserProfile.mockResolvedValue(profileWith([]))

        const { result } = renderHook(() => useFeature('GargeSecurity'))

        await waitFor(() => expect(getUserProfile).toHaveBeenCalled())
        expect(result.current).toBe(false)
    })

    it('fetches the profile once for every caller of the same user', async () => {
        signInAs('user-c')
        getUserProfile.mockResolvedValue(profileWith(['GargeSecurity']))

        const first = renderHook(() => useFeature('GargeSecurity'))
        const second = renderHook(() => useFeature('GargeSecurity'))

        await waitFor(() => expect(first.result.current).toBe(true))
        await waitFor(() => expect(second.result.current).toBe(true))
        expect(getUserProfile).toHaveBeenCalledTimes(1)
    })

    it('is false and does not fetch while signed out', () => {
        useSession.mockReturnValue({ data: null, status: 'unauthenticated' })

        const { result } = renderHook(() => useFeature('GargeSecurity'))

        expect(result.current).toBe(false)
        expect(getUserProfile).not.toHaveBeenCalled()
    })

    it('fetches again when a different user signs in', async () => {
        signInAs('user-d')
        getUserProfile.mockResolvedValueOnce(profileWith(['GargeSecurity']))
        const { result, rerender } = renderHook(() => useFeature('GargeSecurity'))
        await waitFor(() => expect(result.current).toBe(true))

        signInAs('user-e')
        getUserProfile.mockResolvedValueOnce(profileWith([]))
        rerender()

        expect(result.current).toBe(false)
        await waitFor(() => expect(getUserProfile).toHaveBeenCalledTimes(2))
        expect(result.current).toBe(false)
    })

    it('is false after a failed fetch and retries on the next mount', async () => {
        signInAs('user-f')
        getUserProfile.mockRejectedValueOnce(new Error('network down'))
        const first = renderHook(() => useFeature('GargeSecurity'))
        await act(async () => {})
        expect(getUserProfile).toHaveBeenCalledTimes(1)
        expect(first.result.current).toBe(false)

        getUserProfile.mockResolvedValueOnce(profileWith(['GargeSecurity']))
        const second = renderHook(() => useFeature('GargeSecurity'))

        await waitFor(() => expect(second.result.current).toBe(true))
        expect(getUserProfile).toHaveBeenCalledTimes(2)
    })
})
