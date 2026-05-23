import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminService, { AppSettings, EmailStats } from '@/services/adminService'

vi.mock('@/services/axiosInstance', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

import axiosInstance from '@/services/axiosInstance'

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>
const mockPut = axiosInstance.put as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.clearAllMocks()
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
        mockGet.mockResolvedValueOnce({ data: mockEmailStats })
        const result = await AdminService.getEmailStats()
        expect(result).toEqual(mockEmailStats)
    })

    it('calls correct endpoint with default days=30', async () => {
        mockGet.mockResolvedValueOnce({ data: mockEmailStats })
        await AdminService.getEmailStats()
        expect(mockGet).toHaveBeenCalledWith('/admin/email-stats', { params: { days: 30 } })
    })

    it('passes custom days param', async () => {
        mockGet.mockResolvedValueOnce({ data: { ...mockEmailStats, days: 7 } })
        await AdminService.getEmailStats(7)
        expect(mockGet).toHaveBeenCalledWith('/admin/email-stats', { params: { days: 7 } })
    })

    it('passes 90 days param', async () => {
        mockGet.mockResolvedValueOnce({ data: { ...mockEmailStats, days: 90 } })
        await AdminService.getEmailStats(90)
        expect(mockGet).toHaveBeenCalledWith('/admin/email-stats', { params: { days: 90 } })
    })
})

describe('AdminService.getUsers', () => {
    const users = [
        { id: 'u1', userName: 'a', firstName: 'A', lastName: 'B', email: 'a@x', isDeleted: false, roles: [] },
    ]

    it('hides deleted by default (no includeDeleted param)', async () => {
        mockGet.mockResolvedValueOnce({ data: users })
        const result = await AdminService.getUsers()
        expect(mockGet).toHaveBeenCalledWith('/users', { params: undefined })
        expect(result).toEqual(users)
    })

    it('passes includeDeleted=true when requested', async () => {
        mockGet.mockResolvedValueOnce({ data: users })
        await AdminService.getUsers({ includeDeleted: true })
        expect(mockGet).toHaveBeenCalledWith('/users', { params: { includeDeleted: true } })
    })

    it('unwraps a $values envelope', async () => {
        mockGet.mockResolvedValueOnce({ data: { $values: users } })
        const result = await AdminService.getUsers()
        expect(result).toEqual(users)
    })
})

describe('AdminService.getAppSettings', () => {
    const mockSettings: AppSettings = { cookieBannerEnabled: true }

    it('returns app settings from API', async () => {
        mockGet.mockResolvedValueOnce({ data: mockSettings })
        const result = await AdminService.getAppSettings()
        expect(result).toEqual(mockSettings)
    })

    it('calls correct endpoint', async () => {
        mockGet.mockResolvedValueOnce({ data: mockSettings })
        await AdminService.getAppSettings()
        expect(mockGet).toHaveBeenCalledWith('/admin/settings')
    })
})

describe('AdminService.updateAppSettings', () => {
    it('calls PUT with correct endpoint and body', async () => {
        const updated: AppSettings = { cookieBannerEnabled: false }
        mockPut.mockResolvedValueOnce({ data: updated })
        const result = await AdminService.updateAppSettings({ cookieBannerEnabled: false })
        expect(mockPut).toHaveBeenCalledWith('/admin/settings', { cookieBannerEnabled: false })
        expect(result).toEqual(updated)
    })

    it('returns updated settings from response', async () => {
        mockPut.mockResolvedValueOnce({ data: { cookieBannerEnabled: true } })
        const result = await AdminService.updateAppSettings({ cookieBannerEnabled: true })
        expect(result.cookieBannerEnabled).toBe(true)
    })
})
