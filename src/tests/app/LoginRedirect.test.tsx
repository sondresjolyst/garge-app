import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { auth, makeSession, navigation, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'
import { SESSION_ERRORS, type SessionError } from '@sjolystinnovation/app-kit/session'
import Login from '@/app/(auth)/login/page'

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())

const withError = (error?: SessionError) => makeSession({ roles: [], error })

describe('login page', () => {
    beforeEach(resetTestMocks)

    it('sends a signed-in user to the profile without showing the form', async () => {
        setSession(withError())
        render(<Login />)
        await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith('/profile'))
        expect(navigation.router.push).not.toHaveBeenCalled()
        expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
    })

    it('shows the form only once the session check has settled', async () => {
        setSession('loading')
        const { rerender } = render(<Login />)

        expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
        setSession(null)
        rerender(<Login />)
        expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    })

    it('stays on the login page when the session has ended', async () => {
        setSession(withError(SESSION_ERRORS.refreshRejected))
        render(<Login />)
        expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
        expect(navigation.router.push).not.toHaveBeenCalled()
    })

    // next-auth reports a failed session read as no session.
    it('shows the form when there is no session', async () => {
        setSession(null)
        render(<Login />)
        expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('keeps the form when the session changes after it is shown', async () => {
        const { rerender } = render(<Login />)
        expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()

        setSession(withError())
        rerender(<Login />)
        expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('keeps the logo, the title, the register link and the forgot password link', async () => {
        render(<Login />)

        expect(screen.getByAltText('Garge')).toBeInTheDocument()
        expect(await screen.findByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/register')
        expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute('href', '/reset-password')
        // The session comes from the provider, so the page sends no session read of its own.
        expect(auth.getSession).not.toHaveBeenCalled()
    })

    it('signs in and goes to the profile', async () => {
        auth.signIn.mockResolvedValue({ ok: true, error: null, status: 200, url: null })
        render(<Login />)

        fireEvent.change(await screen.findByLabelText(/Email/), { target: { value: 'ada@garge.no' } })
        fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'secret' } })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/profile'))
        expect(auth.signIn).toHaveBeenCalledWith('credentials', { email: 'ada@garge.no', password: 'secret', redirect: false })
        expect(navigation.router.refresh).toHaveBeenCalled()
    })

    it('says when the credentials are wrong', async () => {
        auth.signIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin', status: 401, url: null })
        render(<Login />)

        fireEvent.change(await screen.findByLabelText(/Email/), { target: { value: 'ada@garge.no' } })
        fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'wrong' } })
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

        expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
        expect(navigation.router.push).not.toHaveBeenCalled()
    })
})
