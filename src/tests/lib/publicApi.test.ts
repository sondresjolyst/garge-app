import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { publicGet, publicGetOptional } from '@/lib/publicApi'

const fetchMock = vi.fn()

beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
})

const down = () => fetchMock.mockRejectedValue(new TypeError('fetch failed'))
const answers = (status: number, body: unknown = null) =>
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }))

describe('publicGet during next build', () => {
    beforeEach(() => vi.stubEnv('NEXT_PHASE', PHASE_PRODUCTION_BUILD))

    it('builds the page empty when garge-api cannot be reached', async () => {
        down()

        expect(await publicGet('/content/legal/cookies?locale=en')).toBeNull()
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('GET /content/legal/cookies?locale=en failed'))
    })

    it('builds the page empty when garge-api answers 503', async () => {
        answers(503)

        expect(await publicGet('/content/legal/terms?locale=en')).toBeNull()
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('GET /content/legal/terms?locale=en failed with 503'))
    })

    it('still gives what garge-api answers', async () => {
        answers(200, { key: 'terms', title: 'Terms of Service' })

        expect(await publicGet('/content/legal/terms?locale=en')).toEqual({ key: 'terms', title: 'Terms of Service' })
        expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/content/legal/terms?locale=en', { next: { revalidate: 300 } })
    })
})

describe('publicGet at runtime', () => {
    it('throws when garge-api cannot be reached, so ISR keeps the page it has', async () => {
        down()

        await expect(publicGet('/content/legal/cookies?locale=en')).rejects.toThrow('GET /content/legal/cookies?locale=en failed')
        expect(console.warn).not.toHaveBeenCalled()
    })

    it('throws when garge-api answers 503', async () => {
        answers(503)

        await expect(publicGet('/content/legal/privacy?locale=en')).rejects.toThrow('failed with 503')
    })
})

describe('publicGetOptional', () => {
    it('gives null when garge-api is down, at runtime too', async () => {
        down()

        expect(await publicGetOptional('/company')).toBeNull()
    })

    it('gives null when garge-api is down during next build', async () => {
        vi.stubEnv('NEXT_PHASE', PHASE_PRODUCTION_BUILD)
        down()

        expect(await publicGetOptional('/company')).toBeNull()
    })
})
