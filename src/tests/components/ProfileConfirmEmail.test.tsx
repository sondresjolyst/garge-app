import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// The profile shows why an email confirmation failed, as the API words it.

const {
    getUserProfile, resendEmailConfirmation, getDataRetention,
    getAllSensors, getAllSwitches, isPushSupported, isPushSubscribed, confirmEmail,
} = vi.hoisted(() => ({
    confirmEmail: vi.fn(),
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
        confirmEmail: (...a: unknown[]) => confirmEmail(...a),
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

const confirm = async (code: string) => {
    fireEvent.change(await screen.findByPlaceholderText('Verification code'), { target: { value: code } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
}

describe('ProfilePage email confirmation', () => {
    it('shows the message the API gives for a refused code', async () => {
        confirmEmail.mockRejectedValue(new Error('Too many attempts. Request a new verification code.'))
        render(<ProfilePage />)

        await confirm('ABC123')

        expect(await screen.findByText('Too many attempts. Request a new verification code.')).toBeInTheDocument()
        expect(confirmEmail).toHaveBeenCalledWith('a@example.com', 'ABC123')
        expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('falls back to a general message when the failure has none', async () => {
        confirmEmail.mockRejectedValue('network down')
        render(<ProfilePage />)

        await confirm('ABC123')

        expect(await screen.findByText('Failed to confirm email')).toBeInTheDocument()
    })

    it('marks the email confirmed when the code is right', async () => {
        confirmEmail.mockResolvedValue({ message: 'Email verified successfully!' })
        render(<ProfilePage />)

        await confirm('ABC123')

        expect(await screen.findByText('Email verified successfully!')).toBeInTheDocument()
        await waitFor(() => expect(screen.getByText('Confirmed')).toBeInTheDocument())
    })
})
