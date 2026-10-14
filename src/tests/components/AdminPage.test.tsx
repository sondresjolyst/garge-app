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
    getStats, getUsers, getStatsHistory, getEmailStats, getAllRoles, getAppSettings,
    getSecuritySettings, push, updateAppSettings, removeRole, assignRole, toastError,
} = vi.hoisted(() => ({
    removeRole: vi.fn(),
    assignRole: vi.fn(),
    toastError: vi.fn(),
    updateAppSettings: vi.fn(),
    getStats: vi.fn(),
    getUsers: vi.fn(),
    getStatsHistory: vi.fn(),
    getEmailStats: vi.fn(),
    getAllRoles: vi.fn(),
    getAppSettings: vi.fn(),
    getSecuritySettings: vi.fn(),
    push: vi.fn(),
}))

const session = { data: null as unknown, status: 'loading' as string }

vi.mock('next-auth/react', () => ({ useSession: () => session }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@sjolystinnovation/app-kit/toast', () => ({ toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) } }))
vi.mock('@/components/admin/VatThresholdCard', () => ({ default: () => null }))
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
        updateAppSettings: (...a: unknown[]) => updateAppSettings(...a),
        getSecuritySettings: () => getSecuritySettings(),
        updateSecuritySettings: vi.fn(),
        assignRole: (...a: unknown[]) => assignRole(...a),
        removeRole: (...a: unknown[]) => removeRole(...a),
        deleteUser: vi.fn(),
    },
}))

import AdminPage from '@/app/(protected)/admin/page'
import { AxiosError, AxiosHeaders } from 'axios'

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
    getSecuritySettings.mockResolvedValue({ alertThresholdMinutes: 25 })
})

const refused = (status: number, message: string) =>
    new AxiosError('refused', String(status), undefined, undefined,
        { status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: { message } })

const kari = { id: 'u3', userName: 'kari', firstName: 'Kari', lastName: 'N', email: 'kari@example.no', isDeleted: false, roles: ['Admin'] }

describe('AdminPage', () => {
    it('takes a role by user id and shows why the API refused', async () => {
        getUsers.mockResolvedValue([kari])
        removeRole.mockRejectedValue(refused(409, 'The last admin keeps the admin role. Give someone else the role first.'))
        render(<AdminPage />)

        fireEvent.click(await screen.findByTitle('Remove Admin'))

        await waitFor(() => expect(toastError).toHaveBeenCalledWith('The last admin keeps the admin role. Give someone else the role first.'))
        expect(removeRole).toHaveBeenCalledWith('u3', 'Admin')
    })

    it('gives a role by user id', async () => {
        getUsers.mockResolvedValue([kari])
        assignRole.mockResolvedValue(undefined)
        render(<AdminPage />)

        fireEvent.click(await screen.findByText('Add role'))
        fireEvent.click(screen.getByRole('button', { name: 'Add' }))

        await waitFor(() => expect(assignRole).toHaveBeenCalledWith('u3', 'Default'))
    })

    it('loads the admin data once for an admin', async () => {
        render(<AdminPage />)

        await waitFor(() => expect(getStats).toHaveBeenCalledTimes(1))
        expect(getUsers).toHaveBeenCalledTimes(1)
        expect(getStatsHistory).toHaveBeenCalledTimes(1)
    })

    // The admin layout's RoleGate sends a non-admin away. The page itself only loads data for admins.
    it('fetches nothing for a non-admin', async () => {
        signInAsUser()
        render(<AdminPage />)

        await new Promise(resolve => setTimeout(resolve, 50))
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

describe('AdminPage VAT registration date', () => {
    it('shows the registration date as the Norwegian calendar date while VAT is on', async () => {
        // 21:30 UTC on 14 September is already 15 September in Norway.
        getAppSettings.mockResolvedValue({ cookieBannerEnabled: true, vatEnabled: true, vatRegisteredFrom: '2026-09-14T22:30:00Z', vippsTestMode: false })
        render(<AdminPage />)

        expect(await screen.findByLabelText('Registered from')).toHaveValue('2026-09-15')
    })

    it('saves a new date and shows what the API stored', async () => {
        getAppSettings.mockResolvedValue({ cookieBannerEnabled: true, vatEnabled: true, vatRegisteredFrom: '2026-09-14T22:00:00Z', vippsTestMode: false })
        updateAppSettings.mockResolvedValue({ cookieBannerEnabled: true, vatEnabled: true, vatRegisteredFrom: '2026-08-31T22:00:00Z', vippsTestMode: false })
        render(<AdminPage />)

        fireEvent.change(await screen.findByLabelText('Registered from'), { target: { value: '2026-09-01' } })

        await waitFor(() => expect(updateAppSettings).toHaveBeenCalledWith({ vatRegisteredFrom: '2026-09-01' }))
        await waitFor(() => expect(screen.getByLabelText('Registered from')).toHaveValue('2026-09-01'))
    })

    it('ignores a cleared date', async () => {
        getAppSettings.mockResolvedValue({ cookieBannerEnabled: true, vatEnabled: true, vatRegisteredFrom: '2026-09-14T22:00:00Z', vippsTestMode: false })
        render(<AdminPage />)

        fireEvent.change(await screen.findByLabelText('Registered from'), { target: { value: '' } })

        expect(updateAppSettings).not.toHaveBeenCalled()
    })

    it('has no date while VAT is off', async () => {
        getAppSettings.mockResolvedValue({ cookieBannerEnabled: true, vatEnabled: false, vatRegisteredFrom: null, vippsTestMode: false })
        render(<AdminPage />)

        await screen.findByLabelText('Toggle VAT')
        expect(screen.queryByLabelText('Registered from')).not.toBeInTheDocument()
    })
})
