import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Locks two pieces of profile/page.tsx that the react-hooks refactor changed:
// - `isButtonDisabled` is derived (`countdown > 0`) instead of a second state,
//   so resending must disable the button, show the countdown, and re-enable it
// - `pushPermission` comes from a useSyncExternalStore read of
//   Notification.permission instead of being copied into state on mount, so the
//   'denied' warning must still appear

const {
    getUserProfile, resendEmailConfirmation, getDataRetention,
    getAllSensors, getAllSwitches, isPushSupported, isPushSubscribed,
} = vi.hoisted(() => ({
    getUserProfile: vi.fn(),
    resendEmailConfirmation: vi.fn(),
    getDataRetention: vi.fn(),
    getAllSensors: vi.fn(),
    getAllSwitches: vi.fn(),
    isPushSupported: vi.fn(),
    isPushSubscribed: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: { user: { id: 'u1' } }, status: 'authenticated' }),
    signOut: vi.fn(),
}))
vi.mock('@/services/userService', () => ({
    default: {
        getUserProfile: () => getUserProfile(),
        resendEmailConfirmation: (...a: unknown[]) => resendEmailConfirmation(...a),
        getDataRetention: (...a: unknown[]) => getDataRetention(...a),
        updatePreferences: vi.fn(() => Promise.resolve({})),
        confirmEmail: vi.fn(),
    },
}))
vi.mock('@/services/sensorService', () => ({ default: { getAllSensors: () => getAllSensors() } }))
vi.mock('@/services/switchService', () => ({ default: { getAllSwitches: () => getAllSwitches() } }))
vi.mock('@/services/pushNotificationService', () => ({
    isPushSupported: () => isPushSupported(),
    isPushSubscribed: () => isPushSubscribed(),
    subscribeToPush: vi.fn(),
    unsubscribeFromPush: vi.fn(),
    sendTestNotification: vi.fn(),
}))
vi.mock('@/hooks/useCanClaimDevice', () => ({
    useCanClaimDevice: () => ({
        canClaim: true, loading: false, used: 0, capacity: 5, bypass: false, refresh: vi.fn(),
    }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import ProfilePage from '@/app/(protected)/profile/page'

const unconfirmedUser = {
    id: 'u1',
    email: 'a@example.com',
    firstName: 'A',
    lastName: 'B',
    emailConfirmed: false,
    priceZone: 'NO2',
    offlineAlertThresholdHours: 4,
    emailNotificationsEnabled: true,
    features: [],
}

beforeEach(() => {
    vi.clearAllMocks()
    getUserProfile.mockResolvedValue(unconfirmedUser)
    getDataRetention.mockResolvedValue({ optOut: false })
    getAllSensors.mockResolvedValue([])
    getAllSwitches.mockResolvedValue([])
    isPushSupported.mockReturnValue(false)
    isPushSubscribed.mockResolvedValue(false)
})

const resendButton = () => screen.getByText('Resend confirmation email')

describe('ProfilePage resend confirmation countdown', () => {
    it('enables the resend button before it is used', async () => {
        render(<ProfilePage />)
        await waitFor(() => expect(resendButton()).toBeInTheDocument())

        expect(resendButton()).not.toBeDisabled()
        expect(screen.queryByText('60s')).not.toBeInTheDocument()
    })

    it('disables the button and shows the countdown after resending', async () => {
        resendEmailConfirmation.mockResolvedValue({ message: 'Email sent' })
        render(<ProfilePage />)
        await waitFor(() => expect(resendButton()).toBeInTheDocument())

        await act(async () => { fireEvent.click(resendButton()) })

        expect(resendEmailConfirmation).toHaveBeenCalledWith('a@example.com')
        await waitFor(() => expect(screen.getByText('60s')).toBeInTheDocument())
        expect(resendButton()).toBeDisabled()
    })

    it('leaves the button enabled when the resend fails', async () => {
        resendEmailConfirmation.mockRejectedValue(new Error('nope'))
        render(<ProfilePage />)
        await waitFor(() => expect(resendButton()).toBeInTheDocument())

        await act(async () => { fireEvent.click(resendButton()) })

        expect(resendButton()).not.toBeDisabled()
        expect(screen.queryByText('60s')).not.toBeInTheDocument()
    })

    it('counts down and re-enables the button when it reaches zero', async () => {
        resendEmailConfirmation.mockResolvedValue({ message: 'Email sent' })
        render(<ProfilePage />)
        // Let the profile load on real timers, then take over the clock.
        await waitFor(() => expect(resendButton()).toBeInTheDocument())

        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        try {
            await act(async () => { fireEvent.click(resendButton()) })
            expect(screen.getByText('60s')).toBeInTheDocument()

            await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
            expect(screen.getByText('59s')).toBeInTheDocument()

            // One tick per second, each scheduled by the previous render.
            for (let i = 0; i < 60; i++) {
                await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
            }
            expect(resendButton()).not.toBeDisabled()
            expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument()
        } finally {
            vi.useRealTimers()
        }
    })
})

describe('ProfilePage push permission', () => {
    it('warns when notification permission is denied', async () => {
        isPushSupported.mockReturnValue(true)
        Object.defineProperty(globalThis, 'Notification', {
            value: { permission: 'denied' },
            configurable: true,
        })

        render(<ProfilePage />)

        await waitFor(() =>
            expect(screen.getByText(/Notifications blocked in browser settings/i)).toBeInTheDocument())
    })
})
