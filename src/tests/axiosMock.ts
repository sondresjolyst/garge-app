import { vi } from 'vitest'

/**
 * Spies for the app's axios instance. A test mocks the instance with
 * `vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())`
 * and sets answers on these spies.
 */
export const axiosSpies = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
}

/** The module factory for `@/services/axiosInstance`, with the spies as its default export. */
export const axiosInstanceMock = () => ({ default: axiosSpies })

/** Clears the calls and answers of every spy, for a `beforeEach`. */
export function resetAxiosSpies() {
    for (const spy of Object.values(axiosSpies)) spy.mockReset()
}
