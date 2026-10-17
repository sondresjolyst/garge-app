// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { encode } from 'next-auth/jwt'
import jwt from 'jsonwebtoken'

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }))

const SECRET = 'test-nextauth-secret'
process.env.NEXTAUTH_SECRET = SECRET

import { POST } from '@/app/api/revalidate/route'
import { TARGET_PATHS } from '@/lib/cacheTags'

async function cookieFor(roles: string[]): Promise<string> {
    const accessToken = jwt.sign({ sub: 'u1' }, 'api-secret', { expiresIn: '10m' })
    const value = await encode({ secret: SECRET, token: { user: { id: 'u1', name: 'ada', email: 'ada@garge.no', roles }, accessToken, loginAt: Date.now() } })
    return `next-auth.session-token=${value}`
}

function post(body: unknown, cookie?: string): NextRequest {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (cookie) headers.cookie = cookie
    return new NextRequest('http://localhost/api/revalidate', { method: 'POST', headers, body: JSON.stringify(body) })
}

beforeEach(() => {
    revalidatePath.mockReset()
    revalidateTag.mockReset()
})

describe('cache targets', () => {
    it('purges the legal pages at their own paths, since garge has no locales', () => {
        expect(TARGET_PATHS).toEqual({ legal: ['/terms', '/privacy', '/cookies', '/sitemap.xml'], branding: [] })
    })
})

describe('POST /api/revalidate', () => {
    it('refuses an anonymous caller', async () => {
        const response = await POST(post({ target: 'legal' }))

        expect(response.status).toBe(403)
        expect(revalidateTag).not.toHaveBeenCalled()
    })

    it('refuses a signed-in user without the Admin role', async () => {
        const response = await POST(post({ target: 'legal' }, await cookieFor(['Default'])))

        expect(response.status).toBe(403)
        expect(revalidateTag).not.toHaveBeenCalled()
    })

    it('purges the legal pages and their tag for an admin', async () => {
        const response = await POST(post({ target: 'legal' }, await cookieFor(['Admin'])))

        expect(response.status).toBe(200)
        expect(revalidatePath.mock.calls.map(c => c[0])).toEqual(['/terms', '/privacy', '/cookies', '/sitemap.xml'])
        expect(revalidateTag).toHaveBeenCalledWith('legal', { expire: 0 })
    })

    it('purges the branding tag for an admin', async () => {
        const response = await POST(post({ target: 'branding' }, await cookieFor(['Admin'])))

        expect(response.status).toBe(200)
        expect(revalidatePath).not.toHaveBeenCalled()
        expect(revalidateTag).toHaveBeenCalledWith('branding', { expire: 0 })
    })

    it('refuses an unknown target', async () => {
        const response = await POST(post({ target: 'users' }, await cookieFor(['Admin'])))

        expect(response.status).toBe(400)
    })
})
