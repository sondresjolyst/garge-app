import { describe, it, expect } from 'vitest'
import { axiosInstanceMock, axiosSpies, resetAxiosSpies } from '@/tests/axiosMock'

describe('the axios test helper', () => {
    it('serves the spies as the default export of the mocked instance', () => {
        expect(axiosInstanceMock().default).toBe(axiosSpies)
    })

    it('drops every answer a test left on the spies', async () => {
        for (const spy of Object.values(axiosSpies)) spy.mockResolvedValue({ data: 'left over' })

        resetAxiosSpies()

        for (const spy of Object.values(axiosSpies)) expect(spy()).toBeUndefined()
    })
})
