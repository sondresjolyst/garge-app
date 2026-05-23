import { describe, it, expect, vi, beforeEach } from 'vitest'
import SwitchService from '@/services/switchService'

vi.mock('@/services/axiosInstance', () => ({
    default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

import axiosInstance from '@/services/axiosInstance'

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>
const mockPost = axiosInstance.post as ReturnType<typeof vi.fn>
const mockDelete = axiosInstance.delete as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.clearAllMocks()
})

describe('SwitchService sharing', () => {
    it('maps the API integer permission to a string in getSwitchShares', async () => {
        mockGet.mockResolvedValueOnce({
            data: [
                { userId: 'u1', email: 'a@x', firstName: 'A', lastName: 'B', permission: 1, sharedAt: '2026-01-01' },
                { userId: 'u2', email: 'c@x', firstName: 'C', lastName: 'D', permission: 0, sharedAt: '2026-01-02' },
            ],
        })

        const shares = await SwitchService.getSwitchShares(7)

        expect(mockGet).toHaveBeenCalledWith('/switches/7/shares')
        expect(shares[0].permission).toBe('edit')
        expect(shares[1].permission).toBe('read')
    })

    it('sends the integer permission when sharing (edit=1)', async () => {
        mockPost.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SwitchService.shareSwitch(7, 'a@x', 'edit')
        expect(mockPost).toHaveBeenCalledWith('/switches/7/share', { email: 'a@x', permission: 1 })
    })

    it('sends the integer permission when sharing (read=0)', async () => {
        mockPost.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SwitchService.shareSwitch(7, 'a@x', 'read')
        expect(mockPost).toHaveBeenCalledWith('/switches/7/share', { email: 'a@x', permission: 0 })
    })

    it('revokeSwitchShare deletes the share by user id', async () => {
        mockDelete.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SwitchService.revokeSwitchShare(7, 'u1')
        expect(mockDelete).toHaveBeenCalledWith('/switches/7/share/u1')
    })
})
