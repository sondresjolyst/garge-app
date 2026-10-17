import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LegalPage } from '@/services/legalService'

const { publicGet } = vi.hoisted(() => ({ publicGet: vi.fn() }))
vi.mock('@/lib/publicApi', () => ({ publicGet }))

import TermsPage, { revalidate } from '@/app/terms/page'
import PrivacyPage from '@/app/privacy/page'
import CookiesPage from '@/app/cookies/page'

const page = (key: LegalPage['key'], title: string, bodyMarkdown: string): LegalPage =>
    ({ key, locale: 'en', title, bodyMarkdown, updatedAt: '2026-10-17T08:00:00Z' })

beforeEach(() => publicGet.mockReset())

describe('legal pages', () => {
    it.each([
        ['terms', TermsPage],
        ['privacy', PrivacyPage],
        ['cookies', CookiesPage],
    ] as const)('reads the %s page in English from the API', async (key, Page) => {
        publicGet.mockResolvedValue(null)
        await Page()

        expect(publicGet).toHaveBeenCalledWith(`/content/legal/${key}?locale=en`)
    })

    it('renders the Markdown, the title and the date the admin saved', async () => {
        publicGet.mockResolvedValue(page('terms', 'Terms of Service',
            '## 1. About us (seller)\n\nThe seller is:\n\n- **Company name:** Sjølyst Innovation AS\n\nSee our [Privacy Policy](/privacy).'))
        render(await TermsPage())

        expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: '1. About us (seller)' })).toBeInTheDocument()
        expect(screen.getByText('Company name:').parentElement).toHaveTextContent('Company name: Sjølyst Innovation AS')
        expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
        expect(screen.getByText('Last updated: 17 October 2026')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: '← Back to home' })).toHaveAttribute('href', '/')
    })

    it.each([
        [TermsPage, 'Terms of Service'],
        [PrivacyPage, 'Privacy Policy'],
        [CookiesPage, 'Cookie Policy'],
    ] as const)('keeps heading %# while nobody has written the page', async (Page, title) => {
        publicGet.mockResolvedValue(null)
        render(await Page())

        expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
        expect(screen.getByText('This content has not been written yet.')).toBeInTheDocument()
    })

    it('renders inside the dark palette scope', async () => {
        publicGet.mockResolvedValue(null)
        const { container } = render(await PrivacyPage())

        expect(container.firstElementChild).toHaveClass('appkit-dark')
    })

    it('revalidates every five minutes', () => {
        expect(revalidate).toBe(300)
    })
})
