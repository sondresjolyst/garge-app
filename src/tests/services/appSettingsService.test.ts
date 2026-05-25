import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPublicAppSettings } from '@/services/appSettingsService'
import type { AppSettings } from '@/services/adminService'

const SETTINGS: AppSettings = {
    cookieBannerEnabled: true,
    vatEnabled: false,
    vippsTestMode: true,
}

describe('getPublicAppSettings', () => {
    const originalUrl = process.env.NEXT_PUBLIC_API_URL

    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test/api'
    })

    afterEach(() => {
        process.env.NEXT_PUBLIC_API_URL = originalUrl
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('fetches and returns the parsed settings on success', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(SETTINGS),
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await getPublicAppSettings()

        expect(result).toEqual(SETTINGS)
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.example.test/api/admin/settings',
            { cache: 'no-store' },
        )
    })

    it('returns null when the URL is not configured', async () => {
        delete process.env.NEXT_PUBLIC_API_URL
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        const result = await getPublicAppSettings()

        expect(result).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('returns null on a non-ok response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

        expect(await getPublicAppSettings()).toBeNull()
    })

    it('returns null when fetch rejects (backend unreachable)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

        expect(await getPublicAppSettings()).toBeNull()
    })
})
