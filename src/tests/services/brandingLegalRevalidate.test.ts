import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axiosSpies } from '@/tests/axiosMock'

const { revalidateTarget } = vi.hoisted(() => ({ revalidateTarget: vi.fn() }))
vi.mock('@/lib/cacheTags', async (original) => ({
    ...(await original<typeof import('@/lib/cacheTags')>()),
    revalidateTarget,
}))
vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import BrandingService from '@/services/brandingService'
import LegalService from '@/services/legalService'

beforeEach(() => {
    revalidateTarget.mockReset().mockResolvedValue(undefined)
    axiosSpies.put.mockReset().mockResolvedValue({ data: {} })
})

describe('admin saves purge the public pages', () => {
    it('a branding save purges the branding target', async () => {
        await BrandingService.update(new FormData())

        expect(revalidateTarget).toHaveBeenCalledWith('branding')
    })

    it('a legal page save purges the legal target', async () => {
        await LegalService.save({ key: 'terms', locale: 'en', title: 'Terms of Service', bodyMarkdown: '## 1.' })

        expect(axiosSpies.put).toHaveBeenCalledWith('/content/legal/terms/en', { title: 'Terms of Service', bodyMarkdown: '## 1.' })
        expect(revalidateTarget).toHaveBeenCalledWith('legal')
    })
})
