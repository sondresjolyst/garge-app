import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// First coverage for the admin page. Locks the parts the react-hooks refactor
// changed:
// - the main load runs once for an admin, driven by statsTestRef rather than a
//   statsTest dependency, so flipping Live/Test does not refetch everything
// - emailStats / emailStatsLoading are derived from an entry keyed by the day
//   range, including the failure path (spinner must stop)
// - a non-admin is redirected and loads nothing

const {
    getStats, getUsers, getStatsHistory, getEmailStats, getAllRoles, getAppSettings, push,
} = vi.hoisted(() => ({
    getStats: vi.fn(),
    getUsers: vi.fn(),
    getStatsHistory: vi.fn(),
    getEmailStats: vi.fn(),
    getAllRoles: vi.fn(),
    getAppSettings: vi.fn(),
    push: vi.fn(),
}))

const session = { data: null as unknown, status: 'loading' as string }

vi.mock('next-auth/react', () => ({ useSession: () => session }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/services/sensorService', () => ({
    default: { reanalyzeBatteryHealth: vi.fn() },
}))
vi.mock('@/services/adminService', () => ({
    default: {
        getStats: (...a: unknown[]) => getStats(...a),
        getUsers: (...a: unknown[]) => getUsers(...a),
        getStatsHistory: () => getStatsHistory(),
        getEmailStats: (...a: unknown[]) => getEmailStats(...a),
        getAllRoles: () => getAllRoles(),
        getAppSettings: () => getAppSettings(),
        updateAppSettings: vi.fn(),
        assignRole: vi.fn(),
        removeRole: vi.fn(),
        deleteUser: vi.fn(),
    },
}))

import AdminPage from '@/app/(protected)/admin/page'

// Distinct values per field so an assertion on `requests` matches one node only.
const emailStats = (requests: number) => ({
    requests,
    delivered: 1,
    hardBounces: 2,
    softBounces: 3,
    spamReports: 4,
    blocked: 5,
    invalid: 6,
    days: 30,
})

function signInAsAdmin() {
    session.data = { user: { id: 'u1', roles: ['Admin'] } }
    session.status = 'authenticated'
}

function signInAsUser() {
    session.data = { user: { id: 'u2', roles: ['Default'] } }
    session.status = 'authenticated'
}

beforeEach(() => {
    vi.clearAllMocks()
    signInAsAdmin()
    getStats.mockResolvedValue({ totalUsers: 3, totalSensors: 2, totalSwitches: 1, totalAutomations: 0 })
    getUsers.mockResolvedValue([])
    getStatsHistory.mockResolvedValue([])
    getEmailStats.mockResolvedValue(emailStats(100))
    getAllRoles.mockResolvedValue(['Admin', 'Default'])
    getAppSettings.mockResolvedValue({ cookieBannerEnabled: true, vatEnabled: true, vippsTestMode: false })
})

describe('AdminPage', () => {
    it('loads the admin data once for an admin', async () => {
        render(<AdminPage />)

        await waitFor(() => expect(getStats).toHaveBeenCalledTimes(1))
        expect(getUsers).toHaveBeenCalledTimes(1)
        expect(getStatsHistory).toHaveBeenCalledTimes(1)
        expect(push).not.toHaveBeenCalled()
    })

    it('redirects a non-admin and fetches nothing', async () => {
        signInAsUser()
        render(<AdminPage />)

        await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
        expect(getStats).not.toHaveBeenCalled()
        expect(getEmailStats).not.toHaveBeenCalled()
    })

    it('shows the email stats for the default 30 day range', async () => {
        render(<AdminPage />)

        await waitFor(() => expect(getEmailStats).toHaveBeenCalledWith(30))
        await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument())
    })

    it('refetches email stats for a new range and shows the new numbers', async () => {
        render(<AdminPage />)
        await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument())

        getEmailStats.mockResolvedValueOnce(emailStats(77))
        fireEvent.click(screen.getByText('7d'))

        await waitFor(() => expect(getEmailStats).toHaveBeenCalledWith(7))
        await waitFor(() => expect(screen.getByText('77')).toBeInTheDocument())
    })

    it('stops the email stats spinner when the fetch fails', async () => {
        getEmailStats.mockRejectedValue(new Error('brevo down'))
        render(<AdminPage />)

        await waitFor(() => expect(getEmailStats).toHaveBeenCalledTimes(1))
        // The panel must settle rather than spin forever; a second range still works.
        getEmailStats.mockResolvedValueOnce(emailStats(42))
        fireEvent.click(screen.getByText('7d'))
        await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
    })

    it('loads under StrictMode, which mounts effects twice', async () => {
        render(<StrictMode><AdminPage /></StrictMode>)

        await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument())
    })

    it('flipping Live/Test reloads only the stats, not users and history', async () => {
        render(<AdminPage />)
        await waitFor(() => expect(getStats).toHaveBeenCalledTimes(1))

        fireEvent.click(screen.getByText('Test'))

        await waitFor(() => expect(getStats).toHaveBeenCalledTimes(2))
        expect(getStats).toHaveBeenLastCalledWith({ test: true })
        expect(getUsers).toHaveBeenCalledTimes(1)
        expect(getStatsHistory).toHaveBeenCalledTimes(1)
    })
})
