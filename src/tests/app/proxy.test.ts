// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'
import middleware from '@/proxy'

let token: Record<string, unknown> | null
vi.mock('next-auth/jwt', () => ({ getToken: async () => token }))

const visit = async (path: string) => {
    const res = await middleware(new NextRequest(`http://localhost${path}`))
    const location = res.headers.get('location')
    return location ? new URL(location).pathname : 'next'
}

const signedIn = (extra: Record<string, unknown> = {}) => ({
    accessToken: 'token', user: { id: '1', roles: [] }, ...extra,
})

describe('proxy', () => {
    beforeEach(() => { token = null })

    it('sends a visitor without a session to the login page', async () => {
        expect(await visit('/profile')).toBe('/login')
        expect(await visit('/login')).toBe('next')
    })

    it('sends a signed-in user from the login page to their profile', async () => {
        token = signedIn()
        expect(await visit('/login')).toBe('/profile')
        expect(await visit('/profile')).toBe('next')
    })

    it.each(Object.values(SESSION_ERRORS))('treats a session that ended with %s as signed out', async (error) => {
        token = signedIn({ error })
        expect(await visit('/login')).toBe('next')
        expect(await visit('/profile')).toBe('/login')
    })

    it('sends a signed-in user without the admin role away from admin pages', async () => {
        token = signedIn()
        expect(await visit('/admin/orders')).toBe('/')
        token = signedIn({ user: { id: '1', roles: ['Admin'] } })
        expect(await visit('/admin/orders')).toBe('next')
    })
})
