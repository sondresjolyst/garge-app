import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { useFeature, getUserProfile, updatePreferences, toastSuccess, toastError } = vi.hoisted(() => ({
    useFeature: vi.fn(),
    getUserProfile: vi.fn(),
    updatePreferences: vi.fn(() => Promise.resolve({})),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: { user: { id: 'user-1' } }, status: 'authenticated' }),
    signOut: vi.fn(),
}))
vi.mock('@/services/userService', () => ({
    default: {
        getUserProfile,
        updatePreferences,
        getDataRetention: vi.fn(() => Promise.resolve({ optOut: false, optedOutAt: null })),
    },
}))
vi.mock('@/services/sensorService', () => ({
    default: { getAllSensors: vi.fn(() => Promise.resolve([])) },
}))
vi.mock('@/services/switchService', () => ({
    default: { getAllSwitches: vi.fn(() => Promise.resolve([])) },
}))
vi.mock('@/services/pushNotificationService', () => ({
    isPushSupported: () => false,
    isPushSubscribed: vi.fn(() => Promise.resolve(false)),
    subscribeToPush: vi.fn(),
    unsubscribeFromPush: vi.fn(),
    sendTestNotification: vi.fn(),
}))
vi.mock('@/hooks/useCanClaimDevice', () => ({
    useCanClaimDevice: () => ({ canClaim: true, loading: false, refresh: vi.fn(), capacity: 2, used: 1, bypass: false }),
}))
vi.mock('@/hooks/useFeature', () => ({ useFeature }))
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }))

import Profile from '@/app/(protected)/profile/page'

beforeEach(() => {
    vi.clearAllMocks()
    getUserProfile.mockResolvedValue({
        id: 'user-1',
        email: 'kari@example.com',
        firstName: 'Kari',
        lastName: 'Nordmann',
        emailConfirmed: true,
        priceZone: 'NO3',
        pushNotificationsEnabled: false,
        emailNotificationsEnabled: true,
        offlineAlertThresholdHours: 4,
        features: [],
    })
})

describe('Profile email notifications', () => {
    it('does not render for users without Garge Security', async () => {
        useFeature.mockReturnValue(false)
        render(<Profile />)

        await screen.findByText('Kari Nordmann')

        expect(screen.queryByText('Email notifications')).not.toBeInTheDocument()
        expect(screen.queryByText(/Garge Security/)).not.toBeInTheDocument()
    })

    it('turns email notifications off for users with Garge Security', async () => {
        useFeature.mockReturnValue(true)
        render(<Profile />)

        const toggle = await screen.findByRole('switch', { name: 'Turn off email notifications' })
        await waitFor(() => expect(toggle).toBeEnabled())
        expect(toggle).toHaveAttribute('aria-checked', 'true')

        fireEvent.click(toggle)

        await waitFor(() => expect(updatePreferences).toHaveBeenCalledWith('user-1', { priceZone: 'NO3', emailNotificationsEnabled: false }))
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Email notifications turned off'))
        expect(screen.getByRole('switch', { name: 'Turn on email notifications' })).toHaveAttribute('aria-checked', 'false')
    })

    it('shows the API message and stays on when Garge Security still needs email', async () => {
        const message = 'Garge Security is on for one of your sensors and needs push or email notifications. Turn Garge Security off first.'
        updatePreferences.mockRejectedValueOnce(new Error(message))
        useFeature.mockReturnValue(true)
        render(<Profile />)

        const toggle = await screen.findByRole('switch', { name: 'Turn off email notifications' })
        await waitFor(() => expect(toggle).toBeEnabled())

        fireEvent.click(toggle)

        await waitFor(() => expect(toastError).toHaveBeenCalledWith(message))
        await waitFor(() => expect(screen.getByRole('switch', { name: 'Turn off email notifications' })).toBeEnabled())
        expect(screen.getByRole('switch', { name: 'Turn off email notifications' })).toHaveAttribute('aria-checked', 'true')
        expect(toastSuccess).not.toHaveBeenCalled()
    })
})
