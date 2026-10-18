import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { makeSession, resetTestMocks, setSession, toastSpies } from '@sjolystinnovation/app-kit/testing'

// First coverage for the admin page. Locks the parts the react-hooks refactor
// changed:
// - the main load runs once for an admin, driven by statsTestRef rather than a
//   statsTest dependency, so flipping Live/Test does not refetch everything
// - the email stats show in app-kit's EmailStatsPanel with garge's period picker,
//   and the picked days survive the full reload after a role change
// - a non-admin is redirected and loads nothing

const {
    getStats, getUsers, getStatsHistory, getEmailStats, getAllRoles, getAppSettings,
    getSecuritySettings, updateAppSettings, removeRole, addRole, getSiteSettings, updateSiteSettings,
} = vi.hoisted(() => ({
    getSiteSettings: vi.fn(),
    updateSiteSettings: vi.fn(),
    removeRole: vi.fn(),
    addRole: vi.fn(),
    updateAppSettings: vi.fn(),
    getStats: vi.fn(),
    getUsers: vi.fn(),
    getStatsHistory: vi.fn(),
    getEmailStats: vi.fn(),
    getAllRoles: vi.fn(),
    getAppSettings: vi.fn(),
    getSecuritySettings: vi.fn(),
}))

vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())
vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('sonner', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/components/admin/VatThresholdCard', () => ({ default: () => null }))
vi.mock('@/components/admin/BrandingCard', () => ({ default: () => <p>branding card</p> }))
vi.mock('@/components/admin/LegalPagesCard', () => ({ default: () => <p>legal pages card</p> }))
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
        getSiteSettings: () => getSiteSettings(),
        updateSiteSettings: (...a: unknown[]) => updateSiteSettings(...a),
        addRole: (...a: unknown[]) => addRole(...a),
        removeRole: (...a: unknown[]) => removeRole(...a),
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

const siteSettings = {
    contactRecipientEmail: 'post@garge.no',
    companyName: 'Garge',
    companyLegalName: 'Sjølyst Innovation AS',
    orgNumber: '938 517 789',
    vatRegistered: true,
    streetAddress: 'Mårvegen 21a',
    postalCode: '4347',
    addressLocality: 'Lye',
    addressRegion: '',
    publicEmail: 'hei@garge.no',
    publicPhone: '+47 400 00 000',
}

function signInAsAdmin() {
    setSession(makeSession({ roles: ['Admin'] }))
}

function signInAsUser() {
    setSession(makeSession({ roles: ['Default'] }))
}

beforeEach(resetTestMocks)
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
    getSiteSettings.mockResolvedValue(siteSettings)
})

// What app-kit's request throws for a refused call: the API's message, and its code when it sent one.
const refused = (message: string, errorCode?: string) => Object.assign(new Error(message), errorCode ? { errorCode } : {})

const kari = { id: 'u3', userName: 'kari', firstName: 'Kari', lastName: 'N', email: 'kari@example.no', isDeleted: false, roles: ['Admin'] }

