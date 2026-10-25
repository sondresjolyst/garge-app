import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { makeSession, navigation, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())
vi.mock('@/components/SessionGuard', () => ({ default: () => null }))

import ProtectedLayout from '@/app/(protected)/layout'
import AdminLayout from '@/app/(protected)/admin/layout'

// The protected layouts are the only auth gate, so they alone must keep signed-out and non-admin visitors out.
describe('protected layouts', () => {
    beforeEach(() => {
        resetTestMocks()
        navigation.pathname = '/profile'
    })

    it('sends a signed-out visitor to the login page without rendering the page', async () => {
        render(<ProtectedLayout><p>account page</p></ProtectedLayout>)

        await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith('/login'))
        expect(screen.queryByText('account page')).not.toBeInTheDocument()
    })

    it.each(Object.values(SESSION_ERRORS))('sends a visitor whose session ended with %s to the login page', async (error) => {
        setSession(makeSession({ roles: [], error }))
        render(<ProtectedLayout><p>account page</p></ProtectedLayout>)

        await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith('/login'))
        expect(screen.queryByText('account page')).not.toBeInTheDocument()
    })

    it('renders the page for a signed-in user', () => {
        setSession(makeSession({ roles: [] }))
        render(<ProtectedLayout><p>account page</p></ProtectedLayout>)

        expect(screen.getByText('account page')).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('sends a signed-in user without the admin role away from admin pages', async () => {
        navigation.pathname = '/admin'
        setSession(makeSession({ roles: [] }))
        render(<ProtectedLayout><AdminLayout><p>admin page</p></AdminLayout></ProtectedLayout>)

        await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith('/'))
        expect(screen.queryByText('admin page')).not.toBeInTheDocument()
    })

    it('renders admin pages for an admin', () => {
        navigation.pathname = '/admin'
        setSession(makeSession({ roles: ['Admin'] }))
        render(<ProtectedLayout><AdminLayout><p>admin page</p></AdminLayout></ProtectedLayout>)

        expect(screen.getByText('admin page')).toBeInTheDocument()
    })
})
