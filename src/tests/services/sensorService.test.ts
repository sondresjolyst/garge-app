import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import SensorService from '@/services/sensorService'
import { ApiError } from '@/lib/errors'

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock'

beforeEach(() => {
    resetTestMocks()
    resetAxiosSpies()
})

describe('SensorService sharing', () => {
    it('maps the API integer permission to a string in getSensorShares', async () => {
        axiosSpies.get.mockResolvedValueOnce({
            data: [
                { userId: 'u1', email: 'a@x', firstName: 'A', lastName: 'B', permission: 1, sharedAt: '2026-01-01' },
                { userId: 'u2', email: 'c@x', firstName: 'C', lastName: 'D', permission: 0, sharedAt: '2026-01-02' },
            ],
        })

        const shares = await SensorService.getSensorShares(5)

        expect(axiosSpies.get).toHaveBeenCalledWith('/sensors/5/shares')
        expect(shares[0].permission).toBe('edit')
        expect(shares[1].permission).toBe('read')
    })

    it('sends the integer permission when sharing (edit=1)', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SensorService.shareSensor(5, 'a@x', 'edit')
        expect(axiosSpies.post).toHaveBeenCalledWith('/sensors/5/share', { email: 'a@x', permission: 1 })
    })

    it('sends the integer permission when sharing (read=0)', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SensorService.shareSensor(5, 'a@x', 'read')
        expect(axiosSpies.post).toHaveBeenCalledWith('/sensors/5/share', { email: 'a@x', permission: 0 })
    })

    it('revokeSensorShare deletes the share by user id', async () => {
        axiosSpies.delete.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SensorService.revokeSensorShare(5, 'u1')
        expect(axiosSpies.delete).toHaveBeenCalledWith('/sensors/5/share/u1')
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
        axiosSpies.get.mockResolvedValueOnce({ data: security })
        const result = await SensorService.getSensorSecurity(5)
        expect(axiosSpies.get).toHaveBeenCalledWith('/sensors/5/security')
        expect(result).toEqual(security)
    })

    // The alert threshold is a global admin setting, not per sensor.
    it('updateSensorSecurity PATCHes enabled', async () => {
        axiosSpies.patch.mockResolvedValueOnce({ data: security })
        const result = await SensorService.updateSensorSecurity(5, { enabled: true })
        expect(axiosSpies.patch).toHaveBeenCalledWith('/sensors/5/security', { enabled: true })
        expect(result).toEqual(security)
    })

    it('disableSensorSecurity DELETEs the security endpoint', async () => {
        axiosSpies.delete.mockResolvedValueOnce({ data: '' })
        await SensorService.disableSensorSecurity(5)
        expect(axiosSpies.delete).toHaveBeenCalledWith('/sensors/5/security')
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
        axiosSpies.patch.mockRejectedValueOnce(axiosErr)

        const promise = SensorService.updateSensorSecurity(5, { enabled: true })

        await expect(promise).rejects.toBeInstanceOf(ApiError)
        await expect(promise).rejects.toMatchObject({
            code: 'charging_automation_required',
            message: 'Add a charging automation first.',
        })
    })
})
