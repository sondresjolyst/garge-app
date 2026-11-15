import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import PairingService from '@/services/pairingService'

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock'

beforeEach(() => {
    resetTestMocks()
    resetAxiosSpies()
})

describe('PairingService', () => {
    it('mints a token via POST /pairing/token', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { token: 'ABC123', expiresAt: '2026-07-27T12:15:00Z' } })

        const result = await PairingService.mintToken()

        expect(axiosSpies.post).toHaveBeenCalledWith('/pairing/token')
        expect(result).toEqual({ token: 'ABC123', expiresAt: '2026-07-27T12:15:00Z' })
    })

    it('wraps failures in a friendly error', async () => {
        axiosSpies.post.mockRejectedValueOnce(new Error('network down'))

        await expect(PairingService.mintToken()).rejects.toThrow()
    })
    it('gets the status of a code via GET /pairing/token/{token}', async () => {
        const body = { status: 'paired', sensorIds: [3, 8], switchIds: [] }
        axiosSpies.get.mockResolvedValueOnce({ data: body })

        const result = await PairingService.getStatus('ABC123')

        expect(axiosSpies.get).toHaveBeenCalledWith('/pairing/token/ABC123')
        expect(result).toEqual(body)
    })

    it('returns null when the API answers 404', async () => {
        const headers = new AxiosHeaders()
        axiosSpies.get.mockRejectedValueOnce(new AxiosError('Not Found', 'ERR_BAD_REQUEST', { headers }, null, {
            status: 404, statusText: 'Not Found', data: null, headers: {}, config: { headers },
        }))

        await expect(PairingService.getStatus('ABC123')).resolves.toBeNull()
    })

    it('throws on other status errors', async () => {
        axiosSpies.get.mockRejectedValueOnce(new Error('network down'))

        await expect(PairingService.getStatus('ABC123')).rejects.toThrow()
    })
})
