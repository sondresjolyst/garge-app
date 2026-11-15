import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { makeSession, navigation, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())
vi.mock('@/components/SessionGuard', () => ({ default: () => null }))
vi.mock('@/app/DeviceDashboard', () => ({ default: () => <p>dashboard</p> }))
vi.mock('@/app/MarketingPage', () => ({ default: () => <p>marketing</p> }))

import HomePage from '@/app/page'

describe('home page', () => {
    beforeEach(() => {
        resetTestMocks()
        navigation.pathname = '/'
    })

    it('shows the marketing page to a signed-out visitor', () => {
        render(<HomePage />)

        expect(screen.getByText('marketing')).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('shows the dashboard to a signed-in user', () => {
        setSession(makeSession({ roles: [] }))
        render(<HomePage />)

        expect(screen.getByText('dashboard')).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it.each(Object.values(SESSION_ERRORS))('sends a visitor whose session ended with %s to the login page', async (error) => {
        setSession(makeSession({ roles: [], error }))
        render(<HomePage />)

        await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith('/login'))
        expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
    })
})
