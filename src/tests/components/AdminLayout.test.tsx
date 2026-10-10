import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Session } from 'next-auth'
import AdminLayout from '@/app/(protected)/admin/layout'

const replace = vi.fn()
let session: { data: Session | null; status: 'loading' | 'authenticated' | 'unauthenticated' }

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace, push: vi.fn() }),
    usePathname: () => '/admin/orders',
}))
vi.mock('next-auth/react', () => ({ useSession: () => session }))

const withRoles = (roles: string[]): Session => ({
    user: { id: '1', name: 'ada', email: 'a@b.no', roles } as Session['user'],
    accessToken: 'token',
    expires: '',
} as Session)

const layout = () => (
    <AdminLayout>
        <p>admin work</p>
    </AdminLayout>
)

// The role check itself is tested in app-kit. These tests cover what garge passes to it.
describe('admin layout', () => {
    beforeEach(() => replace.mockClear())

    it('renders admin pages for an admin', () => {
        session = { data: withRoles(['Admin']), status: 'authenticated' }
        render(layout())

        expect(screen.getByText('admin work')).toBeInTheDocument()
        expect(replace).not.toHaveBeenCalled()
    })

    it('sends a signed-in user without the admin role to the start page', () => {
        session = { data: withRoles([]), status: 'authenticated' }
        render(layout())

        expect(screen.queryByText('admin work')).not.toBeInTheDocument()
        expect(replace).toHaveBeenCalledWith('/')
    })
})
