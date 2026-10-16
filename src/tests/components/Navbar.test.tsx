import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'
import { makeSession, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'

vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())

import Navbar from '@/app/navbar'

const user = (error?: string) => makeSession({ user: { id: 'u1', name: 'ada', email: 'a@b.no', roles: ['Admin'] }, error })

beforeEach(resetTestMocks)

describe('navbar', () => {
    it('shows the user, the admin link and Logout while signed in', () => {
        setSession(user())
        render(<Navbar />)

        expect(screen.getByText('ada')).toBeInTheDocument()
        expect(screen.getByText('Admin')).toBeInTheDocument()
        expect(screen.getByTitle('Logout')).toBeInTheDocument()
        expect(screen.queryByText('Sign in')).not.toBeInTheDocument()
    })

    it.each(Object.values(SESSION_ERRORS))('shows the signed-out links once the session ended with %s', (error) => {
        setSession(user(error))
        render(<Navbar />)

        expect(screen.getByText('Sign in')).toBeInTheDocument()
        expect(screen.getByText('Create account')).toBeInTheDocument()
        expect(screen.queryByText('ada')).not.toBeInTheDocument()
        expect(screen.queryByTitle('Logout')).not.toBeInTheDocument()
    })

    it('shows the signed-out links without a session', () => {
        setSession(null)
        render(<Navbar />)

        expect(screen.getByText('Sign in')).toBeInTheDocument()
    })
})
