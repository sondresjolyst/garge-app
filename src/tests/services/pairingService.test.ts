import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})
