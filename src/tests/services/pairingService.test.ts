import { describe, it, expect, vi, beforeEach } from 'vitest'
import PairingService from '@/services/pairingService'

vi.mock('@/services/axiosInstance', () => ({
    default: { post: vi.fn() },
}))

import axiosInstance from '@/services/axiosInstance'

const mockPost = axiosInstance.post as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.clearAllMocks()
})

describe('PairingService', () => {
    it('mints a token via POST /pairing/token', async () => {
        mockPost.mockResolvedValueOnce({ data: { token: 'ABC123', expiresAt: '2026-07-27T12:15:00Z' } })

        const result = await PairingService.mintToken()

        expect(mockPost).toHaveBeenCalledWith('/pairing/token')
        expect(result).toEqual({ token: 'ABC123', expiresAt: '2026-07-27T12:15:00Z' })
    })

    it('wraps failures in a friendly error', async () => {
        mockPost.mockRejectedValueOnce(new Error('network down'))

        await expect(PairingService.mintToken()).rejects.toThrow()
    })
})
