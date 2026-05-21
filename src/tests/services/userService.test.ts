import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/axiosInstance', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))
vi.mock('next-auth/react', () => ({ getSession: vi.fn() }))

import UserService from '@/services/userService'
import axiosInstance from '@/services/axiosInstance'

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>
const mockPut = axiosInstance.put as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.clearAllMocks()
})

describe('UserService.getDataRetention', () => {
    it('GETs the data-retention endpoint and returns the preference', async () => {
        mockGet.mockResolvedValueOnce({ data: { optOut: true, optedOutAt: '2026-01-01T00:00:00Z' } })
        const result = await UserService.getDataRetention('u1')
        expect(mockGet).toHaveBeenCalledWith('/users/u1/data-retention')
        expect(result).toEqual({ optOut: true, optedOutAt: '2026-01-01T00:00:00Z' })
    })
})

describe('UserService.updateDataRetention', () => {
    it('PUTs optOut=true to opt out of retention', async () => {
        mockPut.mockResolvedValueOnce({ data: { optOut: true, optedOutAt: '2026-05-21T00:00:00Z' } })
        const result = await UserService.updateDataRetention('u1', true)
        expect(mockPut).toHaveBeenCalledWith('/users/u1/data-retention', { optOut: true })
        expect(result.optOut).toBe(true)
    })

    it('PUTs optOut=false to keep retention (clears the opt-out)', async () => {
        mockPut.mockResolvedValueOnce({ data: { optOut: false, optedOutAt: null } })
        const result = await UserService.updateDataRetention('u1', false)
        expect(mockPut).toHaveBeenCalledWith('/users/u1/data-retention', { optOut: false })
        expect(result.optedOutAt).toBeNull()
    })

    it('throws a friendly error when the request fails', async () => {
        mockPut.mockRejectedValueOnce(new Error('network down'))
        await expect(UserService.updateDataRetention('u1', true)).rejects.toThrow()
    })
})