describe('AdminPage', () => {
    it('takes a role by user id and shows why the API refused', async () => {
        getUsers.mockResolvedValue([kari])
        removeRole.mockRejectedValue(refused('The last admin keeps the admin role. Give someone else the role first.', 'lastAdmin'))
        render(<AdminPage />)

        fireEvent.click(await screen.findByTitle('Remove Admin'))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('The last admin keeps the admin role. Give someone else the role first.'))
        expect(removeRole).toHaveBeenCalledWith('u3', 'Admin')
    })

    it('gives a role by user id', async () => {
        getUsers.mockResolvedValue([kari])
        addRole.mockResolvedValue(undefined)
        render(<AdminPage />)

        fireEvent.click(await screen.findByText('Add role'))
        fireEvent.click(screen.getByRole('button', { name: 'Add' }))

        await waitFor(() => expect(addRole).toHaveBeenCalledWith('u3', 'Default'))
        await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith('Added Default to Kari'))
        // The list reloads with the same deleted filter it had.
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(2))
        expect(getUsers.mock.calls).toEqual([[false], [false]])
    })

    it('shows why the API refused a new role', async () => {
        getUsers.mockResolvedValue([kari])
        addRole.mockRejectedValue(refused('Unknown role.', 'unknownRole'))
        render(<AdminPage />)

        fireEvent.click(await screen.findByText('Add role'))
        fireEvent.click(screen.getByRole('button', { name: 'Add' }))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Unknown role.'))
    })

    it('falls back to its own text when a role change fails without an error', async () => {
        getUsers.mockResolvedValue([kari])
        removeRole.mockRejectedValue('dropped')
        addRole.mockRejectedValue('dropped')
        render(<AdminPage />)

        fireEvent.click(await screen.findByTitle('Remove Admin'))
        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Failed to remove role'))

        fireEvent.click(screen.getByText('Add role'))
        fireEvent.click(screen.getByRole('button', { name: 'Add' }))
        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Failed to assign role'))
    })

    it('loads the users without the deleted ones, and with them after the toggle', async () => {
        render(<AdminPage />)

        await waitFor(() => expect(getUsers).toHaveBeenCalledWith(false))
        fireEvent.click(await screen.findByLabelText('Show deleted users'))
        await waitFor(() => expect(getUsers).toHaveBeenLastCalledWith(true))
    })

    it('shows the branding and legal page editors', async () => {
        render(<AdminPage />)

        expect(await screen.findByText('Branding')).toBeInTheDocument()
        expect(screen.getByText('branding card')).toBeInTheDocument()
        expect(screen.getByText('Legal pages')).toBeInTheDocument()
        expect(screen.getByText('legal pages card')).toBeInTheDocument()
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
        expect(screen.getByRole('heading', { name: 'Transactional email, last 30 days' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows each email count on its own row', async () => {
        render(<AdminPage />)
        await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument())

        const rows = [['Sent', '100'], ['Delivered', '1'], ['Hard bounces', '2'], ['Soft bounces', '3'], ['Blocked', '5'], ['Spam reports', '4'], ['Invalid', '6']]
        const shown = screen.getAllByRole('term').map(dt => [dt.textContent, dt.nextElementSibling?.textContent])
        expect(shown).toEqual(rows)
    })

    it('keeps the picked email stats days through the reload after a role change', async () => {
        getUsers.mockResolvedValue([kari])
        removeRole.mockResolvedValue(undefined)
        render(<AdminPage />)
        await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: '90d' }))
        await waitFor(() => expect(getEmailStats).toHaveBeenLastCalledWith(90))
        fireEvent.click(await screen.findByTitle('Remove Admin'))

        await waitFor(() => expect(getStats).toHaveBeenCalledTimes(2))
        await waitFor(() => expect(screen.getByRole('button', { name: '90d' })).toHaveAttribute('aria-pressed', 'true'))
        expect(getEmailStats).not.toHaveBeenLastCalledWith(30)
    })

    it('refetches email stats for a new range and shows the new numbers', async () => {
        render(<AdminPage />)
        await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument())

        getEmailStats.mockResolvedValueOnce(emailStats(77))
        fireEvent.click(screen.getByText('7d'))

        await waitFor(() => expect(getEmailStats).toHaveBeenCalledWith(7))
        await waitFor(() => expect(screen.getByText('77')).toBeInTheDocument())
    })

    it('says the email stats are unavailable when the fetch fails, without a toast', async () => {
        getEmailStats.mockRejectedValue(new Error('brevo down'))
        render(<AdminPage />)

        expect(await screen.findByText('Unavailable.')).toBeInTheDocument()
        expect(toastSpies.error).not.toHaveBeenCalled()
        // The panel settles rather than waiting forever, and a second range still works.
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

describe('AdminPage company details', () => {
    it('loads the company section from /settings next to the garge toggles', async () => {
        render(<AdminPage />)

        expect(await screen.findByText('Company')).toBeInTheDocument()
        expect(await screen.findByLabelText(/Street address/)).toHaveValue('Mårvegen 21a')
        expect(getSiteSettings).toHaveBeenCalledTimes(1)
        // Cookie banner, VAT and Vipps stay on garge's own settings.
        expect(await screen.findByLabelText('Toggle cookie banner')).toBeInTheDocument()
        expect(screen.getByLabelText('Toggle VAT')).toBeInTheDocument()
        expect(screen.getByLabelText('Toggle Vipps test mode')).toBeInTheDocument()
    })

    it('saves a toggle on /admin/settings with only the garge field', async () => {
        updateAppSettings.mockResolvedValue({ cookieBannerEnabled: false, vatEnabled: true, vippsTestMode: false })
        render(<AdminPage />)

        fireEvent.click(await screen.findByLabelText('Toggle cookie banner'))

        await waitFor(() => expect(updateAppSettings).toHaveBeenCalledWith({ cookieBannerEnabled: false }))
        expect(updateSiteSettings).not.toHaveBeenCalled()
    })
})
