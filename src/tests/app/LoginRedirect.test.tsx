import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import type { Session } from 'next-auth'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'
import Login from '@/app/(auth)/login/page'

const push = vi.fn()
let session: Session | null

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }) }))
vi.mock('next-auth/react', () => ({ getSession: async () => session, signIn: vi.fn() }))

const withError = (error?: string): Session => ({
    user: { id: '1', name: 'ada', email: 'a@b.no', roles: [] } as Session['user'],
    accessToken: 'token',
    expires: '',
    error,
} as Session)

describe('login page', () => {
    beforeEach(() => push.mockClear())

    it('sends a signed-in user to the start page', async () => {
        session = withError()
        render(<Login />)
        await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
    })

    it('stays on the login page when the session has ended', async () => {
        session = withError(SESSION_ERRORS.refreshRejected)
        render(<Login />)
        await new Promise((r) => setTimeout(r, 50))
        expect(push).not.toHaveBeenCalled()
    })
})
