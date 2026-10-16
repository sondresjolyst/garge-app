import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { auth, makeSession, navigation, resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'
import Login from '@/app/(auth)/login/page'

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())

const withError = (error?: string) => makeSession({ roles: [], error })

describe('login page', () => {
    beforeEach(resetTestMocks)

    it('sends a signed-in user to the start page', async () => {
        auth.getSession.mockResolvedValue(withError())
        render(<Login />)
        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/'))
    })

    it('stays on the login page when the session has ended', async () => {
        auth.getSession.mockResolvedValue(withError(SESSION_ERRORS.refreshRejected))
        render(<Login />)
        await new Promise((r) => setTimeout(r, 50))
        expect(navigation.router.push).not.toHaveBeenCalled()
    })
})
