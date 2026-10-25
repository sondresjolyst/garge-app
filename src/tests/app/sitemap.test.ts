import { describe, it, expect, vi, beforeEach } from 'vitest'

const { publicGet } = vi.hoisted(() => ({ publicGet: vi.fn() }))
vi.mock('@/lib/publicApi', () => ({ publicGet }))

import sitemap, { revalidate } from '@/app/sitemap'

const saved: Record<string, string> = {
    terms: '2026-10-01T08:00:00Z',
    privacy: '2026-10-02T09:30:00Z',
    cookies: '2026-10-03T10:45:00Z',
}

beforeEach(() => {
    publicGet.mockReset()
    publicGet.mockImplementation(async (path: string) => {
        const key = /^\/content\/legal\/(\w+)\?locale=en$/.exec(path)?.[1]
        return key && saved[key] ? { key, locale: 'en', title: key, bodyMarkdown: '', updatedAt: saved[key], version: 'v1' } : null
    })
})

describe('sitemap', () => {
    it('lists the front page, the contact page and every legal page, dated by its last save', async () => {
        expect(await sitemap()).toEqual([
            { url: 'https://www.garge.no' },
            { url: 'https://www.garge.no/contact' },
            { url: 'https://www.garge.no/terms', lastModified: new Date(saved.terms) },
            { url: 'https://www.garge.no/privacy', lastModified: new Date(saved.privacy) },
            { url: 'https://www.garge.no/cookies', lastModified: new Date(saved.cookies) },
        ])
    })

    it('reads each legal page in English with the legal cache tag, so a save purges the sitemap', async () => {
        await sitemap()

        expect(publicGet.mock.calls).toEqual([
            ['/content/legal/terms?locale=en', { tags: ['legal'] }],
            ['/content/legal/privacy?locale=en', { tags: ['legal'] }],
            ['/content/legal/cookies?locale=en', { tags: ['legal'] }],
        ])
    })

    it('leaves the date out for a legal page an admin never saved', async () => {
        delete saved.cookies
        try {
            expect((await sitemap()).find(e => e.url.endsWith('/cookies'))).toEqual({ url: 'https://www.garge.no/cookies' })
        } finally {
            saved.cookies = '2026-10-03T10:45:00Z'
        }
    })

    it('fails rather than serve a sitemap without dates when the API is down', async () => {
        publicGet.mockRejectedValue(new Error('GET failed'))
        await expect(sitemap()).rejects.toThrow('GET failed')
    })

    it('falls back to the public API cache time when a purge is missed', () => {
        expect(revalidate).toBe(300)
    })
})
