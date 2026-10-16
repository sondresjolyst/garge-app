import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeSession, navigation, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'
import AdminLayout from '@/app/(protected)/admin/layout'

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())

const layout = () => (
    <AdminLayout>
        <p>admin work</p>
    </AdminLayout>
)

// The role check itself is tested in app-kit. These tests cover what garge passes to it.
describe('admin layout', () => {
    beforeEach(() => {
        resetTestMocks()
        navigation.pathname = '/admin/orders'
    })

    it('renders admin pages for an admin', () => {
        setSession(makeSession({ roles: ['Admin'] }))
        render(layout())

        expect(screen.getByText('admin work')).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('sends a signed-in user without the admin role to the start page', () => {
        setSession(makeSession({ roles: [] }))
        render(layout())

        expect(screen.queryByText('admin work')).not.toBeInTheDocument()
        expect(navigation.router.replace).toHaveBeenCalledWith('/')
    })
})
