import { describe, it, expect, vi, beforeEach } from 'vitest'
import SwitchService from '@/services/switchService'

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock'

beforeEach(() => {
    resetTestMocks()
    resetAxiosSpies()
})

describe('SwitchService sharing', () => {
    it('maps the API integer permission to a string in getSwitchShares', async () => {
        axiosSpies.get.mockResolvedValueOnce({
            data: [
                { userId: 'u1', email: 'a@x', firstName: 'A', lastName: 'B', permission: 1, sharedAt: '2026-01-01' },
                { userId: 'u2', email: 'c@x', firstName: 'C', lastName: 'D', permission: 0, sharedAt: '2026-01-02' },
            ],
        })

        const shares = await SwitchService.getSwitchShares(7)

        expect(axiosSpies.get).toHaveBeenCalledWith('/switches/7/shares')
        expect(shares[0].permission).toBe('edit')
        expect(shares[1].permission).toBe('read')
    })

    it('sends the integer permission when sharing (edit=1)', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SwitchService.shareSwitch(7, 'a@x', 'edit')
        expect(axiosSpies.post).toHaveBeenCalledWith('/switches/7/share', { email: 'a@x', permission: 1 })
    })

    it('sends the integer permission when sharing (read=0)', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SwitchService.shareSwitch(7, 'a@x', 'read')
        expect(axiosSpies.post).toHaveBeenCalledWith('/switches/7/share', { email: 'a@x', permission: 0 })
    })

    it('revokeSwitchShare deletes the share by user id', async () => {
        axiosSpies.delete.mockResolvedValueOnce({ data: { message: 'ok' } })
        await SwitchService.revokeSwitchShare(7, 'u1')
        expect(axiosSpies.delete).toHaveBeenCalledWith('/switches/7/share/u1')
    })
})
