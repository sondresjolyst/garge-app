import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCompanyInfo } from '@/services/companyService'

const json = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: () => Promise.resolve(body),
})

describe('getCompanyInfo', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('reads the public company info from /company, cached under the company tag', async () => {
        const info = { name: 'Garge', orgNumber: '938 517 789', vatRegistered: false }
        const fetchMock = vi.fn().mockResolvedValue(json(info))
        vi.stubGlobal('fetch', fetchMock)

        expect(await getCompanyInfo()).toEqual(info)
        expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/company', { next: { revalidate: 300, tags: ['company'] } })
    })

    it('returns null on a failing response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({}, 500)))

        expect(await getCompanyInfo()).toBeNull()
    })

    it('returns null when the API has no company', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({}, 404)))

        expect(await getCompanyInfo()).toBeNull()
    })

    it('returns null when the body is not JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ...json(null), json: () => Promise.reject(new SyntaxError('Unexpected token')) }))

        expect(await getCompanyInfo()).toBeNull()
    })

    it('returns null when the API cannot be reached', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

        expect(await getCompanyInfo()).toBeNull()
    })
})
