import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/SessionGuard', () => ({ default: () => <p>session guard</p> }))
vi.mock('@sjolystinnovation/app-kit/session/react', () => ({
    AppSessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    ProtectedGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import SessionProviderWrapper from '@/app/SessionProviderWrapper'
import ProtectedLayout from '@/app/(protected)/layout'

// The expiry banner and the re-sign-in prompt belong to signed-in pages only.
describe('session guard placement', () => {
    it('is not part of the root provider, so public pages do not show it', () => {
        render(<SessionProviderWrapper><p>public page</p></SessionProviderWrapper>)

        expect(screen.getByText('public page')).toBeInTheDocument()
        expect(screen.queryByText('session guard')).not.toBeInTheDocument()
    })

    it('is mounted by the protected layout', () => {
        render(<ProtectedLayout><p>account page</p></ProtectedLayout>)

        expect(screen.getByText('account page')).toBeInTheDocument()
        expect(screen.getByText('session guard')).toBeInTheDocument()
    })
})
