import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import SensorService from '@/services/sensorService'
import { ApiError } from '@/lib/errors'

vi.mock('@/services/axiosInstance', () => ({
    default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import axiosInstance from '@/services/axiosInstance'

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>
const mockPost = axiosInstance.post as ReturnType<typeof vi.fn>
const mockPatch = axiosInstance.patch as ReturnType<typeof vi.fn>
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

describe('SensorService Garge Security', () => {
    const security = {
        sensorId: 5,
        enabled: true,
        thresholdMinutes: 30,
        requestedSleepSeconds: 600,
        appliedSleepSeconds: null,
        armedAt: null,
        lastReportedAt: null,
        state: 'pending',
        reason: 'awaiting_wake',
        enforcingRule: null,
        isOwner: true,
    }

    it('getSensorSecurity GETs the security endpoint', async () => {
        mockGet.mockResolvedValueOnce({ data: security })
        const result = await SensorService.getSensorSecurity(5)
        expect(mockGet).toHaveBeenCalledWith('/sensors/5/security')
        expect(result).toEqual(security)
    })

    it('updateSensorSecurity PATCHes enabled and threshold', async () => {
        mockPatch.mockResolvedValueOnce({ data: security })
        const result = await SensorService.updateSensorSecurity(5, { enabled: true, thresholdMinutes: 30 })
        expect(mockPatch).toHaveBeenCalledWith('/sensors/5/security', { enabled: true, thresholdMinutes: 30 })
        expect(result).toEqual(security)
    })

    it('disableSensorSecurity DELETEs the security endpoint', async () => {
        mockDelete.mockResolvedValueOnce({ data: '' })
        await SensorService.disableSensorSecurity(5)
        expect(mockDelete).toHaveBeenCalledWith('/sensors/5/security')
    })

    it('keeps the API error code when the update is rejected', async () => {
        const axiosErr = new AxiosError('Bad Request')
        axiosErr.response = {
            data: { code: 'charging_automation_required', message: 'Add a charging automation first.' },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config: { headers: {} } as never,
        }
        mockPatch.mockRejectedValueOnce(axiosErr)

        const promise = SensorService.updateSensorSecurity(5, { enabled: true })

        await expect(promise).rejects.toBeInstanceOf(ApiError)
        await expect(promise).rejects.toMatchObject({
            code: 'charging_automation_required',
            message: 'Add a charging automation first.',
        })
    })
})
