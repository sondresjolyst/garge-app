import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'

let session: { data: unknown; status: string }
vi.mock('next-auth/react', () => ({ useSession: () => session, signOut: vi.fn() }))

import Navbar from '@/app/navbar'

const user = (extra: Record<string, unknown> = {}) => ({ user: { id: 'u1', name: 'ada', roles: ['Admin'] }, ...extra })

describe('navbar', () => {
    it('shows the user, the admin link and Logout while signed in', () => {
        session = { data: user(), status: 'authenticated' }
        render(<Navbar />)

        expect(screen.getByText('ada')).toBeInTheDocument()
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.getByTitle('Logout')).toBeInTheDocument()
        expect(screen.queryByText('Sign in')).not.toBeInTheDocument()
    })

    it.each(Object.values(SESSION_ERRORS))('shows the signed-out links once the session ended with %s', (error) => {
        session = { data: user({ error }), status: 'authenticated' }
        render(<Navbar />)

        expect(screen.getByText('Sign in')).toBeInTheDocument()
        expect(screen.getByText('Create account')).toBeInTheDocument()
        expect(screen.queryByText('ada')).not.toBeInTheDocument()
        expect(screen.queryByTitle('Logout')).not.toBeInTheDocument()
    })

    it('shows the signed-out links without a session', () => {
        session = { data: null, status: 'unauthenticated' }
        render(<Navbar />)

        expect(screen.getByText('Sign in')).toBeInTheDocument()
    })
})
