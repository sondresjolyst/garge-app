import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { apiFieldErrors } from '@sjolystinnovation/app-kit/api'
import AdminService, { AdminUser, AppSettings, EmailStats, SecuritySettings, SiteSettings } from '@/services/adminService'

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock'

beforeEach(() => {
    resetTestMocks()
    resetAxiosSpies()
})

describe('AdminService.getEmailStats', () => {
    const mockEmailStats: EmailStats = {
        requests: 100,
        delivered: 95,
        hardBounces: 2,
        softBounces: 1,
        spamReports: 0,
        blocked: 1,
        invalid: 1,
        days: 30,
    }

    it('returns email stats from API', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: mockEmailStats })
        const result = await AdminService.getEmailStats()
        expect(result).toEqual(mockEmailStats)
    })

    it('calls correct endpoint with default days=30', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: mockEmailStats })
        await AdminService.getEmailStats()
        expect(axiosSpies.get).toHaveBeenCalledWith('/admin/email-stats', { params: { days: 30 } })
    })

    it('passes custom days param', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: { ...mockEmailStats, days: 7 } })
        await AdminService.getEmailStats(7)
        expect(axiosSpies.get).toHaveBeenCalledWith('/admin/email-stats', { params: { days: 7 } })
    })

    it('passes on a failure to load the stats', async () => {
        axiosSpies.get.mockRejectedValueOnce(new Error('network down'))
        await expect(AdminService.getEmailStats()).rejects.toThrow('network down')
    })

    it('passes 90 days param', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: { ...mockEmailStats, days: 90 } })
        await AdminService.getEmailStats(90)
        expect(axiosSpies.get).toHaveBeenCalledWith('/admin/email-stats', { params: { days: 90 } })
    })
})

describe('AdminService.getUsers', () => {
    const users: AdminUser[] = [
        { id: 'u1', userName: 'a', firstName: 'A', lastName: 'B', email: 'a@x', createdAt: '2026-10-01T08:00:00Z', isDeleted: false, roles: [] },
    ]

    it('hides deleted by default', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: users })
        const result = await AdminService.getUsers()
        expect(axiosSpies.get).toHaveBeenCalledWith('/users', { params: { includeDeleted: false } })
        expect(result).toEqual(users)
    })

    it('passes includeDeleted=true when requested', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: users })
        await AdminService.getUsers(true)
        expect(axiosSpies.get).toHaveBeenCalledWith('/users', { params: { includeDeleted: true } })
    })

    it('says the users failed to load when the API gives no reason', async () => {
        axiosSpies.get.mockRejectedValueOnce(new AxiosError('refused', '500', undefined, undefined,
            { status: 500, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: {} }))
        await expect(AdminService.getUsers()).rejects.toThrow('Failed to load users')
    })
})

describe('AdminService unwrapped lists', () => {
    it('returns the devices as the API sends them', async () => {
        const devices = [{ id: 1, discoveredBy: 'bridge', target: 'garge/x', type: 'sensor', timestamp: '2026-10-17T08:00:00Z' }]
        axiosSpies.get.mockResolvedValueOnce({ data: devices })
        expect(await AdminService.getDevices()).toEqual(devices)
        expect(axiosSpies.get).toHaveBeenCalledWith('/admin/devices')
    })

    it('returns the stats history as the API sends it', async () => {
        const history = [{ date: '2026-10-17', totalUsers: 3, totalSensors: 2, totalSwitches: 1, totalAutomations: 0 }]
        axiosSpies.get.mockResolvedValueOnce({ data: history })
        expect(await AdminService.getStatsHistory()).toEqual(history)
        expect(axiosSpies.get).toHaveBeenCalledWith('/admin/stats/history')
    })
})

describe('AdminService.deleteUser', () => {
    it("deletes on garge-api's own admin route, encoding the id", async () => {
        axiosSpies.delete.mockResolvedValueOnce({ data: '' })
        await AdminService.deleteUser('u/1')
        expect(axiosSpies.delete).toHaveBeenCalledWith('/users/u%2F1')
    })
})

describe('AdminService roles', () => {
    it('loads the roles an admin may give from the shared user admin route', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: ['Default', 'Admin', 'SensorAdmin'] })
        const result = await AdminService.getAllRoles()
        expect(axiosSpies.get).toHaveBeenCalledTimes(1)
        expect(axiosSpies.get).toHaveBeenCalledWith('/users/roles')
        expect(result).toEqual(['Default', 'Admin', 'SensorAdmin'])
    })

    it('passes on a failure to load the roles', async () => {
        axiosSpies.get.mockRejectedValueOnce(new Error('network down'))
        await expect(AdminService.getAllRoles()).rejects.toThrow('network down')
    })

    it('gives a role on the user-centric route', async () => {
        axiosSpies.post.mockResolvedValue({ data: {} })
        await AdminService.addRole('u1', 'SensorAdmin')
        expect(axiosSpies.post).toHaveBeenCalledWith('/users/u1/roles', { role: 'SensorAdmin' })
    })

    it("passes on the API's reason and code when a role change is refused", async () => {
        axiosSpies.delete.mockRejectedValueOnce(new AxiosError('refused', '409', undefined, undefined,
            { status: 409, statusText: '', headers: {}, config: { headers: new AxiosHeaders() },
                data: { message: 'The last admin keeps the admin role. Give someone else the role first.', code: 'lastAdmin' } }))

        const error = await AdminService.removeRole('u1', 'Admin').catch((e: unknown) => e)

        expect((error as Error).message).toBe('The last admin keeps the admin role. Give someone else the role first.')
        expect((error as { errorCode?: string }).errorCode).toBe('lastAdmin')
    })

    it('takes a role on the user-centric route, encoding both parts', async () => {
        axiosSpies.delete.mockResolvedValue({ data: {} })
        await AdminService.removeRole('u/1', 'A b')
        expect(axiosSpies.delete).toHaveBeenCalledWith('/users/u%2F1/roles/A%20b')
    })
})

