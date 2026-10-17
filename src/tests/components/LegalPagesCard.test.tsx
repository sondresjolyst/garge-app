import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { listAll, save } = vi.hoisted(() => ({ listAll: vi.fn(), save: vi.fn() }))
vi.mock('@/services/legalService', async (original) => ({
    ...(await original<typeof import('@/services/legalService')>()),
    default: { listAll, save },
}))
vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())

import LegalPagesCard from '@/components/admin/LegalPagesCard'

beforeEach(() => {
    listAll.mockReset().mockResolvedValue([
        { key: 'terms', locale: 'en', title: 'Terms of Service', bodyMarkdown: '## 1. About us', updatedAt: '2026-10-17T08:00:00Z' },
        { key: 'cookies', locale: 'en', title: 'Cookie Policy', bodyMarkdown: '## What are cookies?', updatedAt: '2026-10-17T08:00:00Z' },
    ])
    save.mockReset().mockResolvedValue(undefined)
})

describe('LegalPagesCard', () => {
    it('edits the three pages in English, inside the dark palette scope', async () => {
        const { container } = render(<LegalPagesCard />)

        expect(await screen.findByDisplayValue('Terms of Service')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Terms' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Privacy' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cookies' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
        expect(container.firstElementChild).toHaveClass('appkit-dark')
    })

    it('saves the open page under the English locale', async () => {
        render(<LegalPagesCard />)

        fireEvent.click(await screen.findByRole('button', { name: 'Cookies' }))
        fireEvent.change(screen.getByLabelText('Content (Markdown)'), { target: { value: '## Changed' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(save).toHaveBeenCalledWith({ key: 'cookies', locale: 'en', title: 'Cookie Policy', bodyMarkdown: '## Changed' }))
    })
})
