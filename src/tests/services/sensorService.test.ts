import { describe, it, expect, vi, beforeEach } from 'vitest'
import SensorService from '@/services/sensorService'

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

describe('SensorService sharing', () => {
    it('maps the API integer permission to a string in getSensorShares', async () => {
        mockGet.mockResolvedValueOnce({
            data: [
                { userId: 'u1', email: 'a@x', firstName: 'A', lastName: 'B', permission: 1, sharedAt: '2026-01-01' },
                { userId: 'u2', email: 'c@x', firstName: 'C', lastName: 'D', permission: 0, sharedAt: '2026-01-02' },
            ],
        })

        const shares = await SensorService.getSensorShares(5)

        expect(mockGet).toHaveBeenCalledWith('/sensors/5/shares')
        expect(shares[0].permission).toBe('edit')
        expect(shares[1].permission).toBe('read')
    })

    it('sends the integer permission when sharing (edit=1)', async () => {
        mockPost.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SensorService.shareSensor(5, 'a@x', 'edit')
        expect(mockPost).toHaveBeenCalledWith('/sensors/5/share', { email: 'a@x', permission: 1 })
    })

    it('sends the integer permission when sharing (read=0)', async () => {
        mockPost.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SensorService.shareSensor(5, 'a@x', 'read')
        expect(mockPost).toHaveBeenCalledWith('/sensors/5/share', { email: 'a@x', permission: 0 })
    })

    it('revokeSensorShare deletes the share by user id', async () => {
        mockDelete.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SensorService.revokeSensorShare(5, 'u1')
        expect(mockDelete).toHaveBeenCalledWith('/sensors/5/share/u1')
    })
})
