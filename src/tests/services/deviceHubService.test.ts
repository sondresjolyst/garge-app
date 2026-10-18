import { describe, it, expect, vi, beforeEach } from 'vitest'
import DeviceHubService from '@/services/deviceHubService'

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock'

beforeEach(() => {
    resetTestMocks()
    resetAxiosSpies()
})

describe('DeviceHubService', () => {
    it('gets a ticket via POST /hub-tickets', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { ticket: 'abc_DEF-123', expiresIn: 60 } })

        const ticket = await DeviceHubService.getTicket()

        expect(axiosSpies.post).toHaveBeenCalledWith('/hub-tickets')
        expect(ticket).toBe('abc_DEF-123')
    })

    it('rejects with the original failure, so the caller can read the status', async () => {
        const failure = Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
        axiosSpies.post.mockRejectedValueOnce(failure)

        await expect(DeviceHubService.getTicket()).rejects.toBe(failure)
    })
})
