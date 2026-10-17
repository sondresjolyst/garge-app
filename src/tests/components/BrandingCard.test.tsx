import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrandingProvider } from '@sjolystinnovation/app-kit/branding'

const { update } = vi.hoisted(() => ({ update: vi.fn() }))
vi.mock('@/services/brandingService', () => ({ default: { update, get: () => Promise.resolve({}) } }))
vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())

import BrandingCard from '@/components/admin/BrandingCard'

beforeEach(() => update.mockReset().mockResolvedValue({}))

describe('BrandingCard', () => {
    it('uploads a new logo through the branding service', async () => {
        const { container } = render(
            <BrandingProvider load={() => Promise.resolve({})} initial={{}}>
                <BrandingCard />
            </BrandingProvider>,
        )
        const file = new File(['png'], 'logo.png', { type: 'image/png' })

        fireEvent.change(screen.getByLabelText('Logo'), { target: { files: [file] } })
        fireEvent.click(screen.getByRole('button', { name: 'Save branding' }))

        await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
        expect((update.mock.calls[0]![0] as FormData).get('logo')).toBe(file)
        expect(screen.getByText('Logo and favicon')).toBeInTheDocument()
        expect(container.firstElementChild).toHaveClass('appkit-dark')
    })
})
