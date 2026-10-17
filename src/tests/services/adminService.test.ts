import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import AdminService, { AppSettings, EmailStats, SecuritySettings, SiteSettings } from '@/services/adminService'
import { FieldValidationError } from '@/lib/errors'

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
    const users = [
        { id: 'u1', userName: 'a', firstName: 'A', lastName: 'B', email: 'a@x', isDeleted: false, roles: [] },
    ]

    it('hides deleted by default (no includeDeleted param)', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: users })
        const result = await AdminService.getUsers()
        expect(axiosSpies.get).toHaveBeenCalledWith('/users', { params: undefined })
        expect(result).toEqual(users)
    })

    it('passes includeDeleted=true when requested', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: users })
        await AdminService.getUsers({ includeDeleted: true })
        expect(axiosSpies.get).toHaveBeenCalledWith('/users', { params: { includeDeleted: true } })
    })

    it('unwraps a $values envelope', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: { $values: users } })
        const result = await AdminService.getUsers()
        expect(result).toEqual(users)
    })
})

describe('AdminService roles', () => {
    it('loads the roles an admin may give from the shared user admin route', async () => {
        axiosSpies.get.mockResolvedValueOnce({ data: ['Default', 'Admin', 'SensorAdmin'] })
        const result = await AdminService.getAllRoles()
        expect(axiosSpies.get).toHaveBeenCalledWith('/users/roles')
        expect(result).toEqual(['Default', 'Admin', 'SensorAdmin'])
    })

    it('passes on a failure to load the roles', async () => {
        axiosSpies.get.mockRejectedValueOnce(new Error('network down'))
        await expect(AdminService.getAllRoles()).rejects.toThrow('network down')
    })

    it('gives a role on the user-centric route', async () => {
        axiosSpies.post.mockResolvedValue({ data: {} })
        await AdminService.assignRole('u1', 'SensorAdmin')
        expect(axiosSpies.post).toHaveBeenCalledWith('/users/u1/roles', { role: 'SensorAdmin' })
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

    it('turns a validation problem into field errors keyed in camelCase', async () => {
        axiosSpies.put.mockRejectedValueOnce(validationProblem({ OrgNumber: ['Not a valid organisation number.'], PostalCode: ['A Norwegian postal code is four digits.'] }))

        const error = await AdminService.updateSiteSettings(settings).catch((e: unknown) => e)

        expect(error).toBeInstanceOf(FieldValidationError)
        expect((error as FieldValidationError).fieldErrors).toEqual({
            orgNumber: ['Not a valid organisation number.'],
            postalCode: ['A Norwegian postal code is four digits.'],
        })
    })

    it('gives one message for a failure without field errors', async () => {
        axiosSpies.put.mockRejectedValueOnce(new AxiosError('refused', '403', undefined, undefined,
            { status: 403, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: '' }))

        await expect(AdminService.updateSiteSettings(settings)).rejects.toThrow('Not authorized.')
    })
})
