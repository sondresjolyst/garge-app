import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeSession, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'

vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())
vi.mock('@/services/userService', () => ({
    default: {
        getUserProfile: vi.fn(() => Promise.resolve({
            id: 'user-1', email: 'kari@example.com', firstName: 'Kari', lastName: 'Nordmann', emailConfirmed: true,
            priceZone: 'NO3', pushNotificationsEnabled: false, emailNotificationsEnabled: true, offlineAlertThresholdHours: 4, features: [],
        })),
        getDataRetention: vi.fn(() => Promise.resolve({ optOut: false, optedOutAt: null })),
    },
}))
vi.mock('@/services/sensorService', () => ({ default: { getAllSensors: vi.fn(() => Promise.resolve([])) } }))
vi.mock('@/services/switchService', () => ({ default: { getAllSwitches: vi.fn(() => Promise.resolve([])) } }))
vi.mock('@/services/groupService', () => ({ default: { getAllGroups: vi.fn(() => Promise.resolve([])) } }))
vi.mock('@/services/pairingService', () => ({ default: { mintToken: vi.fn() } }))
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
vi.mock('@/hooks/useDeviceStream', () => ({ useDeviceStream: vi.fn() }))
vi.mock('@/hooks/useFeature', () => ({ useFeature: () => false }))
vi.mock('@/services/companyService', () => ({ getCompanyInfo: () => Promise.resolve(null) }))

import SetupWizard from '@/app/SetupWizard'
import Profile from '@/app/(protected)/profile/page'
import ContactPage from '@/app/contact/page'

beforeEach(() => {
    resetTestMocks()
    setSession(makeSession())
})

describe('Links to the help pages', () => {
    it('opens the power on step in a new tab from the pairing step, so the code stays on screen', () => {
        render(<SetupWizard onClose={vi.fn()} />)
        const link = screen.getByRole('link', { name: 'Need help?' })

        expect(link).toHaveAttribute('href', '/help#step-power')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('has a Help row on the profile page, like the other rows', async () => {
        render(<Profile />)
        const row = await screen.findByRole('link', { name: /^❓ *Help/ })

        expect(row).toHaveAttribute('href', '/help')
        const billing = screen.getByRole('link', { name: /Subscription & orders/ })
        expect(row.className).toBe(billing.className)
    })

    it('points to Help before the email address on the contact page', async () => {
        render(await ContactPage())
        const help = screen.getByRole('link', { name: 'Help' })
        const email = screen.getByRole('link', { name: 'sondresjoelyst@gmail.com' })

        expect(help).toHaveAttribute('href', '/help')
        expect(help.parentElement).toHaveTextContent('Most questions are answered in Help.')
        expect(help.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
})
