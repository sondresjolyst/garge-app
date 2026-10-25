import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { navigation, resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { AppSessionProvider } from '@sjolystinnovation/app-kit/session/react'
import Login from '@/app/(auth)/login/page'

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())

// The real next-auth client runs against this fake auth route. Like next-auth, the route gives a
// fresh CSRF cookie to any request that arrives without one, and the cookie is stored when the
// answer lands. The fake holds back a second cookieless session read until the CSRF token has been
// handed out, so its cookie lands last, as it does when that read answers slowly.
function fakeAuthRoute() {
    const jar: { csrf?: string } = {}
    let issued = 0
    let sessionReads = 0
    let signedIn = false
    const held: Array<() => void> = []
    const calls: string[] = []

    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

    const fetchStub = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const path = new URL(String(input), 'http://localhost:3000').pathname.replace('/api/auth/', '')
        calls.push(path)
        const sent = jar.csrf
        const fresh = sent ? undefined : `token-${++issued}`
        // Every answer takes a moment, so reads sent together are in flight together.
        await new Promise((resolve) => setTimeout(resolve, 5))
        const answer = (body: unknown) => {
            if (fresh) jar.csrf = fresh
            return json(body)
        }

        switch (path) {
            case 'session': {
                sessionReads += 1
                const body = () => signedIn ? { user: { id: '1', name: 'Ada', email: 'ada@garge.no', roles: [] }, expires: '2099-01-01T00:00:00.000Z' } : {}
                if (sessionReads > 1 && !sent) return new Promise((resolve) => held.push(() => resolve(answer(body()))))
                return answer(body())
            }
            case 'providers':
                return answer({ credentials: { id: 'credentials', name: 'Credentials', type: 'credentials', signinUrl: '', callbackUrl: '' } })
            case 'csrf': {
                const response = answer({ csrfToken: sent ?? fresh })
                held.splice(0).forEach((release) => release())
                return response
            }
            case 'callback/credentials': {
                const token = new URLSearchParams(String(init?.body)).get('csrfToken')
                if (token !== sent) return answer({ url: 'http://localhost:3000/api/auth/signin?csrf=true' })
                signedIn = true
                return answer({ url: 'http://localhost:3000/login' })
            }
            default:
                return json({})
        }
    }

    return { fetchStub, calls }
}

describe('login page on a first visit', () => {
    beforeEach(resetTestMocks)
    afterEach(() => vi.unstubAllGlobals())

    it('signs in when the form is sent right away', async () => {
        const route = fakeAuthRoute()
        vi.stubGlobal('fetch', vi.fn(route.fetchStub))

        render(<AppSessionProvider><Login /></AppSessionProvider>)

        fireEvent.change(await screen.findByLabelText(/Email/), { target: { value: 'ada@garge.no' } })
        fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'secret' } })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        // The button reads Sign in again once the sign-in has settled either way.
        await waitFor(() => expect(route.calls).toContain('callback/credentials'))
        await screen.findByRole('button', { name: 'Sign in' })
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
        expect(navigation.router.push).toHaveBeenCalledWith('/profile')
    })
})
