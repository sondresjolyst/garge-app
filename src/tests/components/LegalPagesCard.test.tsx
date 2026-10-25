import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { listAll, save, listRevisions } = vi.hoisted(() => ({ listAll: vi.fn(), save: vi.fn(), listRevisions: vi.fn() }))
vi.mock('@/services/legalService', async (original) => ({
    ...(await original<typeof import('@/services/legalService')>()),
    default: { listAll, save, listRevisions },
}))
vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())

import LegalPagesCard from '@/components/admin/LegalPagesCard'

beforeEach(() => {
    listAll.mockReset().mockResolvedValue([
        { key: 'terms', locale: 'en', title: 'Terms of Service', bodyMarkdown: '## 1. About us', updatedAt: '2026-10-17T08:00:00Z', version: 'v-2026-10-17' },
        { key: 'cookies', locale: 'en', title: 'Cookie Policy', bodyMarkdown: '## What are cookies?', updatedAt: '2026-10-17T08:00:00Z', version: 'v-2026-10-17' },
    ])
    save.mockReset().mockResolvedValue(undefined)
    listRevisions.mockReset().mockResolvedValue([])
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

    it('lists the saved versions of the open page with the day before the month', async () => {
        listRevisions.mockResolvedValue([
            { id: 2, savedAt: '2026-10-17T12:00:00Z', title: 'Terms of Service' },
            { id: 1, savedAt: '2026-10-16T12:00:00Z', title: 'Terms' },
        ])
        render(<LegalPagesCard />)

        const versions = await screen.findAllByRole('button', { pressed: false, name: /Oct 2026/ })
        expect(versions).toHaveLength(2)
        expect(versions[0]).toHaveTextContent(/17 Oct 2026/)
        expect(versions[1]).toHaveTextContent(/16 Oct 2026/)
        expect(listRevisions).toHaveBeenCalledWith('terms', 'en')
    })
})
