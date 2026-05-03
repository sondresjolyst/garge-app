import { describe, it, expect, vi, beforeEach } from 'vitest'
import AdminService, { EmailStats } from '@/services/adminService'

vi.mock('@/services/axiosInstance', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}))

import axiosInstance from '@/services/axiosInstance'

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>

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
