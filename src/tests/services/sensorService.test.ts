import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import SensorService from '@/services/sensorService'
import { apiErrorCode } from '@sjolystinnovation/app-kit/api'

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

    const refused = (status: number, data: unknown) => {
        const axiosErr = new AxiosError('Request failed')
        axiosErr.response = { data, status, statusText: '', headers: {}, config: { headers: {} } as never }
        return axiosErr
    }

    const securityCalls = [
        { name: 'getSensorSecurity', spy: () => axiosSpies.get, call: () => SensorService.getSensorSecurity(5), fallback: 'Failed to load Garge Security' },
        { name: 'updateSensorSecurity', spy: () => axiosSpies.patch, call: () => SensorService.updateSensorSecurity(5, { enabled: true }), fallback: 'Failed to save Garge Security' },
        { name: 'disableSensorSecurity', spy: () => axiosSpies.delete, call: () => SensorService.disableSensorSecurity(5), fallback: 'Failed to turn off Garge Security' },
    ]

    it.each(securityCalls)('$name keeps the API error code and message when it is refused', async ({ spy, call }) => {
        spy().mockRejectedValueOnce(refused(400, { code: 'charging_automation_required', message: 'Add a charging automation first.' }))

        const err = await call().catch((e: unknown) => e)

        expect(err).toBeInstanceOf(Error)
        expect((err as Error).message).toBe('Add a charging automation first.')
        expect(apiErrorCode(err)).toBe('charging_automation_required')
    })

    it.each(securityCalls)("$name gives no code when the API sent none, and Garge's text for the status", async ({ spy, call }) => {
        spy().mockRejectedValueOnce(refused(403, {}))

        const err = await call().catch((e: unknown) => e)

        expect((err as Error).message).toBe('Not authorized.')
        expect(apiErrorCode(err)).toBeUndefined()
    })

    it.each(securityCalls)('$name falls back to its own text when the API says nothing', async ({ spy, call, fallback }) => {
        spy().mockRejectedValueOnce(refused(500, {}))

        await expect(call()).rejects.toThrow(fallback)
    })

    it('ignores a code that is not text, as before', async () => {
        axiosSpies.patch.mockRejectedValueOnce(refused(400, { code: 42, message: 'Bad.' }))

        const err = await SensorService.updateSensorSecurity(5, { enabled: true }).catch((e: unknown) => e)

        expect(apiErrorCode(err)).toBeUndefined()
    })
})