describe('AdminService.getAppSettings', () => {
    const mockSettings: AppSettings = { cookieBannerEnabled: true, vatEnabled: true, vippsTestMode: false }

    it('returns app settings from API', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: mockSettings })
        const result = await AdminService.getAppSettings()
        expect(result).toEqual(mockSettings)
    })

    it('calls correct endpoint', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: mockSettings })
        await AdminService.getAppSettings()
        expect(axiosSpies.get).toHaveBeenCalledWith('/admin/settings')
    })
})

describe('AdminService.updateAppSettings', () => {
    it('calls PUT with correct endpoint and body', async () => {
        const updated: AppSettings = { cookieBannerEnabled: false, vatEnabled: true, vippsTestMode: false }
        axiosSpies.put.mockResolvedValueOnce({ data: updated })
        const result = await AdminService.updateAppSettings({ cookieBannerEnabled: false })
        expect(axiosSpies.put).toHaveBeenCalledWith('/admin/settings', { cookieBannerEnabled: false })
        expect(result).toEqual(updated)
    })

    it('returns updated settings from response', async () => {
        axiosSpies.put.mockResolvedValueOnce({ data: { cookieBannerEnabled: true } })
        const result = await AdminService.updateAppSettings({ cookieBannerEnabled: true })
        expect(result.cookieBannerEnabled).toBe(true)
    })
})

describe('AdminService security settings', () => {
    const settings: SecuritySettings = {
        alertThresholdMinutes: 25,
        minAlertThresholdMinutes: 25,
        maxAlertThresholdMinutes: 180,
        wakeIntervalSeconds: 600,
    }

    it('reads from the admin-only endpoint', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: settings })

        expect(await AdminService.getSecuritySettings()).toEqual(settings)
        expect(axiosSpies.get).toHaveBeenCalledWith('/admin/security-settings')
    })

    it('sends the threshold as a PUT body', async () => {
        axiosSpies.put.mockResolvedValueOnce({ data: { ...settings, alertThresholdMinutes: 45 } })

        const result = await AdminService.updateSecuritySettings(45)

        expect(axiosSpies.put).toHaveBeenCalledWith('/admin/security-settings', { alertThresholdMinutes: 45 })
        expect(result.alertThresholdMinutes).toBe(45)
    })
})

describe('AdminService site settings', () => {
    const settings: SiteSettings = {
        contactRecipientEmail: 'post@garge.no',
        companyName: 'Garge',
        companyLegalName: 'Sjølyst Innovation AS',
        orgNumber: '938 517 789',
        vatRegistered: true,
        streetAddress: 'Mårvegen 21a',
        postalCode: '4347',
        addressLocality: 'Lye',
        addressRegion: 'Rogaland',
        publicEmail: 'hei@garge.no',
        publicPhone: '+47 400 00 000',
    }

    const validationProblem = (errors: Record<string, string[]>) =>
        new AxiosError('refused', '400', undefined, undefined,
            { status: 400, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: { title: 'One or more validation errors occurred.', errors } })

    it('reads the company details from /settings', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: settings })

        expect(await AdminService.getSiteSettings()).toEqual(settings)
        expect(axiosSpies.get).toHaveBeenCalledWith('/settings')
    })

    it('saves the full body on /settings and returns what the API stored', async () => {
        axiosSpies.put.mockResolvedValueOnce({ data: { ...settings, companyName: 'Garge AS' } })

        const result = await AdminService.updateSiteSettings(settings)

        expect(axiosSpies.put).toHaveBeenCalledWith('/settings', settings)
        expect(result.companyName).toBe('Garge AS')
    })

    it('keeps the field errors of a validation problem, keyed in camelCase', async () => {
        axiosSpies.put.mockRejectedValueOnce(validationProblem({ OrgNumber: ['Not a valid organisation number.'], PostalCode: ['A Norwegian postal code is four digits.'] }))

        const error = await AdminService.updateSiteSettings(settings).catch((e: unknown) => e)

        expect(error).toBeInstanceOf(Error)
        expect(apiFieldErrors(error)).toEqual({
            orgNumber: ['Not a valid organisation number.'],
            postalCode: ['A Norwegian postal code is four digits.'],
        })
    })

    it('gives one message and no field errors for a failure without them', async () => {
        axiosSpies.put.mockRejectedValueOnce(new AxiosError('refused', '500', undefined, undefined,
            { status: 500, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: '' }))

        const error = await AdminService.updateSiteSettings(settings).catch((e: unknown) => e)

        expect((error as Error).message).toBe('Failed to update settings')
        expect(apiFieldErrors(error)).toBeNull()
    })
})
